import inngest
from parser import extract_text_from_pdf, parse_sds_with_ai
from database import save_chemical, update_chemical
import httpx
import tempfile
import os

# Create Inngest client
inngest_client = inngest.Inngest(app_id="hazlabel-api")

@inngest_client.create_function(
    fn_id="parse-sds-pdf",
    trigger=inngest.TriggerEvent(event="sds/pdf.uploaded"),
    retries=3, # Explicit retry policy
)
async def parse_sds_job(ctx: inngest.Context, step: inngest.Step):
    """
    Background job to parse an SDS PDF from a URL.
    Updates the database with 'processing', 'completed', or 'failed' status.
    """
    pdf_url = ctx.event.data.get("pdf_url")
    user_id = ctx.event.data.get("user_id")
    
    if not pdf_url or not user_id:
        return {"error": "Missing pdf_url or user_id"}

    # Register the chemical in 'processing' state
    db_record = await step.run("init-db-record", 
        lambda: save_chemical(user_id, "Processing...", None, source_pdf_url=pdf_url, status="processing")
    )
    chemical_id = db_record[0].get("id")

    try:
        # Step 1: Download the PDF
        async def download_pdf():
            async with httpx.AsyncClient() as client:
                response = await client.get(pdf_url)
                response.raise_for_status()
                return response.content

        pdf_content = await step.run("download-pdf", download_pdf)

        # Step 2: Extract text and parse with AI
        async def extract_and_parse():
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(pdf_content)
                tmp_path = tmp.name
            
            try:
                text = extract_text_from_pdf(tmp_path)
                ghs_data, needs_review = parse_sds_with_ai(text)
                return {
                    "ghs_data": ghs_data.model_dump(),
                    "needs_review": needs_review,
                    "name": ghs_data.product_identifier
                }
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        parse_result = await step.run("extract-and-parse", extract_and_parse)

        # Step 3: Update Database to 'completed'
        await step.run("finalize-db-record", 
            lambda: update_chemical(chemical_id, {
                "name": parse_result["name"],
                "ghs_data": parse_result["ghs_data"],
                "needs_review": parse_result["needs_review"],
                "status": "completed"
            })
        )

        return {"status": "success", "chemical_id": chemical_id}

    except Exception as e:
        # Step 4: Handle Failure
        await step.run("mark-failed", 
            lambda: update_chemical(chemical_id, {
                "status": "failed",
                "error_message": str(e)
            })
        )
        raise e # Re-raise to trigger Inngest retry if applicable
