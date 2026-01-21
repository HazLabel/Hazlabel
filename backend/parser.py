"""
SDS Parser Module

Extracts GHS compliance data from Safety Data Sheets using AI-powered parsing
with comprehensive validation against UN GHS Revision 11 (2025).
"""

import pdfplumber
import instructor
from openai import OpenAI
from models import GHSLabel, GHSLabelValidated, ValidationResponse, ValidationIssueResponse, ValidationSeverityEnum
from validation import (
    validate_ghs_label,
    validate_hazard_statements,
    suggest_pictograms_for_codes,
    get_supplemental_hazards,
    validate_sds_age,
    hazlabel_guard,
    ValidationResult,
    ValidationSeverity
)
import os
import env_utils
from typing import Tuple

client = instructor.patch(OpenAI(api_key=os.environ.get("OPENAI_API_KEY")))

# Enhanced system prompt for better GHS code extraction with STRICT SECTION 2 ISOLATION
SDS_EXTRACTION_PROMPT = """You are a professional chemical safety expert specializing in GHS (Globally Harmonized System) compliance.

⚠️ CRITICAL RULE: SECTION 2 ISOLATION ⚠️
You must ONLY extract hazard information from SECTION 2 (Hazard Identification) of the SDS.
- NEVER extract H-codes or pictograms from Section 3 (Composition), Section 11 (Toxicological), or Section 12 (Ecological)
- Environmental hazards (H400, H401, H402, H410, H411, H412, H413, GHS09) are ONLY valid if explicitly classified in Section 2
- If environmental data appears ONLY in Section 12 → DO NOT include it in the label
- Over-labeling is a compliance violation under OSHA HazCom

⚠️ CRITICAL RULE: PRESERVE EXACT CODES ⚠️
- Use the EXACT code numbers as written in Section 2 - DO NOT substitute or simplify
- H410 ≠ H400 - these are different hazard levels, never downgrade
- H411 ≠ H400 - chronic toxicity codes must be preserved exactly
- Combined codes must remain combined (H300+H310 stays H300+H310)

Extract GHS compliance data following these guidelines:

1. **Hazard Statements**: Extract ONLY H-codes EXACTLY as listed in Section 2
   - Format: "H###: Statement text" using the EXACT code number from the SDS
   - Include combination codes like "H300+H310: Fatal if swallowed or in contact with skin"
   - ❌ DO NOT substitute codes (e.g., don't use H400 when SDS says H410)
   - ❌ DO NOT infer hazards from toxicity data in other sections
   - ❌ DO NOT include environmental codes unless Section 2 explicitly classifies them
   
2. **Precautionary Statements**: Extract EXACTLY as written in Section 2
   - Format: "P###: Statement text" OR "P###+P###: Combined statement"
   - ⚠️ USE EXACT SDS TEXT: Copy the precautionary statement text VERBATIM from the SDS
   - ❌ DO NOT use standard GHS boilerplate - use the ACTUAL text from the document
   - ❌ DO NOT add content not in the SDS (e.g., don't add "hearing protection" if not mentioned)
   - ❌ NEVER output ellipses (...), brackets [...], or placeholder text
   
   EXAMPLES of correct extraction:
   - SDS says "Wash face, hands and any exposed skin thoroughly after handling."
     → Output: "P264: Wash face, hands and any exposed skin thoroughly after handling."
   - SDS says "Wear protective gloves, protective clothing, face protection, and eye protection such as safety glasses."
     → Output: "P280: Wear protective gloves, protective clothing, face protection, and eye protection such as safety glasses."
    - SDS says "Dispose of contents in accordance with all applicable federal, state, and local regulations."
     → Output: "P501: Dispose of contents in accordance with all applicable federal, state, and local regulations."
   
   If the SDS includes explicit P-codes, preserve them exactly (including combined codes like P302+P352)

3. **Signal Word**: Must be exactly "Danger", "Warning", or "None"
   - "Danger" for fatal/toxic/corrosive hazards (H300, H310, H330, H314, etc.)
   - "Warning" for harmful/irritant hazards (H302, H315, H319, etc.)
   - Use the signal word explicitly stated in Section 2

4. **Pictograms**: Use ONLY codes explicitly shown in Section 2
   - GHS01: Exploding bomb
   - GHS02: Flame
   - GHS03: Flame over circle (oxidizer)
   - GHS04: Gas cylinder
   - GHS05: Corrosion
   - GHS06: Skull and crossbones
   - GHS07: Exclamation mark
   - GHS08: Health hazard
   - GHS09: Environment (ONLY if Section 2 explicitly includes environmental classification)
   - ❌ DO NOT include GHS09 just because Section 12 mentions aquatic toxicity

5. **Product Identifier**: The chemical name or product name from Section 1
6. **Supplier Info**: Manufacturer/supplier name and contact from Section 1
7. **SDS Date**: The revision date or issuing date found on the document (e.g., "June 12, 2015")

REMEMBER: 
- Section 2 is the ONLY source for GHS label elements
- Use EXACT codes as written - never substitute or simplify
- Use EXACT TEXT from the SDS - never substitute with standard GHS boilerplate
- If the SDS says "eye protection such as safety glasses", output EXACTLY that - don't change it to "eye protection/face protection/hearing protection"
- NEVER ADD content not explicitly in the SDS (no hallucination)
- ALWAYS extract the SDS Date if visible on any page (usually page 1)
- Combined P-codes must stay combined (P302+P352, P305+P351+P338, etc.)
- Section 12 ecological data is INFORMATIONAL, not for labeling
- When in doubt, OMIT the hazard rather than over-label"""


def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a PDF file using pdfplumber."""
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def _convert_validation_result(result: ValidationResult) -> ValidationResponse:
    """Convert internal ValidationResult to API response model."""
    return ValidationResponse(
        is_valid=result.is_valid,
        needs_review=result.needs_review,
        issues=[
            ValidationIssueResponse(
                code=issue.code,
                severity=ValidationSeverityEnum(issue.severity.value),
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
        suggested_pictograms=[]  # Will be populated separately
    )


def parse_sds_with_ai(text: str) -> Tuple[GHSLabel, bool]:
    """
    Uses OpenAI with instructor to parse SDS text into a GHSLabel object.
    Returns (GHSLabel, needs_review).
    
    This is the legacy function maintained for backward compatibility.
    Use parse_sds_with_validation() for comprehensive validation results.
    """
    ghs_data = client.chat.completions.create(
        model="gpt-4o-mini",
        response_model=GHSLabel,
        messages=[
            {"role": "system", "content": SDS_EXTRACTION_PROMPT},
            {"role": "user", "content": text},
        ],
    )
    
    # Comprehensive validation
    validation_result = validate_ghs_label(
        signal_word=ghs_data.signal_word,
        hazard_statements=ghs_data.hazard_statements,
        precautionary_statements=ghs_data.precautionary_statements,
        pictograms=ghs_data.pictograms
    )
    
    # Update statements with validated versions
    ghs_data.hazard_statements = validation_result.validated_hazard_statements
    ghs_data.precautionary_statements = validation_result.validated_precautionary_statements
    
    # Override pictograms with correct ones based on H-codes (prevents AI hallucination)
    ghs_data.pictograms = suggest_pictograms_for_codes(ghs_data.hazard_statements)
    
    # Run Guard for supplemental hazards (e.g. EUH031 for bleach)
    guard = hazlabel_guard(
        product_name=ghs_data.product_identifier,
        hazard_statements=ghs_data.hazard_statements,
        precautionary_statements=ghs_data.precautionary_statements,
        pictograms=ghs_data.pictograms,
        sds_date=ghs_data.sds_date
    )
    
    # Inject supplemental hazards into ghs_data
    if guard["supplemental_hazards"]:
        ghs_data.hazard_statements.extend(guard["supplemental_hazards"])
    
    # Apply signal word correction if critical
    if not validation_result.signal_word_valid and validation_result.suggested_signal_word:
        # Check if any issue is CRITICAL for signal word
        for issue in validation_result.issues:
            if issue.code == "SIGNAL_WORD" and issue.severity == ValidationSeverity.CRITICAL:
                ghs_data.signal_word = validation_result.suggested_signal_word
                break
    
    return ghs_data, validation_result.needs_review


def parse_sds_with_validation(text: str) -> GHSLabelValidated:
    """
    Parse SDS text and return comprehensive validation results.
    
    This is the recommended function for new implementations as it provides:
    - Validated hazard and precautionary statements
    - Signal word validation with severity-based corrections
    - Missing P-code identification for critical hazards
    - Suggested pictograms based on hazard codes
    
    Args:
        text: Raw text extracted from an SDS PDF
        
    Returns:
        GHSLabelValidated containing both the label and validation results
    """
    # Extract GHS data using AI
    ghs_data = client.chat.completions.create(
        model="gpt-4o-mini",
        response_model=GHSLabel,
        messages=[
            {"role": "system", "content": SDS_EXTRACTION_PROMPT},
            {"role": "user", "content": text},
        ],
    )
    
    # Comprehensive validation
    validation_result = validate_ghs_label(
        signal_word=ghs_data.signal_word,
        hazard_statements=ghs_data.hazard_statements,
        precautionary_statements=ghs_data.precautionary_statements,
        pictograms=ghs_data.pictograms
    )
    
    # Convert to API response format
    validation_response = _convert_validation_result(validation_result)
    
    # Calculate correct pictograms based on H-codes (with precedence rules applied)
    # This overrides AI's potentially hallucinated pictograms
    correct_pictograms = suggest_pictograms_for_codes(ghs_data.hazard_statements)
    validation_response.suggested_pictograms = correct_pictograms
    
    # Update the label with validated statements AND corrected pictograms
    validated_label = GHSLabel(
        product_identifier=ghs_data.product_identifier,
        signal_word=validation_result.suggested_signal_word if not validation_result.signal_word_valid else ghs_data.signal_word,
        hazard_statements=validation_result.validated_hazard_statements,
        precautionary_statements=validation_result.validated_precautionary_statements,
        pictograms=correct_pictograms,  # Use calculated pictograms, not AI's output
        supplier_info=ghs_data.supplier_info,
        sds_date=ghs_data.sds_date
    )
    
    # Run HazLabel Guard for supplemental checks
    guard_result = hazlabel_guard(
        product_name=ghs_data.product_identifier,
        hazard_statements=validated_label.hazard_statements,
        precautionary_statements=validated_label.precautionary_statements,
        pictograms=validated_label.pictograms,
        sds_date=ghs_data.sds_date
    )
    
    # Add guard results to response
    validation_response.supplemental_hazards = guard_result["supplemental_hazards"]
    validation_response.sds_age_warning = guard_result["sds_age_warning"]
    
    return GHSLabelValidated(
        label=validated_label,
        validation=validation_response
    )
