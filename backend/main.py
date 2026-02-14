"""
HazLabel API - GHS Compliance Platform

Endpoints for parsing Safety Data Sheets, managing chemical inventory,
and generating compliant GHS labels for industrial use.
"""
import env_utils
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse, Response
from parser import extract_text_from_pdf, parse_sds_with_ai, parse_sds_with_validation
from models import GHSLabel, GHSLabelValidated, ValidationResponse, GHSCodeInfo
from database import save_chemical, get_chemicals, get_chemical_by_id, delete_chemical, log_audit, get_audit_logs
from jobs import inngest_client, parse_sds_job
from printer import generate_avery_5163_pdf
from dependencies import verify_user, verify_subscription
import webhooks
# Already imported at top

from validation import (
    validate_ghs_label,
    get_code_info,
    get_all_valid_h_codes,
    get_all_valid_p_codes,
    suggest_pictograms_for_codes,
    GHS_H_CODES,
    GHS_P_CODES
)
import shutil
import os
import tempfile
from typing import List, Optional
import inngest.fast_api
from typing import Any
User = Any

app = FastAPI(
    title="HazLabel API",
    description="Industrial GHS compliance platform - UN GHS Revision 11 (2025) compliant",
    version="2.0.0"
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://www.hazlabel.co",
        "https://hazlabel.co",
        "https://hazlabel.vercel.app",
        "https://hazlabel-production.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Inngest functions
inngest.fast_api.serve(app, inngest_client, [parse_sds_job])

app.include_router(webhooks.router)


# -----------------------------------------------------------------------------
# SDS Parsing Endpoints
# -----------------------------------------------------------------------------

@app.post("/parse-sds", response_model=GHSLabel)
async def parse_sds(
    file: UploadFile = File(...),
    save_to_vault: bool = False,
    user: User = Depends(verify_user)
):
    """
    Parse a Safety Data Sheet PDF and extract GHS compliance data.

    Validates extracted data against UN GHS Revision 11 (2025).
    Optionally saves to the user's chemical vault.
    Enforces usage limits based on subscription tier (soft limit with grace period).
    """
    from queries import get_user_subscription, count_monthly_uploads

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Check usage limits (soft limit: warn at 2, hard block at 5 for free tier)
    subscription = await get_user_subscription(user.id)
    monthly_count = await count_monthly_uploads(user.id)

    # Define tier limits: (soft_limit, hard_limit)
    limits = {
        None: (2, 5),  # Free tier: warn at 2, block at 5
        "1283692": (200, None),  # Pro monthly: warn at 200, no hard limit
        "1254589": (208, None),  # Pro annual
        "1283714": (15000, None),  # Enterprise monthly
        "1283715": (16666, None),  # Enterprise annual
    }

    variant_id = subscription.get("lemon_variant_id") if subscription else None
    soft_limit, hard_limit = limits.get(variant_id, (2, 5))

    # Hard block at limit (only for free tier)
    if hard_limit and monthly_count >= hard_limit:
        raise HTTPException(
            status_code=403,
            detail=f"You've exceeded your free tier limit ({hard_limit} uploads/month). Please upgrade your plan to continue."
        )

    # Soft warning (returned in response header or separate field)
    approaching_limit = monthly_count >= soft_limit
    upload_warning = None
    if approaching_limit and variant_id is None:  # Free tier
        remaining = hard_limit - monthly_count if hard_limit else 0
        upload_warning = f"You've reached your free tier limit. {remaining} grace uploads remaining before upgrade required."

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        text = extract_text_from_pdf(tmp_path)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        ghs_data, needs_review = parse_sds_with_ai(text)
        
        if save_to_vault:
            saved = await save_chemical(user.id, ghs_data.product_identifier, ghs_data, needs_review=needs_review)
            # Log audit event
            if saved and len(saved) > 0:
                await log_audit(
                    user_id=user.id,
                    action="chemical.created",
                    target_type="chemical",
                    target_id=saved[0].get("id"),
                    details={"name": ghs_data.product_identifier, "source": file.filename}
                )

        # Add upload warning to response if approaching limit
        if upload_warning:
            from fastapi.responses import JSONResponse
            response = JSONResponse(
                content=ghs_data.model_dump(),
                headers={"X-Upload-Warning": upload_warning}
            )
            return response

        return ghs_data

    except Exception as e:
        import traceback
        print(f"ERROR in API endpoint: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/parse-sds/validated", response_model=GHSLabelValidated)
async def parse_sds_validated(
    file: UploadFile = File(...),
    save_to_vault: bool = False,
    user: User = Depends(verify_user)
):
    """
    Parse a Safety Data Sheet PDF with comprehensive validation results.

    Returns both the extracted GHS label AND detailed validation information including:
    - Signal word validation (prevents fatal "Danger" vs "Warning" mismatches)
    - H-code validation against GHS Revision 11 master database
    - P-code cross-validation (ensures required precautionary codes are present)
    - Suggested pictograms based on hazard codes
    Enforces usage limits based on subscription tier.
    """
    from queries import get_user_subscription, count_monthly_uploads

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Check usage limits
    subscription = await get_user_subscription(user.id)
    monthly_count = await count_monthly_uploads(user.id)

    limits = {
        None: (2, 5),
        "1283692": (200, None),
        "1254589": (208, None),
        "1283714": (15000, None),
        "1283715": (16666, None),
    }

    variant_id = subscription.get("lemon_variant_id") if subscription else None
    soft_limit, hard_limit = limits.get(variant_id, (2, 5))

    if hard_limit and monthly_count >= hard_limit:
        raise HTTPException(
            status_code=403,
            detail=f"You've exceeded your free tier limit ({hard_limit} uploads/month). Please upgrade your plan to continue."
        )

    approaching_limit = monthly_count >= soft_limit
    upload_warning = None
    if approaching_limit and variant_id is None:
        remaining = hard_limit - monthly_count if hard_limit else 0
        upload_warning = f"You've reached your free tier limit. {remaining} grace uploads remaining before upgrade required."

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        text = extract_text_from_pdf(tmp_path)
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        result = parse_sds_with_validation(text)
        
        if save_to_vault:
            await save_chemical(
                user.id,
                result.label.product_identifier,
                result.label,
                needs_review=result.validation.needs_review
            )

        # Add upload warning to response if approaching limit
        if upload_warning:
            from fastapi.responses import JSONResponse
            response = JSONResponse(
                content=result.model_dump(),
                headers={"X-Upload-Warning": upload_warning}
            )
            return response

        return result

    except Exception as e:
        import traceback
        print(f"ERROR in API endpoint: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/trigger-parse")
async def trigger_parse(pdf_url: str, user: User = Depends(verify_user)):
    """Trigger async SDS parsing job via Inngest."""
    try:
        await inngest_client.send(
            inngest.Event(name="sds/pdf.uploaded", data={"pdf_url": pdf_url, "user_id": user.id})
        )
        return {"status": "job triggered", "pdf_url": pdf_url}
    except Exception as e:
        import traceback
        print(f"ERROR in API endpoint: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------------------------------------------------------
# Validation Endpoints
# -----------------------------------------------------------------------------

@app.post("/validate", response_model=ValidationResponse)
async def validate_label(
    signal_word: str,
    hazard_statements: List[str],
    precautionary_statements: List[str],
    pictograms: List[str],
    user: User = Depends(verify_user)
):
    """
    Validate a GHS label against UN GHS Revision 11 requirements.
    
    Performs comprehensive validation including:
    - H-code verification against official statement text
    - Signal word validation based on hazard severity
    - P-code cross-validation for critical hazard/precaution pairs
    - Detection of deleted/obsolete codes
    
    Use this endpoint to validate manually entered label data or
    to re-validate existing records after GHS revision updates.
    """
    from validation import ValidationResponse as VR, ValidationIssueResponse as VIR, ValidationSeverityEnum as VSE
    
    result = validate_ghs_label(
        signal_word=signal_word,
        hazard_statements=hazard_statements,
        precautionary_statements=precautionary_statements,
        pictograms=pictograms
    )
    
    return ValidationResponse(
        is_valid=result.is_valid,
        needs_review=result.needs_review,
        issues=[
            VIR(
                code=issue.code,
                severity=VSE(issue.severity.value),
                message=issue.message,
                suggestion=issue.suggestion
            )
            for issue in result.issues
        ],
        validated_hazard_statements=result.validated_hazard_statements,
        validated_precautionary_statements=result.validated_precautionary_statements,
        missing_p_codes=result.missing_p_codes,
        signal_word_valid=result.signal_word_valid,
        suggested_signal_word=result.suggested_signal_word,
        suggested_pictograms=suggest_pictograms_for_codes(hazard_statements)
    )


@app.get("/chemicals/{chemical_id}/validate", response_model=ValidationResponse)
async def validate_chemical(chemical_id: str, user: User = Depends(verify_user)):
    """
    Re-validate an existing chemical record against current GHS Revision 11 standards.
    
    Use this to check if previously stored chemicals have become non-compliant
    after GHS revision updates (e.g., deleted codes, new requirements).
    """
    chemical = await get_chemical_by_id(chemical_id)
    if not chemical:
        raise HTTPException(status_code=404, detail="Chemical not found.")
    
    ghs_data = chemical.get("ghs_data")
    if not ghs_data:
        raise HTTPException(status_code=400, detail="No GHS data available for this chemical.")
    
    label = GHSLabel(**ghs_data)
    
    result = validate_ghs_label(
        signal_word=label.signal_word,
        hazard_statements=label.hazard_statements,
        precautionary_statements=label.precautionary_statements,
        pictograms=label.pictograms
    )
    
    from models import ValidationIssueResponse as VIR, ValidationSeverityEnum as VSE
    
    return ValidationResponse(
        is_valid=result.is_valid,
        needs_review=result.needs_review,
        issues=[
            VIR(
                code=issue.code,
                severity=VSE(issue.severity.value),
                message=issue.message,
                suggestion=issue.suggestion
            )
            for issue in result.issues
        ],
        validated_hazard_statements=result.validated_hazard_statements,
        validated_precautionary_statements=result.validated_precautionary_statements,
        missing_p_codes=result.missing_p_codes,
        signal_word_valid=result.signal_word_valid,
        suggested_signal_word=result.suggested_signal_word,
        suggested_pictograms=suggest_pictograms_for_codes(label.hazard_statements)
    )


# -----------------------------------------------------------------------------
# GHS Reference Endpoints
# -----------------------------------------------------------------------------

@app.get("/ghs/codes/h")
async def list_h_codes():
    """List all valid GHS hazard codes (H-codes) from Revision 11."""
    codes = get_all_valid_h_codes()
    return {
        "revision": "UN GHS Rev 11 (2025)",
        "count": len(codes),
        "codes": codes
    }


@app.get("/ghs/codes/p")
async def list_p_codes():
    """List all valid GHS precautionary codes (P-codes) from Revision 11."""
    codes = get_all_valid_p_codes()
    return {
        "revision": "UN GHS Rev 11 (2025)",
        "count": len(codes),
        "codes": codes
    }


@app.get("/ghs/codes/{code}")
async def get_ghs_code(code: str):
    """
    Get detailed information about a specific GHS code.
    
    Returns official statement text, hazard class, category, and deletion status.
    """
    info = get_code_info(code.upper())
    if not info:
        raise HTTPException(status_code=404, detail=f"Code {code} not found in GHS database.")
    
    return {
        "code": code.upper(),
        "type": info.get("type"),
        "statement": info.get("statement"),
        "hazard_class": info.get("hazard_class"),
        "category": info.get("category"),
        "is_deleted": info.get("statement") == "[Deleted]"
    }


@app.get("/ghs/suggest-pictograms")
async def suggest_pictograms(h_codes: str = Query(..., description="Comma-separated H-codes")):
    """
    Suggest appropriate GHS pictograms based on hazard codes.
    
    Example: /ghs/suggest-pictograms?h_codes=H225,H314,H330
    """
    codes = [c.strip() for c in h_codes.split(",")]
    suggested = suggest_pictograms_for_codes(codes)
    return {
        "input_codes": codes,
        "suggested_pictograms": suggested
    }


# -----------------------------------------------------------------------------
# Chemical Inventory Endpoints
# -----------------------------------------------------------------------------

@app.get("/chemicals", response_model=List[dict])
async def list_chemicals(user: User = Depends(verify_user)):
    """List all chemicals in user's vault."""
    try:
        print(f"DEBUG: Listing chemicals for user {user.id}")
        chemicals = await get_chemicals(user.id)
        print(f"DEBUG: Found {len(chemicals)} chemicals for user {user.id}")
        return chemicals
    except Exception as e:
        import traceback
        print(f"ERROR in API endpoint: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chemicals/{chemical_id}")
async def get_chemical(chemical_id: str, user: User = Depends(verify_user)):
    """Get a specific chemical by ID."""
    try:
        chemical = await get_chemical_by_id(chemical_id)
        if not chemical:
            raise HTTPException(status_code=404, detail="Chemical not found.")
        
        # Log view event (non-blocking)
        await log_audit(
            user_id=user.id,
            action="chemical.viewed",
            target_type="chemical",
            target_id=chemical_id,
            details={"name": chemical.get("name", "Unknown")}
        )
        
        return chemical
    except Exception as e:
        import traceback
        print(f"ERROR in API endpoint: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/chemicals/{chemical_id}")
async def remove_chemical(chemical_id: str, user: User = Depends(verify_user)):
    """Delete a chemical from the vault."""
    # Get chemical name before deletion for audit log
    chemical = await get_chemical_by_id(chemical_id)
    chemical_name = chemical.get("name", "Unknown") if chemical else "Unknown"
    
    result = await delete_chemical(chemical_id)
    
    # Log deletion event
    await log_audit(
        user_id=user.id,
        action="chemical.deleted",
        target_type="chemical",
        target_id=chemical_id,
        details={"name": chemical_name}
    )
    
    return {"message": "Chemical record deleted", "data": result}


# -----------------------------------------------------------------------------
# Print Endpoints
# -----------------------------------------------------------------------------

@app.get("/chemicals/{chemical_id}/print-pdf")
async def print_pdf(chemical_id: str, user: User = Depends(verify_user)):
    """Generate an Avery 5163 (4x2 inch) PDF label for a chemical."""
    chemical = await get_chemical_by_id(chemical_id)
    if not chemical:
        raise HTTPException(status_code=404, detail="Chemical not found.")
    
    ghs_data = GHSLabel(**chemical["ghs_data"])
    pdf_buffer = generate_avery_5163_pdf(ghs_data)
    
    await log_audit(
        user_id=user.id,
        action="label.printed",
        target_type="chemical",
        target_id=chemical_id,
        details={"format": "pdf", "name": ghs_data.product_identifier}
    )
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=label_{chemical_id}.pdf"}
    )


@app.post("/print-bulk")
async def print_bulk(chemical_ids: List[str], user: User = Depends(verify_user)):
    """Initiate bulk label generation for multiple chemicals."""
    await log_audit(
        user_id=user.id,
        action="label.printed",
        target_type="bulk",
        target_id=None,
        details={"count": len(chemical_ids), "ids": chemical_ids, "format": "bulk"}
    )
    return {"message": f"Bulk print job for {len(chemical_ids)} labels initiated."}


from pydantic import BaseModel

class BulkPrintRequest(BaseModel):
    chemical_ids: List[str]
    label_size: str = "avery_5163"  # Default label size
    label_width: float = 4.0  # Width in inches
    label_height: float = 2.0  # Height in inches
    labels_per_page: int = 1  # Number of identical labels per chemical


# Label size configurations for PDF generation
LABEL_SIZE_CONFIG = {
    "avery_5163": {"cols": 2, "rows": 5, "margin_left": 0.1875, "margin_top": 0.5, "h_gutter": 0.125, "v_gutter": 0},
    "avery_5164": {"cols": 2, "rows": 3, "margin_left": 0.75, "margin_top": 0.5, "h_gutter": 0.25, "v_gutter": 0},
    "avery_5165": {"cols": 1, "rows": 1, "margin_left": 0.25, "margin_top": 0.5, "h_gutter": 0, "v_gutter": 0},
    "avery_5160": {"cols": 3, "rows": 10, "margin_left": 0.1875, "margin_top": 0.5, "h_gutter": 0.125, "v_gutter": 0},
    "ghs_4x4": {"cols": 2, "rows": 2, "margin_left": 0.25, "margin_top": 0.5, "h_gutter": 0.25, "v_gutter": 0.25},
    "ghs_4x2": {"cols": 2, "rows": 5, "margin_left": 0.1875, "margin_top": 0.5, "h_gutter": 0.125, "v_gutter": 0},
    "ghs_2x2": {"cols": 4, "rows": 5, "margin_left": 0.25, "margin_top": 0.5, "h_gutter": 0.125, "v_gutter": 0.125},
    "letter_full": {"cols": 1, "rows": 1, "margin_left": 0.5, "margin_top": 0.5, "h_gutter": 0, "v_gutter": 0},
    "a4_full": {"cols": 1, "rows": 1, "margin_left": 0.5, "margin_top": 0.5, "h_gutter": 0, "v_gutter": 0},
}


@app.post("/print/pdf")
async def bulk_print_pdf(request: BulkPrintRequest, user: User = Depends(verify_subscription)):
    """Generate GHS-compliant multi-page PDF labels for multiple chemicals."""
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import inch
    from reportlab.lib.colors import red, black, Color
    import io
    import math
    import re
    import json
    import time

    def _dbg(hypothesis_id: str, message: str, data: dict):
        # #region agent log
        try:
            with open("/Users/shauryasingh/Documents/Business work/HazLabel/.cursor/debug.log", "a") as f:
                f.write(json.dumps({
                    "sessionId": "debug-session",
                    "runId": "pre-fix",
                    "hypothesisId": hypothesis_id,
                    "location": "backend/main.py:bulk_print_pdf",
                    "message": message,
                    "data": data,
                    "timestamp": int(time.time() * 1000)
                }) + "\n")
        except Exception:
            pass
        # #endregion agent log
    
    def clean_statement_text(text: str) -> str:
        """
        Clean up statement text for GHS compliance:
        - Remove ellipses (…, ...)
        - Remove bracketed placeholders [and...], [or...], etc.
        - Fix common formatting issues
        - Ensure complete, intelligible text
        """
        if not text:
            return text
        
        text = text.strip()
        
        # FIX 1: P501 incomplete text - detect ANY incomplete disposal statement
        # Match: "Dispose of contents/container to", "Dispose of contents/container to.", 
        # "Dispose of contents/container in accordance with" (incomplete)
        if "Dispose of contents/container" in text:
            # If it ends with "to" (with or without period) or is incomplete
            if text.rstrip('.').endswith(' to') or 'to.' == text[-3:] or len(text) < 60:
                return "Dispose of contents/container in accordance with local regulations."
            
        # FIX 2: P264 "Wash hands [and...] thoroughly" artifact
        if "[and" in text.lower():
            text = re.sub(r'\[and[^\]]*\]', '', text, flags=re.IGNORECASE)
        text = text.replace("Wash hands  thoroughly", "Wash hands thoroughly")
        text = text.replace("Wash hands and thoroughly", "Wash hands thoroughly")
        
        # Remove bracketed placeholders like [and...], [or...], [in accordance with...]
        text = re.sub(r'\[and\.{0,3}\]', 'and', text, flags=re.IGNORECASE)
        text = re.sub(r'\[or\.{0,3}\]', 'or', text, flags=re.IGNORECASE)
        
        # Remove any remaining bracketed placeholders with dots inside (instructions)
        text = re.sub(r'\[[^]]*\.\.\.[^]]*\]', '', text)
        text = re.sub(r'\[\s*\.\.\.\s*\]', '', text)
        
        # Clean up any remaining brackets but keep text (unless empty)
        # E.g. [shower] -> shower
        text = re.sub(r'\[([^]]+)\]', r'\1', text)
        
        # Remove trailing ellipses
        text = re.sub(r'[/\s]*\.{2,3}$', '.', text)
        text = re.sub(r'[/\s]*…$', '.', text)
        text = re.sub(r'/\s*$', '', text)  # Remove trailing slashes
        
        # Remove ellipses mid-text
        text = text.replace('…', '')
        text = text.replace('...', '')
        
        # Clean up double spaces and formatting
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'/\s+/', '/', text)
        text = text.strip()
        
        # Ensure sentence ends properly
        if text and text[-1] not in '.!':
            text += '.'
        
        return text
    
    if not request.chemical_ids:
        raise HTTPException(status_code=400, detail="No chemical IDs provided")

    _dbg("H1", "bulk_print_pdf.entry", {
        "label_size": request.label_size,
        "label_width": request.label_width,
        "label_height": request.label_height,
        "labels_per_page": request.labels_per_page,
        "chemical_count": len(request.chemical_ids)
    })
    
    # ABSOLUTE path to pictogram images
    BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
    PICTOGRAM_DIR = os.path.join(BACKEND_DIR, "static", "pictograms")
    
    buffer = io.BytesIO()
    
    # Select page size based on label type
    if request.label_size == "a4_full":
        from reportlab.lib.pagesizes import A4
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
    else:
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

    _dbg("H2", "page_size.selected", {
        "label_size": request.label_size,
        "page_width": width,
        "page_height": height
    })
    
    # Get label configuration from request or use defaults
    label_width = request.label_width * inch
    label_height = request.label_height * inch
    
    # Get layout config for the label size
    config = LABEL_SIZE_CONFIG.get(request.label_size, LABEL_SIZE_CONFIG["avery_5163"])
    margin_left = config["margin_left"] * inch
    margin_top = config["margin_top"] * inch
    horizontal_gutter = config["h_gutter"] * inch
    vertical_gutter = config.get("v_gutter", 0) * inch
    cols = config["cols"]
    rows = config["rows"]
    labels_per_page = cols * rows

    _dbg("H2", "layout.config", {
        "label_size": request.label_size,
        "label_width_in": request.label_width,
        "label_height_in": request.label_height,
        "cols": cols,
        "rows": rows,
        "margin_left_in": config["margin_left"],
        "margin_top_in": config["margin_top"],
        "h_gutter_in": config["h_gutter"],
        "v_gutter_in": config.get("v_gutter", 0)
    })
    
    # For single labels per page (full page), just use 1
    if request.label_size in ["avery_5165", "letter_full", "a4_full"]:
        labels_per_page = 1
        cols = 1
        rows = 1
        # Center single label on page
        margin_left = (width - label_width) / 2
        margin_top = (height - label_height) / 2
    
    label_index = 0
    
    for chemical_id in request.chemical_ids:
        chemical = await get_chemical_by_id(chemical_id)
        if not chemical or not chemical.get("ghs_data"):
            continue
            
        ghs_data = chemical["ghs_data"]
        
        # Calculate position on the page
        page_label_index = label_index % labels_per_page
        row = page_label_index // cols
        col = page_label_index % cols
        
        x = margin_left + col * (label_width + horizontal_gutter)
        y = height - margin_top - (row + 1) * (label_height + vertical_gutter)
        
        # Draw label border
        p.setStrokeColor(black)
        p.setLineWidth(0.5)
        p.rect(x, y, label_width, label_height)
        
        # ═══════════════════════════════════════════════════════════════
        # SCALE FACTOR - Balanced scaling for larger labels
        # Baseline: 4x2" label. 4x4" should scale ~1.4x, not 2x.
        # ═══════════════════════════════════════════════════════════════
        base_height = 2.0 * inch
        base_width = 4.0 * inch
        height_factor = label_height / base_height
        width_factor = label_width / base_width
        scale = math.sqrt(height_factor * width_factor)
        scale = min(1.6, max(0.8, scale))
        is_full_page = request.label_size in ["avery_5165", "letter_full", "a4_full"]
        if is_full_page:
            scale = min(2.4, max(1.2, scale))

        if label_index == 0:
            _dbg("H3", "scale.computed", {
                "label_size": request.label_size,
                "label_width_in": request.label_width,
                "label_height_in": request.label_height,
                "height_factor": height_factor,
                "width_factor": width_factor,
                "scale": scale,
                "is_full_page": is_full_page
            })
        
        # Content Padding - fixed small padding for all label sizes
        padding = 0.15 * inch
        
        # Use full label width (minus padding) for content
        usable_width = label_width - (2 * padding)
        content_width = usable_width
        inner_x = x + padding

        # Pictogram column: 30% of label width for larger labels, capped for small ones
        # For 4x4" label: 30% of 4" = 1.2" column width
        pic_column_pct = 0.30 if label_height >= 3 * inch else 0.25
        pic_column_width = content_width * pic_column_pct
        text_width = content_width - pic_column_width

        if label_index == 0:
            _dbg("H4", "content.layout", {
                "padding": padding,
                "content_width": content_width,
                "content_width_inches": content_width / inch,
                "pic_column_width": pic_column_width,
                "pic_column_inches": pic_column_width / inch,
                "text_width": text_width,
                "text_width_inches": text_width / inch
            })
        
        # Scaled font sizes
        font_tiny = max(6, int(6 * scale))
        font_small = max(7, int(7 * scale))
        font_medium = max(10, int(10 * scale))
        font_large = max(12, int(12 * scale))
        font_xlarge = max(14, int(14 * scale))
        
        # Scaled spacing
        spacing_small = 0.12 * inch * scale
        spacing_medium = 0.16 * inch * scale
        spacing_large = 0.22 * inch * scale
        
        current_y = y + label_height - spacing_medium
        
        # ═══════════════════════════════════════════════════════════════
        # 1. PRODUCT IDENTIFIER
        # ═══════════════════════════════════════════════════════════════
        p.setFont("Helvetica", font_tiny)
        p.setFillColor(Color(0.4, 0.4, 0.4))
        p.drawString(inner_x, current_y, "Product Identifier:")
        current_y -= spacing_small
        
        p.setFont("Helvetica-Bold", font_medium)
        p.setFillColor(black)
        product_name = ghs_data.get("product_identifier", "Unknown Product")[:60]
        p.drawString(inner_x, current_y, product_name)
        current_y -= spacing_medium
        
        # ═══════════════════════════════════════════════════════════════
        # 2. SIGNAL WORD
        # ═══════════════════════════════════════════════════════════════
        signal_word = ghs_data.get("signal_word", "")
        p.setFont("Helvetica-Bold", font_xlarge)
        if signal_word.lower() == "danger":
            p.setFillColor(red)
        elif signal_word.lower() == "warning":
            p.setFillColor(Color(0.9, 0.5, 0))
        else:
            p.setFillColor(black)
        p.drawString(inner_x, current_y, signal_word.upper())
        p.setFillColor(black)
        current_y -= spacing_large
        
        # ═══════════════════════════════════════════════════════════════
        # 3. PICTOGRAMS (right side - rotated 45° diamond style)
        # ═══════════════════════════════════════════════════════════════
        pictograms = ghs_data.get("pictograms", [])
        num_pics = min(len(pictograms), 4)
        
        if num_pics > 0:
            # Pictogram size: fill 80% of pictogram column width (accounting for rotation)
            # The diamond rotated 45° needs: pic_size * 1.414 to fit in the column
            max_pic_size = (pic_column_width * 0.85) / 1.414
            
            # For multiple pictograms, scale down to fit vertically
            if num_pics == 1:
                pic_size = max_pic_size
            elif num_pics == 2:
                pic_size = max_pic_size * 0.85
            elif num_pics == 3:
                pic_size = max_pic_size * 0.70
            else:  # 4+
                pic_size = max_pic_size * 0.60

            if label_index == 0:
                _dbg("H4", "pictogram.size", {
                    "num_pics": num_pics,
                    "pic_column_width": pic_column_width,
                    "max_pic_size": max_pic_size,
                    "pic_size": pic_size,
                    "pic_size_inches": pic_size / inch
                })
            
            # Available vertical space within label (scaled margins)
            top_margin = 0.15 * inch * scale
            bottom_margin = 0.18 * inch * scale
            available_height = label_height - top_margin - bottom_margin
            
            # Diamond tip-to-tip height when rotated 45°
            diamond_span = pic_size * 1.414
            
            # Calculate spacing - tight gaps between pictograms (scaled)
            if num_pics > 1:
                gap = 0.02 * inch * scale
                pic_spacing = diamond_span + gap
            else:
                pic_spacing = 0
            
            # Total height of pictogram column
            total_height = diamond_span if num_pics == 1 else (num_pics - 1) * pic_spacing + diamond_span
            
            # Center vertically
            start_offset = (available_height - total_height) / 2
            
            # Position - align to pictogram column
            pic_center_x = inner_x + text_width + (pic_column_width / 2)
            pic_top_y = y + label_height - top_margin - start_offset - (diamond_span / 2)
            
            for i, pic_code in enumerate(pictograms[:4]):
                pic_path = os.path.join(PICTOGRAM_DIR, f"{pic_code}.png")
                pic_center_y = pic_top_y - (i * pic_spacing)
                
                p.saveState()
                p.translate(pic_center_x, pic_center_y)
                p.rotate(45)
                
                if os.path.exists(pic_path):
                    try:
                        p.drawImage(
                            pic_path, 
                            -pic_size/2, -pic_size/2,
                            width=pic_size, height=pic_size, 
                            preserveAspectRatio=True, 
                            mask='auto'
                        )
                    except Exception:
                        p.setStrokeColor(red)
                        p.setLineWidth(2 * scale)
                        p.rect(-pic_size/2, -pic_size/2, pic_size, pic_size)
                else:
                    p.setStrokeColor(red)
                    p.setLineWidth(2 * scale)
                    p.rect(-pic_size/2, -pic_size/2, pic_size, pic_size)
                
                p.restoreState()
        
        # ═══════════════════════════════════════════════════════════════
        # 4. HAZARD STATEMENTS (H-codes) & Supplemental (EUH)
        # ═══════════════════════════════════════════════════════════════
        p.setFillColor(black)
        hazard_stmts = ghs_data.get("hazard_statements", [])
        
        # Get supplemental hazards (EUH codes) from Guard
        from validation import get_supplemental_hazards
        product_name_id = ghs_data.get("product_identifier", "")
        supp_stmts = get_supplemental_hazards(product_name_id, hazard_stmts)
        
        # Combine H-statements and EUH-statements
        all_hazards = hazard_stmts + supp_stmts
        
        # Line height scales with font
        line_height = 0.11 * inch * scale
        bottom_margin_y = y + (0.35 * inch * scale)
        
        for stmt in all_hazards:
            if current_y < bottom_margin_y:
                break
                
            stmt_text = str(stmt)
            if ":" in stmt_text:
                code_part, desc_part = stmt_text.split(":", 1)
                code_part = code_part.strip()
                desc_part = clean_statement_text(desc_part.strip())
            else:
                code_part = ""
                desc_part = clean_statement_text(stmt_text)
            
            p.setFont("Helvetica-Bold", font_small)
            bullet_code = f"- {code_part}:" if code_part else "-"
            p.drawString(inner_x, current_y, bullet_code)
            code_width = p.stringWidth(bullet_code, "Helvetica-Bold", font_small)
            
            p.setFont("Helvetica", font_small)
            desc_x = inner_x + code_width + (2 * scale)
            max_desc_width = text_width - code_width - (4 * scale)
            
            if desc_part:
                words = desc_part.split()
                lines = []
                current_line = ""
                for word in words:
                    test = current_line + " " + word if current_line else word
                    if p.stringWidth(test, "Helvetica", font_small) <= max_desc_width:
                        current_line = test
                    else:
                        if current_line: lines.append(current_line)
                        current_line = word
                if current_line: lines.append(current_line)
                
                if lines:
                    p.drawString(desc_x, current_y, lines[0])
                    for i, line in enumerate(lines[1:], 1):
                        current_y -= line_height * 0.85
                        if current_y < bottom_margin_y:
                            break
                        p.drawString(inner_x + (0.12 * inch * scale), current_y, line)
            
            current_y -= line_height

        current_y -= spacing_small * 0.5  # Gap before P-codes
        
        # ═══════════════════════════════════════════════════════════════
        # 5. PRECAUTIONARY STATEMENTS - FULL CODES, NO TRUNCATION
        # ═══════════════════════════════════════════════════════════════
        p_stmts = ghs_data.get("precautionary_statements", [])
        
        # Scaled P-code font (slightly smaller than H-codes)
        font_p_code = max(6, int(6 * scale))
        
        # Group by category (handle combined codes properly)
        def get_category(s):
            s_str = str(s)
            # For combined codes like P303+P361+P353, check first code
            if s_str.startswith("P2"):
                return "prevention"
            elif s_str.startswith("P3"):
                return "response"
            elif s_str.startswith("P4"):
                return "storage"
            elif s_str.startswith("P5"):
                return "disposal"
            return "other"
        
        prevention = [s for s in p_stmts if get_category(s) == "prevention"]
        response = [s for s in p_stmts if get_category(s) == "response"]
        storage = [s for s in p_stmts if get_category(s) == "storage"]
        disposal = [s for s in p_stmts if get_category(s) == "disposal"]
        
        # Ordered by GHS priority - include ALL combined codes
        ordered_stmts = []
        # Add P280 first (PPE)
        ordered_stmts.extend([s for s in prevention if "P280" in str(s)])
        # Add other prevention
        ordered_stmts.extend([s for s in prevention if "P280" not in str(s)])
        # Response statements (including combined like P303+P361+P353)
        ordered_stmts.extend(response)
        # Storage
        ordered_stmts.extend(storage)
        # Disposal
        ordered_stmts.extend(disposal)
        
        # Reserve space for footer at bottom (GHS required supplier info)
        footer_height = 0.15 * inch * scale  # Reserve space for footer
        p_code_bottom_margin = y + footer_height
        
        for stmt in ordered_stmts:
            if current_y < p_code_bottom_margin:
                break  # Stop if running out of space
                
            stmt_text = str(stmt)
            
            # Split code from description - preserve full combined codes
            if ":" in stmt_text:
                code_part, desc_part = stmt_text.split(":", 1)
                code_part = code_part.strip() + ":"  # Keep full code like P303+P361+P353:
                desc_part = clean_statement_text(desc_part.strip())
            else:
                code_part = stmt_text
                desc_part = ""
            
            # Draw code in bold
            p.setFont("Helvetica-Bold", font_p_code)
            p.setFillColor(black)
            p.drawString(inner_x, current_y, code_part)
            code_width = p.stringWidth(code_part, "Helvetica-Bold", font_p_code)
            
            # Draw description in regular - NO TRUNCATION, proper wrapping
            p.setFont("Helvetica", font_p_code)
            desc_x = inner_x + code_width + (2 * scale)
            max_desc_width = text_width - code_width - (4 * scale)
            
            if desc_part:
                # Word wrap without truncation
                words = desc_part.split()
                lines = []
                current_line = ""
                
                for word in words:
                    test = current_line + " " + word if current_line else word
                    if p.stringWidth(test, "Helvetica", font_p_code) <= max_desc_width:
                        current_line = test
                    else:
                        if current_line:
                            lines.append(current_line)
                        current_line = word
                if current_line:
                    lines.append(current_line)
                
                # Draw first line after code
                if lines:
                    p.drawString(desc_x, current_y, lines[0])
                    # Continuation lines indented
                    for line in lines[1:]:
                        current_y -= line_height * 0.7
                        if current_y < p_code_bottom_margin:
                            break
                        p.drawString(inner_x + (0.08 * inch * scale), current_y, line)
            
            current_y -= line_height * 0.8
        
        # ═══════════════════════════════════════════════════════════════
        # 6. SUPPLIER INFO (bottom) - ALWAYS RENDER (GHS REQUIRED)
        # Required by GHS Section 1.4.10.5.2
        # ═══════════════════════════════════════════════════════════════
        # ALWAYS render footer - it's GHS required
        footer_y = y + (0.08 * inch * scale)
        
        font_supplier = max(5, int(5 * scale))
        p.setFont("Helvetica", font_supplier)
        p.setFillColor(Color(0.4, 0.4, 0.4))
        supplier = ghs_data.get("supplier_info", "")
        
        # Compact format - abbreviate and truncate to fit
        max_supplier_width = text_width
        supplier_compact = supplier.replace("®", "").replace("NuGeneration Technologies, LLC (dba NuGenTec)", "NuGenTec")
        
        # Further abbreviate to fit
        if len(supplier_compact) > 80:
            parts = supplier_compact.split()
            if len(parts) > 5:
                supplier_compact = " ".join(parts[:8]) + "..."
        
        # Ensure it fits within the text width
        while p.stringWidth(supplier_compact, "Helvetica", font_supplier) > max_supplier_width and len(supplier_compact) > 10:
            supplier_compact = supplier_compact[:-4] + "..."
        
        p.drawString(inner_x, footer_y, supplier_compact)
        
        label_index += 1
        
        if label_index % labels_per_page == 0 and label_index < len(request.chemical_ids):
            p.showPage()
    
    p.showPage()
    p.save()
    buffer.seek(0)
    
    # Log audit event (non-blocking)
    await log_audit(
        user_id=user.id,
        action="label.printed",
        target_type="bulk",
        target_id=None,
        details={"count": len(request.chemical_ids), "format": "pdf", "ids": request.chemical_ids}
    )
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ghs_labels_{len(request.chemical_ids)}.pdf"}
    )


# -----------------------------------------------------------------------------
# Audit & System Endpoints
# -----------------------------------------------------------------------------

@app.get("/audit-logs")
async def get_logs(user: User = Depends(verify_user)):
    """Get audit logs for the authenticated user."""
    return await get_audit_logs(user.id)


@app.get("/")
async def root():
    """Health check and API info."""
    return {
        "message": "HazLabel API is running",
        "version": "2.0.0",
        "ghs_revision": "UN GHS Rev 11 (2025)",
        "features": [
            "SDS PDF parsing with AI",
            "GHS code validation against Rev 11",
            "Signal word validation",
            "P-code cross-validation",
            "Avery 5163 PDF generation"
        ]
    }


# -----------------------------------------------------------------------------
# Subscription Endpoints
# -----------------------------------------------------------------------------

@app.get("/subscription/status")
async def get_subscription_status(user: User = Depends(verify_user)):
    """
    Get current user's subscription status and usage stats.
    Returns tier, status, and monthly upload count.
    """
    from queries import get_user_subscription, count_monthly_uploads

    subscription = await get_user_subscription(user.id)
    monthly_uploads = await count_monthly_uploads(user.id)

    # Map variant_id to plan name and limits
    variant_to_plan = {
        "1283692": ("professional", 200),  # Pro monthly
        "1254589": ("professional", 208),  # Pro annual (~2500/12)
        "1283714": ("enterprise", 15000),  # Enterprise monthly
        "1283715": ("enterprise", 16666),  # Enterprise annual (~200k/12)
    }

    if not subscription:
        return {
            "tier": "free",
            "status": None,
            "variant_id": None,
            "renews_at": None,
            "ends_at": None,
            "monthly_uploads": monthly_uploads,
            "upload_limit": 2
        }

    variant_id = subscription.get("lemon_variant_id")
    tier, limit = variant_to_plan.get(variant_id, ("unknown", 2))

    return {
        "tier": tier,
        "status": subscription.get("status"),
        "variant_id": variant_id,
        "renews_at": subscription.get("renews_at"),
        "ends_at": subscription.get("ends_at"),
        "monthly_uploads": monthly_uploads,
        "upload_limit": limit
    }


@app.get("/subscription/portal")
async def get_customer_portal(user: User = Depends(verify_user)):
    """
    Generate Lemon Squeezy Customer Portal URL for subscription management.
    Allows users to update payment methods, view invoices, and cancel subscriptions.
    """
    from queries import get_user_subscription
    import requests

    subscription = await get_user_subscription(user.id)

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found. Please subscribe to a plan first."
        )

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Subscription management temporarily unavailable."
        )

    customer_id = subscription.get("lemon_customer_id")

    try:
        # Call Lemon Squeezy API to get customer data with portal URL
        response = requests.get(
            f"https://api.lemonsqueezy.com/v1/customers/{customer_id}",
            headers={
                "Accept": "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            }
        )

        if response.status_code != 200:
            print(f"Lemon Squeezy API error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate portal URL. Please try again later."
            )

        customer_data = response.json()
        portal_url = customer_data.get("data", {}).get("attributes", {}).get("urls", {}).get("customer_portal")

        if not portal_url:
            raise HTTPException(
                status_code=500,
                detail="No customer portal available. Please ensure you have an active subscription."
            )

        return {"portal_url": portal_url}

    except requests.RequestException as e:
        print(f"Request error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to subscription service."
        )


@app.post("/subscription/create-checkout")
async def create_checkout(
    variant_id: str,
    user: User = Depends(verify_user)
):
    """
    Create a Lemon Squeezy checkout session with user_id embedded.
    Returns a checkout URL that the frontend can redirect to.
    """
    import requests

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        print("[ERROR] LEMON_SQUEEZY_API_KEY not set in environment")
        raise HTTPException(
            status_code=500,
            detail="Subscription service not configured. Please contact support."
        )

    # Get store ID from environment or use default
    store_id = os.environ.get("LEMON_SQUEEZY_STORE_ID", "117111")

    print(f"[CHECKOUT] API Key configured: {bool(api_key)}")
    print(f"[CHECKOUT] Store ID: {store_id}")
    print(f"[CHECKOUT] Variant ID: {variant_id}")

    try:
        print(f"Creating checkout for user_id: {user.id}, variant_id: {variant_id}")

        # Create checkout via Lemon Squeezy API
        response = requests.post(
            "https://api.lemonsqueezy.com/v1/checkouts",
            headers={
                "Accept": "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            },
            json={
                "data": {
                    "type": "checkouts",
                    "attributes": {
                        "custom_price": None,
                        "checkout_data": {
                            "email": user.email,  # Pre-fill customer email
                            "custom": {
                                "user_id": str(user.id)
                            }
                        },
                        "checkout_options": {
                            "redirect": {
                                "url": f"{os.environ.get('FRONTEND_URL', 'https://www.hazlabel.co')}/checkout/success"
                            }
                        },
                        "product_options": {
                            "enabled_variants": [int(variant_id)]
                        }
                    },
                    "relationships": {
                        "store": {
                            "data": {
                                "type": "stores",
                                "id": str(store_id)
                            }
                        },
                        "variant": {
                            "data": {
                                "type": "variants",
                                "id": str(variant_id)
                            }
                        }
                    }
                }
            }
        )

        if response.status_code != 201:
            error_detail = response.text[:500] if response.text else "Unknown error"
            print(f"[ERROR] Lemon Squeezy checkout error: {response.status_code}")
            print(f"[ERROR] Response body: {error_detail}")

            # Parse error for better user message
            try:
                error_json = response.json()
                error_msg = error_json.get("errors", [{}])[0].get("detail", "Failed to create checkout")
            except:
                error_msg = f"Checkout failed with status {response.status_code}"

            raise HTTPException(
                status_code=500,
                detail=f"Failed to create checkout: {error_msg}"
            )

        checkout_data = response.json()
        checkout_url = checkout_data["data"]["attributes"]["url"]

        print(f"Checkout created successfully: {checkout_url}")
        print(f"Custom data in response: {checkout_data['data']['attributes'].get('checkout_data', {})}")
        print(f"Checkout options: {checkout_data['data']['attributes'].get('checkout_options', {})}")

        return {
            "checkout_url": checkout_url,
            "checkout_id": checkout_data["data"]["id"]
        }

    except requests.RequestException as e:
        print(f"Request error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to subscription service."
        )


@app.post("/subscription/cancel")
async def cancel_subscription(user: User = Depends(verify_user)):
    """
    Cancel the user's active subscription via Lemon Squeezy API.
    Subscription remains active until the end of the billing period.
    """
    from queries import get_user_subscription
    import requests

    subscription = await get_user_subscription(user.id)

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found."
        )

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Subscription management temporarily unavailable."
        )

    lemon_subscription_id = subscription.get("lemon_subscription_id")

    try:
        # Cancel subscription via Lemon Squeezy API
        response = requests.delete(
            f"https://api.lemonsqueezy.com/v1/subscriptions/{lemon_subscription_id}",
            headers={
                "Accept": "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            }
        )

        if response.status_code not in [200, 204]:
            print(f"Lemon Squeezy cancel error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to cancel subscription. Please try again later."
            )

        # Webhook will update the database status
        return {
            "success": True,
            "message": "Subscription cancelled. Access continues until end of billing period."
        }

    except requests.RequestException as e:
        print(f"Request error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to subscription service."
        )


@app.post("/subscription/resume")
async def resume_subscription(user: User = Depends(verify_user)):
    """
    Resume a cancelled subscription before it expires.
    """
    from queries import get_user_subscription
    import requests

    subscription = await get_user_subscription(user.id)

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="No subscription found."
        )

    if subscription.get("status") != "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Only cancelled subscriptions can be resumed."
        )

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Subscription management temporarily unavailable."
        )

    lemon_subscription_id = subscription.get("lemon_subscription_id")

    try:
        # Resume subscription via Lemon Squeezy API
        response = requests.patch(
            f"https://api.lemonsqueezy.com/v1/subscriptions/{lemon_subscription_id}",
            headers={
                "Accept": "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            },
            json={
                "data": {
                    "type": "subscriptions",
                    "id": str(lemon_subscription_id),
                    "attributes": {
                        "cancelled": False
                    }
                }
            }
        )

        if response.status_code != 200:
            print(f"Lemon Squeezy resume error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to resume subscription. Please try again later."
            )

        return {
            "success": True,
            "message": "Subscription resumed successfully."
        }

    except requests.RequestException as e:
        print(f"Request error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to subscription service."
        )


@app.get("/subscription/invoices")
async def get_invoices(user: User = Depends(verify_user)):
    """
    Get list of invoices for the user's subscription.
    """
    from queries import get_user_subscription
    import requests

    subscription = await get_user_subscription(user.id)

    if not subscription:
        return {"invoices": []}

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Invoice service temporarily unavailable."
        )

    lemon_subscription_id = subscription.get("lemon_subscription_id")

    try:
        # Get invoices from Lemon Squeezy API
        response = requests.get(
            f"https://api.lemonsqueezy.com/v1/subscription-invoices?filter[subscription_id]={lemon_subscription_id}",
            headers={
                "Accept": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            }
        )

        if response.status_code != 200:
            print(f"Lemon Squeezy invoices error: {response.status_code} - {response.text}")
            return {"invoices": []}

        data = response.json()
        invoices = []

        for invoice in data.get("data", []):
            attrs = invoice.get("attributes", {})
            invoices.append({
                "id": invoice.get("id"),
                "status": attrs.get("status"),
                "total": attrs.get("total"),
                "currency": attrs.get("currency"),
                "created_at": attrs.get("created_at"),
                "invoice_url": attrs.get("urls", {}).get("invoice_url")
            })

        return {"invoices": invoices}

    except requests.RequestException as e:
        print(f"Request error: {e}")
        return {"invoices": []}


@app.get("/subscription/update-payment-url")
async def get_update_payment_url(user: User = Depends(verify_user)):
    """
    Get URL to update payment method for the subscription.
    """
    from queries import get_user_subscription
    import requests

    subscription = await get_user_subscription(user.id)

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found."
        )

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Payment update temporarily unavailable."
        )

    lemon_subscription_id = subscription.get("lemon_subscription_id")

    try:
        # Get subscription details to extract update payment URL
        response = requests.get(
            f"https://api.lemonsqueezy.com/v1/subscriptions/{lemon_subscription_id}",
            headers={
                "Accept": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            }
        )

        if response.status_code != 200:
            print(f"Lemon Squeezy subscription error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to get payment update URL."
            )

        sub_data = response.json()
        update_url = sub_data.get("data", {}).get("attributes", {}).get("urls", {}).get("update_payment_method")

        if not update_url:
            raise HTTPException(
                status_code=500,
                detail="Payment update URL not available."
            )

        return {"update_payment_url": update_url}

    except requests.RequestException as e:
        print(f"Request error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to subscription service."
        )


@app.post("/subscription/change-plan")
async def change_subscription_plan(
    variant_id: str,
    user: User = Depends(verify_user)
):
    """
    Change the user's subscription to a different plan (upgrade/downgrade or switch billing cycle).
    """
    from queries import get_user_subscription
    import requests

    subscription = await get_user_subscription(user.id)

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found."
        )

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Subscription management temporarily unavailable."
        )

    lemon_subscription_id = subscription.get("lemon_subscription_id")

    try:
        # Update subscription variant via Lemon Squeezy API
        # disable_prorations: true = no proration charges, new price starts next cycle
        # This prevents immediate payment attempts that can fail
        response = requests.patch(
            f"https://api.lemonsqueezy.com/v1/subscriptions/{lemon_subscription_id}",
            headers={
                "Accept": "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            },
            json={
                "data": {
                    "type": "subscriptions",
                    "id": str(lemon_subscription_id),
                    "attributes": {
                        "variant_id": int(variant_id),
                        "disable_prorations": True  # Avoid immediate charges
                    }
                }
            }
        )

        if response.status_code != 200:
            print(f"Lemon Squeezy plan change error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to change plan. Please try again later."
            )

        return {
            "success": True,
            "message": "Plan updated successfully. Changes will take effect on next billing cycle."
        }

    except requests.RequestException as e:
        print(f"Request error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to subscription service."
        )


@app.post("/subscription/fix-past-due")
async def fix_past_due_subscription(user: User = Depends(verify_user)):
    """
    Emergency fix for past_due subscriptions - cancels and allows user to resubscribe.
    Only use when payment failed during plan change.
    """
    from queries import get_user_subscription
    import requests

    subscription = await get_user_subscription(user.id)

    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="No subscription found."
        )

    if subscription.get("status") != "past_due":
        raise HTTPException(
            status_code=400,
            detail=f"This endpoint is only for past_due subscriptions. Your status is: {subscription.get('status')}"
        )

    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Subscription management temporarily unavailable."
        )

    lemon_subscription_id = subscription.get("lemon_subscription_id")

    try:
        # Cancel the past_due subscription
        response = requests.delete(
            f"https://api.lemonsqueezy.com/v1/subscriptions/{lemon_subscription_id}",
            headers={
                "Accept": "application/vnd.api+json",
                "Content-Type": "application/vnd.api+json",
                "Authorization": f"Bearer {api_key}"
            }
        )

        if response.status_code not in [200, 204]:
            print(f"Lemon Squeezy cancel error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=500,
                detail="Failed to cancel subscription. Please try again later."
            )

        return {
            "success": True,
            "message": "Past due subscription cancelled. You can now create a new subscription."
        }

    except requests.RequestException as e:
        print(f"Request error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to connect to subscription service."
        )


@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy"}


@app.get("/subscription/config-check")
async def subscription_config_check():
    """
    Check Lemon Squeezy configuration status.
    Useful for debugging subscription issues.
    """
    api_key = os.environ.get("LEMON_SQUEEZY_API_KEY")
    webhook_secret = os.environ.get("LEMON_SQUEEZY_WEBHOOK_SECRET")
    store_id = os.environ.get("LEMON_SQUEEZY_STORE_ID")
    frontend_url = os.environ.get("FRONTEND_URL")

    return {
        "lemon_squeezy_configured": bool(api_key),
        "api_key_set": bool(api_key),
        "api_key_length": len(api_key) if api_key else 0,
        "webhook_secret_set": bool(webhook_secret),
        "store_id": store_id or "default: 117111",
        "frontend_url": frontend_url or "default: https://www.hazlabel.co",
        "environment_check": {
            "LEMON_SQUEEZY_API_KEY": "✅ SET" if api_key else "❌ MISSING",
            "LEMON_SQUEEZY_WEBHOOK_SECRET": "✅ SET" if webhook_secret else "❌ MISSING",
            "LEMON_SQUEEZY_STORE_ID": "✅ SET" if store_id else "⚠️ USING DEFAULT",
            "FRONTEND_URL": "✅ SET" if frontend_url else "⚠️ USING DEFAULT"
        }
    }
