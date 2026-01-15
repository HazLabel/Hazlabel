import pdfplumber
import json
import re
import sys

# Configuration
PDF_PATH = "GHS 11th Edition.pdf"
OUTPUT_PATH = "ghs_master_v11.json"

# Verified Indices (Approximate)
# Annex 1: ~282 to 300
# Annex 3 Sec 1 (H-Codes): 301 to 312
# Annex 3 Sec 2 (P-Codes): 313 to 409
# Pictogram Table: 410

ANNEX1_START = 282
ANNEX1_END = 300
HCODES_START = 301
HCODES_END = 312
PCODES_START = 313
PCODES_END = 337
PICTOGRAM_TABLE_PAGE = 410

def clean_text(text):
    if not text:
        return ""
    # Remove leading/trailing
    text = text.strip()
    return text

def extract_pictogram_map(pdf):
    """
    Extracts GHS01-GHS09 mapping from Table A3.4.1 on page 410.
    """
    print(f"Extracting Pictogram Map from page {PICTOGRAM_TABLE_PAGE}...")
    pmap = {}
    try:
        page = pdf.pages[PICTOGRAM_TABLE_PAGE]
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if len(row) >= 2:
                    # Look for GHSXX
                    code_cell = clean_text(row[0])
                    # Symbol name is usually in col 2 (idx 1) or 3
                    # Table A3.4.1: Code | Hazard pictogram | Symbol
                    # Row might be: GHS01 | (Image) | Exploding bomb
                    
                    if re.match(r'GHS0\d', code_cell):
                        # Try last column for specific name
                        symbol_name = clean_text(row[-1])
                        pmap[symbol_name.lower()] = code_cell
                        
        # Manual Enhancements for Heurisitic Matching
        if "flame" in pmap:
            pmap["flammable"] = pmap["flame"]
        else:
             pmap["flammable"] = "GHS02" # Fallback
             
        if "exploding bomb" in pmap:
            pmap["explosive"] = pmap["exploding bomb"]
        else:
            pmap["explosive"] = "GHS01"

        if "flame over circle" in pmap:
             pmap["oxidizing"] = pmap["flame over circle"]
             pmap["oxidiser"] = pmap["flame over circle"]
        else:
             pmap["oxidizing"] = "GHS03"

        if "corrosion" in pmap:
            pmap["corrosive"] = pmap["corrosion"]
        else:
            pmap["corrosive"] = "GHS05"

        if "environment" in pmap:
            pmap["aquatic"] = pmap["environment"]
        else:
            pmap["aquatic"] = "GHS09"
            
    except Exception as e:
        print(f"Pictogram extraction failed: {e}")
        # Fallback
        pmap = {
            "exploding bomb": "GHS01",
            "explosive": "GHS01",
            "flame": "GHS02",
            "flammable": "GHS02",
            "flame over circle": "GHS03",
            "oxidizing": "GHS03",
            "gas cylinder": "GHS04",
            "corrosion": "GHS05",
            "corrosive": "GHS05",
            "skull and crossbones": "GHS06",
            "exclamation mark": "GHS07",
            "health hazard": "GHS08",
            "environment": "GHS09",
            "aquatic": "GHS09"
        }
    
    print(f"Pictogram Map: {pmap}")
    return pmap

def extract_h_codes(pdf):
    h_codes = {}
    print(f"Extracting H-Codes from {HCODES_START}-{HCODES_END}...")
    
    for i in range(HCODES_START, HCODES_END + 1):
        try:
            page = pdf.pages[i]
            tables = page.extract_tables()
            
            for table in tables:
                for row in table:
                    # Filter junk
                    if not row or len(row) < 2: continue
                    
                    # Columns: Code | Text (Sometimes Class is merged or separate)
                    # We look for H-Code in Col 0
                    c0 = clean_text(row[0])
                    
                    # Clean newlines in code (e.g. H300\n+\nH310)
                    c0 = c0.replace('\n', ' ').replace(' ', '')
                    
                    if re.match(r'^H\d{3}', c0):
                        # Corrected: Statement is Col 1. Class is Col 2. Category Col 3.
                        statement = clean_text(row[1])
                        statement = statement.replace('\n', ' ')
                        
                        # Extract class (middle columns)
                        hazard_class = ""
                        h_cat = ""
                        if len(row) > 2:
                            hazard_class = clean_text(row[2]).replace('\n', ' ')
                        if len(row) > 3:
                            h_cat = clean_text(row[3]).replace('\n', ' ')
                            
                        # Combine Class and Category for clearer context if needed, or keep separate
                        full_class = f"{hazard_class} {h_cat}".strip()

                        h_codes[c0] = {
                            "type": "hazard",
                            "code": c0,
                            "hazard_class": full_class,
                            "statement": statement,
                            "category": h_cat
                        }
        except Exception:
            continue

    print(f"Extracted {len(h_codes)} H-codes.")
    return h_codes

def extract_p_codes(pdf):
    print(f"Extracting P-Codes from {PCODES_START}-{PCODES_END}...")
    p_codes = {}
    
    for i in range(PCODES_START, PCODES_END + 1):
        try:
            page = pdf.pages[i]
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row: continue
                    
                    # Row might have 1 col (merged) or multiple
                    # Code is always in col 0.
                    # Text might be in col 0 (merged) or col 1.
                    
                    raw_c0 = row[0] if row[0] else ""
                    raw_c1 = row[1] if len(row) > 1 and row[1] else ""
                    
                    # Split c0 by newlines to handle stacked codes (e.g. P301\nP310)
                    # Use a heuristic: if a line starts with P\d{3}, it's a code entry.
                    lines = raw_c0.split('\n')
                    
                    for line in lines:
                        line = line.strip()
                        if not line: continue
                        
                        # Check for Code + Text pattern: "Pxxx Statement..."
                        # Regex: Start with Pxxx, maybe composed "Pxxx + Pyyy"
                        match = re.match(r'^(P\d{3}(?:\s*\+\s*P\d{3})*)(.*)$', line, re.DOTALL)
                        
                        if match:
                            code_part = match.group(1).strip()
                            remainder = match.group(2).strip()
                            
                            # Clean the code (remove spaces internal to the code string if needed for key consistency)
                            # e.g. "P301 + P310" -> "P301+P310"
                            clean_code = code_part.replace(' ', '')
                            
                            statement = ""
                            
                            # If we have remainder text in col 0, that is the statement (Merge case)
                            if len(remainder) > 2:
                                statement = remainder
                            else:
                                # Otherwise user row[1]
                                # Note: If multiple codes were in row[0], row[1] implies it applies to ALL.
                                # But usually stacked codes in col 0 correspond to stacked statements in col 1?
                                # This is tricky.
                                # Simplification: Use row[1] content.
                                if raw_c1:
                                    statement = clean_text(raw_c1)
                                    
                            conditions = ""
                            if len(row) > 4:
                                conditions = clean_text(row[4])
                            elif len(row) > 2:
                                # Sometimes conditions are in col 2 or 3 depending on table
                                conditions = clean_text(row[2]) 

                            if clean_code:
                                p_codes[clean_code] = {
                                    "type": "precautionary",
                                    "code": clean_code,
                                    "statement": statement,
                                    "conditions": conditions
                                }
        except Exception:
            continue

    print(f"Extracted {len(p_codes)} P-codes.")
    return p_codes

def extract_mappings(pdf, pmap):
    mapping = []
    print(f"Extracting Annex 1 Mappings from {ANNEX1_START}-{ANNEX1_END}...")
    
    last_h_class = ""
    
    for i in range(ANNEX1_START, ANNEX1_END + 1):
        try:
            page = pdf.pages[i]
            tables = page.extract_tables()
            
            for table in tables:
                for row in table:
                    if not row: continue
                    # row is list of strings
                    
                    # Columns based on raw debug (p283):
                    # 0: Class
                    # 2: Category
                    # 10: Pictogram (often empty text if image)
                    # 16: Signal Word
                    # -1 (20): H-Code
                    
                    # Find H-Code (Anchor)
                    h_code = None
                    for cell in row:
                        if not cell: continue
                        # Find H3xx (sometimes H2xx)
                        # Use loose regex to capture codes
                        m = re.search(r'(H\d{3}[a-zA-Z]*)', cell)
                        if m:
                            h_code = m.group(1)
                            # H-code found.
                            # Break only if sure it's the H-code column? 
                            # Safest to take the last one or dedicated last column? 
                            # Usually last column.
                            h_code = clean_text(cell).split('\n')[-1] # Handle multiple codes in cell?
                            # For simple extraction, just take match
                            h_code = m.group(1)
                    
                    # If line has no H-code, it might be a header or wrapped text. 
                    # BUT sometimes H-code is merged too? 
                    # Annex 1 usually lists H-code per row.
                    if not h_code: 
                        # Check if it defines a new Class but no H-code yet (header row)
                        raw_class = clean_text(row[0]) if row[0] else ""
                        if raw_class:
                            last_h_class = raw_class
                        continue
                    
                    # Get Class
                    current_class = clean_text(row[0]) if row[0] else ""
                    if current_class:
                        last_h_class = current_class
                    else:
                        # Fill down
                        current_class = last_h_class
                    
                    # Get Category (Col 2 based on debug)
                    # Sometimes it's col 1? Let's check neighbors.
                    # Debug showed Col 2 had '1A'.
                    current_cat = ""
                    if len(row) > 2:
                        current_cat = clean_text(row[2])
                    
                    # If Col 2 is empty, check Col 1 just in case
                    if not current_cat and len(row) > 1:
                        val1 = clean_text(row[1])
                        # If val1 looks like a category (digit or code), use it.
                        if re.match(r'^\d', val1) or val1 in ['A', 'B', 'C']:
                            current_cat = val1

                    # Pictogram Detection
                    # We look for text in the whole row again since columns shift
                    row_text = " ".join([str(c) for c in row if c]).lower()
                    detected_pic = "No Symbol"
                    
                    # Prioritize specific columns if possible? 
                    # Col 10 was empty. 
                    # Try to map SIGNAL WORD to Pictogram as fallback?
                    # Danger -> GHS01, GHS02, GHS05, GHS06, GHS08
                    # Warning -> GHS07
                    # This is too imprecise.
                    
                    # Text search for pmap keys
                    for name, code in pmap.items():
                        if name in row_text:
                            detected_pic = code
                            break
                            
                    # Store
                    mapping.append({
                        "hazard_class": current_class,
                        "category": current_cat,
                        "pictogram_code": detected_pic,
                        "h_code": h_code
                    })
        except Exception:
            continue
            
    print(f"Extracted {len(mapping)} mappings.")
    return mapping

def validate_data(h_codes):
    target = "H410"
    print(f"Validating {target}...")
    if target in h_codes:
        print(f"Found {target}: {h_codes[target]['statement']}")
        if "very toxic" in h_codes[target]['statement'].lower():
            print("Validation PASSED.")
        else:
            print("Validation WARNING: Text check failed.")
    else:
        print(f"Validation FAILED: {target} missing.")

def main():
    with pdfplumber.open(PDF_PATH) as pdf:
        pmap = extract_pictogram_map(pdf)
        h_codes = extract_h_codes(pdf)
        p_codes = extract_p_codes(pdf)
        mapping = extract_mappings(pdf, pmap)
        
        data = {
            "reference_statements": {**h_codes, **p_codes},
            "compliance_mapping": mapping
        }
        
        with open(OUTPUT_PATH, "w") as f:
            json.dump(data, f, indent=2)
            
        validate_data(h_codes)

if __name__ == "__main__":
    main()
