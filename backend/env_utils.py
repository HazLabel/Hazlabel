import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

def load_and_sanitize_env():
    """
    Loads environment variables from .env and sanitizes them.
    Handles common deployment misconfigurations where multiple variables 
    are accidentally pasted into a single environment variable field.
    """
    load_dotenv()
    
    # Check if OPENAI_API_KEY is corrupted with other env vars
    openai_key = os.getenv("OPENAI_API_KEY", "")
    
    if "\n" in openai_key:
        logger.warning("Detected multiline OPENAI_API_KEY. Attempting to sanitize and extract other variables.")
        lines = openai_key.split("\n")
        
        # The first line might be the key itself or "KEY=VALUE"
        first_line = lines[0].strip()
        if "=" in first_line:
            # It's a full .env file content pasted in
            for line in lines:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()
                    if key and value:
                        # Only set if not already set by a "real" env var
                        if key not in os.environ or "\n" in os.environ[key]:
                            os.environ[key] = value
        else:
            # First line is the key, others are separate vars
            os.environ["OPENAI_API_KEY"] = first_line
            for line in lines[1:]:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()
                    if key and value:
                        if key not in os.environ or "\n" in os.environ[key]:
                            os.environ[key] = value

    # Final cleanup for critical variables
    for var in ["OPENAI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "INNGEST_SIGNING_KEY"]:
        val = os.getenv(var, "")
        if val:
            # Remove any residual key name if it was pasted as "KEY=VALUE"
            if val.startswith(f"{var}="):
                val = val.replace(f"{var}=", "", 1).strip()
            # Ensure it's only one line
            if "\n" in val:
                print(f"DEBUG: Sanitizing {var} (removed newline)")
                val = val.split("\n")[0].strip()
            
            if val.strip() != os.environ.get(var):
                os.environ[var] = val.strip()

    # Success indicators for logs
    # print(f"DEBUG: Environment sanitized. OPENAI_API_KEY set: {bool(os.environ.get('OPENAI_API_KEY'))}")
    # print(f"DEBUG: SUPABASE_URL: {os.environ.get('SUPABASE_URL')}")

# Execute on import
load_and_sanitize_env()
