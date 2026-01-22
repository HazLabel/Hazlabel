"""
GHS Validation Module

Comprehensive validation logic for GHS compliance including:
- H-code and P-code validation
- Pictogram precedence rules (GHS Annex 1)
- Supplemental hazard injection (EUH codes)
- SDS age validation
"""

from typing import Tuple, List, Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass
import difflib
import re
from datetime import datetime

# ============================================================================
# ENUMS AND DATA CLASSES
# ============================================================================

class ValidationSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class ValidationIssue:
    code: str
    severity: ValidationSeverity
    message: str
    suggestion: Optional[str] = None

@dataclass
class ValidationResult:
    is_valid: bool
    needs_review: bool
    issues: List[ValidationIssue]
    validated_hazard_statements: List[str]
    validated_precautionary_statements: List[str]
    missing_p_codes: List[str]
    signal_word_valid: bool
    suggested_signal_word: Optional[str]

# ============================================================================
# OFFICIAL GHS CODE DATABASES (UN GHS Rev 11)
# ============================================================================

GHS_H_CODES = {
    # Physical Hazards
    "H200": "Unstable explosive",
    "H201": "Explosive; mass explosion hazard",
    "H202": "Explosive; severe projection hazard",
    "H203": "Explosive; fire, blast or projection hazard",
    "H204": "Fire or projection hazard",
    "H205": "May mass explode in fire",
    "H220": "Extremely flammable gas",
    "H221": "Flammable gas",
    "H222": "Extremely flammable aerosol",
    "H223": "Flammable aerosol",
    "H224": "Extremely flammable liquid and vapor",
    "H225": "Highly flammable liquid and vapor",
    "H226": "Flammable liquid and vapor",
    "H227": "Combustible liquid",
    "H228": "Flammable solid",
    "H229": "Pressurized container: may burst if heated",
    "H230": "May react explosively even in the absence of air",
    "H231": "May react explosively even in the absence of air at elevated pressure and/or temperature",
    "H240": "Heating may cause an explosion",
    "H241": "Heating may cause a fire or explosion",
    "H242": "Heating may cause a fire",
    "H250": "Catches fire spontaneously if exposed to air",
    "H251": "Self-heating; may catch fire",
    "H252": "Self-heating in large quantities; may catch fire",
    "H260": "In contact with water releases flammable gases which may ignite spontaneously",
    "H261": "In contact with water releases flammable gas",
    "H270": "May cause or intensify fire; oxidizer",
    "H271": "May cause fire or explosion; strong oxidizer",
    "H272": "May intensify fire; oxidizer",
    "H280": "Contains gas under pressure; may explode if heated",
    "H281": "Contains refrigerated gas; may cause cryogenic burns or injury",
    "H290": "May be corrosive to metals",
    
    # Health Hazards
    "H300": "Fatal if swallowed",
    "H301": "Toxic if swallowed",
    "H302": "Harmful if swallowed",
    "H303": "May be harmful if swallowed",
    "H304": "May be fatal if swallowed and enters airways",
    "H305": "May be harmful if swallowed and enters airways",
    "H310": "Fatal in contact with skin",
    "H311": "Toxic in contact with skin",
    "H312": "Harmful in contact with skin",
    "H313": "May be harmful in contact with skin",
    "H314": "Causes severe skin burns and eye damage",
    "H315": "Causes skin irritation",
    "H316": "Causes mild skin irritation",
    "H317": "May cause an allergic skin reaction",
    "H318": "Causes serious eye damage",
    "H319": "Causes serious eye irritation",
    "H320": "Causes eye irritation",
    "H330": "Fatal if inhaled",
    "H331": "Toxic if inhaled",
    "H332": "Harmful if inhaled",
    "H333": "May be harmful if inhaled",
    "H334": "May cause allergy or asthma symptoms or breathing difficulties if inhaled",
    "H335": "May cause respiratory irritation",
    "H336": "May cause drowsiness or dizziness",
    "H340": "May cause genetic defects",
    "H341": "Suspected of causing genetic defects",
    "H350": "May cause cancer",
    "H351": "Suspected of causing cancer",
    "H360": "May damage fertility or the unborn child",
    "H361": "Suspected of damaging fertility or the unborn child",
    "H362": "May cause harm to breast-fed children",
    "H370": "Causes damage to organs",
    "H371": "May cause damage to organs",
    "H372": "Causes damage to organs through prolonged or repeated exposure",
    "H373": "May cause damage to organs through prolonged or repeated exposure",
    
    # Environmental Hazards
    "H400": "Very toxic to aquatic life",
    "H401": "Toxic to aquatic life",
    "H402": "Harmful to aquatic life",
    "H410": "Very toxic to aquatic life with long lasting effects",
    "H411": "Toxic to aquatic life with long lasting effects",
    "H412": "Harmful to aquatic life with long lasting effects",
    "H413": "May cause long lasting harmful effects to aquatic life",
    "H420": "Harms public health and the environment by destroying ozone in the upper atmosphere",
}

GHS_P_CODES = {
    # Prevention
    "P201": "Obtain special instructions before use.",
    "P202": "Do not handle until all safety precautions have been read and understood.",
    "P210": "Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.",
    "P211": "Do not spray on an open flame or other ignition source.",
    "P220": "Keep away from clothing and other combustible materials.",
    "P221": "Take any precaution to avoid mixing with combustibles.",
    "P222": "Do not allow contact with air.",
    "P223": "Do not allow contact with water.",
    "P230": "Keep wetted with water.",
    "P231": "Handle under inert gas.",
    "P232": "Protect from moisture.",
    "P233": "Keep container tightly closed.",
    "P234": "Keep only in original container.",
    "P235": "Keep cool.",
    "P240": "Ground/bond container and receiving equipment.",
    "P241": "Use explosion-proof electrical/ventilating/lighting equipment.",
    "P242": "Use only non-sparking tools.",
    "P243": "Take precautionary measures against static discharge.",
    "P244": "Keep valves and fittings free from oil and grease.",
    "P250": "Do not subject to grinding/shock/friction.",
    "P251": "Pressurized container: Do not pierce or burn, even after use.",
    "P260": "Do not breathe dust/fume/gas/mist/vapors/spray.",
    "P261": "Avoid breathing dust/fume/gas/mist/vapors/spray.",
    "P262": "Do not get in eyes, on skin, or on clothing.",
    "P263": "Avoid contact during pregnancy/while nursing.",
    "P264": "Wash hands thoroughly after handling.",
    "P270": "Do not eat, drink or smoke when using this product.",
    "P271": "Use only outdoors or in a well-ventilated area.",
    "P272": "Contaminated work clothing should not be allowed out of the workplace.",
    "P273": "Avoid release to the environment.",
    "P280": "Wear protective gloves/protective clothing/eye protection/face protection.",
    "P281": "Use personal protective equipment as required.",
    "P282": "Wear cold insulating gloves/face shield/eye protection.",
    "P283": "Wear fire/flame resistant/retardant clothing.",
    "P284": "Wear respiratory protection.",
    "P285": "In case of inadequate ventilation wear respiratory protection.",
    
    # Response
    "P301": "IF SWALLOWED:",
    "P302": "IF ON SKIN:",
    "P303": "IF ON SKIN (or hair):",
    "P304": "IF INHALED:",
    "P305": "IF IN EYES:",
    "P306": "IF ON CLOTHING:",
    "P307": "IF exposed:",
    "P308": "IF exposed or concerned:",
    "P309": "IF exposed or if you feel unwell:",
    "P310": "Immediately call a POISON CENTER or doctor/physician.",
    "P311": "Call a POISON CENTER or doctor/physician.",
    "P312": "Call a POISON CENTER or doctor/physician if you feel unwell.",
    "P313": "Get medical advice/attention.",
    "P314": "Get medical advice/attention if you feel unwell.",
    "P315": "Get immediate medical advice/attention.",
    "P320": "Specific treatment is urgent (see supplemental first aid instructions on this label).",
    "P321": "Specific treatment (see supplemental first aid instructions on this label).",
    "P322": "Specific measures (see supplemental first aid instructions on this label).",
    "P330": "Rinse mouth.",
    "P331": "Do NOT induce vomiting.",
    "P332": "If skin irritation occurs:",
    "P333": "If skin irritation or rash occurs:",
    "P334": "Immerse in cool water/wrap in wet bandages.",
    "P335": "Brush off loose particles from skin.",
    "P336": "Thaw frosted parts with lukewarm water. Do not rub affected area.",
    "P337": "If eye irritation persists:",
    "P338": "Remove contact lenses, if present and easy to do. Continue rinsing.",
    "P340": "Remove person to fresh air and keep comfortable for breathing.",
    "P341": "If breathing is difficult, remove person to fresh air and keep comfortable for breathing.",
    "P342": "If experiencing respiratory symptoms:",
    "P350": "Gently wash with plenty of soap and water.",
    "P351": "Rinse cautiously with water for several minutes.",
    "P352": "Wash with plenty of soap and water.",
    "P353": "Rinse skin with water/shower.",
    "P360": "Rinse immediately contaminated clothing and skin with plenty of water before removing clothes.",
    "P361": "Remove/Take off immediately all contaminated clothing.",
    "P362": "Take off contaminated clothing and wash before reuse.",
    "P363": "Wash contaminated clothing before reuse.",
    "P364": "And wash it before reuse.",
    "P370": "In case of fire:",
    "P371": "In case of major fire and large quantities:",
    "P372": "Explosion risk in case of fire.",
    "P373": "DO NOT fight fire when fire reaches explosives.",
    "P374": "Fight fire with normal precautions from a reasonable distance.",
    "P375": "Fight fire remotely due to the risk of explosion.",
    "P376": "Stop leak if safe to do so.",
    "P377": "Leaking gas fire: Do not extinguish, unless leak can be stopped safely.",
    "P378": "Use dry sand, dry chemical or alcohol-resistant foam for extinction.",
    "P380": "Evacuate area.",
    "P381": "Eliminate all ignition sources if safe to do so.",
    "P390": "Absorb spillage to prevent material damage.",
    "P391": "Collect spillage.",
    
    # Storage
    "P401": "Store in accordance with local/regional/national/international regulations.",
    "P402": "Store in a dry place.",
    "P403": "Store in a well-ventilated place.",
    "P404": "Store in a closed container.",
    "P405": "Store locked up.",
    "P406": "Store in corrosive resistant container with resistant inner liner.",
    "P407": "Maintain air gap between stacks/pallets.",
    "P410": "Protect from sunlight.",
    "P411": "Store at temperatures not exceeding specified temperature.",
    "P412": "Do not expose to temperatures exceeding 50°C/122°F.",
    "P413": "Store bulk masses greater than specified value at temperatures not exceeding specified temperature.",
    "P420": "Store away from other materials.",
    
    # Disposal
    "P501": "Dispose of contents/container in accordance with local/regional/national/international regulations.",
    "P502": "Refer to manufacturer or supplier for information on recovery or recycling.",
    
    # Combined P-codes
    "P301+P310": "IF SWALLOWED: Immediately call a POISON CENTER or doctor/physician.",
    "P301+P312": "IF SWALLOWED: Call a POISON CENTER or doctor/physician if you feel unwell.",
    "P301+P330+P331": "IF SWALLOWED: Rinse mouth. Do NOT induce vomiting.",
    "P302+P334": "IF ON SKIN: Immerse in cool water/wrap in wet bandages.",
    "P302+P350": "IF ON SKIN: Gently wash with plenty of soap and water.",
    "P302+P352": "IF ON SKIN: Wash with plenty of soap and water.",
    "P303+P361+P353": "IF ON SKIN (or hair): Remove/Take off immediately all contaminated clothing. Rinse skin with water/shower.",
    "P304+P312": "IF INHALED: Call a POISON CENTER or doctor/physician if you feel unwell.",
    "P304+P340": "IF INHALED: Remove person to fresh air and keep comfortable for breathing.",
    "P304+P341": "IF INHALED: If breathing is difficult, remove person to fresh air and keep comfortable for breathing.",
    "P305+P351+P338": "IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.",
    "P306+P360": "IF ON CLOTHING: Rinse immediately contaminated clothing and skin with plenty of water before removing clothes.",
    "P307+P311": "IF exposed: Call a POISON CENTER or doctor/physician.",
    "P308+P313": "IF exposed or concerned: Get medical advice/attention.",
    "P309+P311": "IF exposed or if you feel unwell: Call a POISON CENTER or doctor/physician.",
    "P332+P313": "If skin irritation occurs: Get medical advice/attention.",
    "P333+P313": "If skin irritation or rash occurs: Get medical advice/attention.",
    "P335+P334": "Brush off loose particles from skin. Immerse in cool water/wrap in wet bandages.",
    "P337+P313": "If eye irritation persists: Get medical advice/attention.",
    "P342+P311": "If experiencing respiratory symptoms: Call a POISON CENTER or doctor/physician.",
    "P370+P376": "In case of fire: Stop leak if safe to do so.",
    "P370+P378": "In case of fire: Use dry sand, dry chemical or alcohol-resistant foam for extinction.",
    "P370+P380": "In case of fire: Evacuate area.",
    "P370+P380+P375": "In case of fire: Evacuate area. Fight fire remotely due to the risk of explosion.",
    "P371+P380+P375": "In case of major fire and large quantities: Evacuate area. Fight fire remotely due to the risk of explosion.",
    "P402+P404": "Store in a dry place. Store in a closed container.",
    "P403+P233": "Store in a well-ventilated place. Keep container tightly closed.",
    "P403+P235": "Store in a well-ventilated place. Keep cool.",
    "P410+P403": "Protect from sunlight. Store in a well-ventilated place.",
    "P410+P412": "Protect from sunlight. Do not expose to temperatures exceeding 50°C/122°F.",
}

# Pictogram to H-code mapping
PICTOGRAM_H_CODE_MAP = {
    "GHS01": ["H200", "H201", "H202", "H203", "H204", "H205", "H240", "H241"],  # Exploding Bomb
    "GHS02": ["H220", "H221", "H222", "H223", "H224", "H225", "H226", "H227", "H228", "H241", "H242", "H250", "H251", "H252", "H260", "H261"],  # Flame
    "GHS03": ["H270", "H271", "H272"],  # Flame Over Circle (Oxidizer)
    "GHS04": ["H280", "H281"],  # Gas Cylinder
    "GHS05": ["H290", "H314", "H318"],  # Corrosion
    "GHS06": ["H300", "H301", "H310", "H311", "H330", "H331"],  # Skull and Crossbones (Acute Toxicity)
    "GHS07": ["H302", "H312", "H315", "H317", "H319", "H332", "H335", "H336"],  # Exclamation Mark
    "GHS08": ["H304", "H334", "H340", "H341", "H350", "H351", "H360", "H361", "H370", "H371", "H372", "H373"],  # Health Hazard
    "GHS09": ["H400", "H410", "H411", "H420"],  # Environment (H412/H413 do not require GHS09)
}

# EUH Codes (EU-specific supplemental hazard statements)
EUH_CODES = {
    "EUH001": "Explosive when dry.",
    "EUH006": "Explosive with or without contact with air.",
    "EUH014": "Reacts violently with water.",
    "EUH018": "In use, may form flammable/explosive vapor-air mixture.",
    "EUH019": "May form explosive peroxides.",
    "EUH029": "Contact with water liberates toxic gas.",
    "EUH031": "Contact with acids liberates toxic gas.",
    "EUH032": "Contact with acids liberates very toxic gas.",
    "EUH044": "Risk of explosion if heated under confinement.",
    "EUH066": "Repeated exposure may cause skin dryness or cracking.",
    "EUH070": "Toxic by eye contact.",
    "EUH071": "Corrosive to the respiratory tract.",
    "EUH201": "Contains lead. Should not be used on surfaces liable to be chewed or sucked by children.",
    "EUH202": "Cyanoacrylate. Danger. Bonds skin and eyes in seconds. Keep out of the reach of children.",
    "EUH203": "Contains chromium (VI). May produce an allergic reaction.",
    "EUH204": "Contains isocyanates. May produce an allergic reaction.",
    "EUH205": "Contains epoxy constituents. May produce an allergic reaction.",
    "EUH206": "Warning! Do not use together with other products. May release dangerous gases (chlorine).",
    "EUH207": "Warning! Contains cadmium. Dangerous fumes are formed during use. See information supplied by the manufacturer. Comply with the safety instructions.",
    "EUH208": "Contains sensitizing substance. May produce an allergic reaction.",
    "EUH209": "Can become highly flammable in use.",
    "EUH210": "Safety data sheet available on request.",
    "EUH401": "To avoid risks to human health and the environment, comply with the instructions for use.",
}

# Chemical-specific EUH requirements
CHEMICAL_EUH_REQUIREMENTS = {
    "sodium hypochlorite": ["EUH031"],
    "bleach": ["EUH031"],
    "hypochlorite": ["EUH031"],
    "chlorine": ["EUH031"],
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

def validate_hazard_statements(statements: List[str]) -> Tuple[List[str], bool]:
    """
    Validates statements against official GHS codes.
    Returns (validated_statements, needs_review_flag).
    """
    validated = []
    needs_review = False
    
    for stmt in statements:
        # Check if the statement looks like an H-code (e.g., "H225: Highly flammable...")
        parts = stmt.split(":", 1)
        code = parts[0].strip().upper()
        
        if code in GHS_H_CODES:
            official_text = GHS_H_CODES[code]
            extracted_text = parts[1].strip() if len(parts) > 1 else ""
            
            # Fuzzy match (similarity ratio > 0.9)
            similarity = difflib.SequenceMatcher(None, official_text.lower(), extracted_text.lower()).ratio()
            
            if similarity < 0.9:
                # Discrepancy found, flag for review but keep official text
                needs_review = True
                validated.append(f"{code}: {official_text}")
            else:
                validated.append(f"{code}: {official_text}")
        else:
            # Code not found or not an H-code statement
            validated.append(stmt)
            needs_review = True
            
    return validated, needs_review


def validate_ghs_label(
    signal_word: str,
    hazard_statements: List[str],
    precautionary_statements: List[str],
    pictograms: List[str]
) -> ValidationResult:
    """
    Comprehensive validation of a GHS label against official rules.
    """
    issues = []
    needs_review = False
    
    # 1. Validate H-codes
    validated_h, h_needs_review = validate_hazard_statements(hazard_statements)
    if h_needs_review:
        needs_review = True
        issues.append(ValidationIssue(
            code="HAZARD_STATEMENTS",
            severity=ValidationSeverity.WARNING,
            message="Some hazard statements might be non-standard or misspelled",
            suggestion="Verify against GHS Rev 11"
        ))
        
    # 2. Extract clean codes for rule processing
    clean_h = []
    for stmt in validated_h:
        match = re.match(r'^(H\d{3})', stmt.upper())
        if match: clean_h.append(match.group(1))

    # 3. Signal Word Validation
    suggested_sw = "Warning"
    critical_h = ["H300", "H310", "H330", "H314", "H318", "H340", "H350", "H360", "H370"]
    if any(h in critical_h for h in clean_h):
        suggested_sw = "Danger"
    
    sw_valid = signal_word == suggested_sw
    if not sw_valid:
        issues.append(ValidationIssue(
            code="SIGNAL_WORD",
            severity=ValidationSeverity.CRITICAL,
            message=f"Signal word should be '{suggested_sw}' based on hazards, found '{signal_word}'",
            suggestion=f"Change signal word to {suggested_sw}"
        ))

    # 4. Missing P-codes (Simplified logic for now)
    missing_p = []
    if "H314" in clean_h and not any("P280" in p for p in precautionary_statements):
        missing_p.append("P280")
        issues.append(ValidationIssue(
            code="H314",
            severity=ValidationSeverity.ERROR,
            message="Corrosive hazard H314 requires P280 (protective equipment)",
            suggestion="Add P280"
        ))

    return ValidationResult(
        is_valid=not any(i.severity == ValidationSeverity.ERROR for i in issues),
        needs_review=needs_review or len(issues) > 0,
        issues=issues,
        validated_hazard_statements=validated_h,
        validated_precautionary_statements=precautionary_statements,
        missing_p_codes=missing_p,
        signal_word_valid=sw_valid,
        suggested_signal_word=suggested_sw
    )


def suggest_pictograms_for_codes(h_codes: List[str]) -> List[str]:
    """
    Suggest pictograms based on H-codes, applying GHS Annex 1 precedence rules.
    """
    suggested = set()
    
    # Extract just the code part (e.g., "H314" from "H314: Causes severe...")
    clean_codes = []
    for code in h_codes:
        match = re.match(r'^(H\d{3})', code.upper())
        if match:
            clean_codes.append(match.group(1))
    
    # Map H-codes to pictograms
    for code in clean_codes:
        for pictogram, h_code_list in PICTOGRAM_H_CODE_MAP.items():
            if code in h_code_list:
                suggested.add(pictogram)
    
    # Apply GHS Annex 1 precedence rules
    # Rule 1: If GHS06 (skull/crossbones) is present, GHS07 (exclamation) should not appear
    if "GHS06" in suggested and "GHS07" in suggested:
        # According to GHS, if GHS06 appears, GHS07 is NOT used for acute toxicity, 
        # skin/eye irritation, or skin sensitization.
        # But if GHS07 is needed for STOT SE (H335, H336), some jurisdictions keep it.
        # Standard GHS says discard.
        suggested.discard("GHS07")
    
    # Rule 2: If GHS05 (corrosion) is present, GHS07 should not appear for skin/eye IRRITATION
    # BUT GHS07 MUST remain if required for other hazards like H332 (Acute 4) or H317 (Sensitizer)
    if "GHS05" in suggested and "GHS07" in suggested:
        # Check if GHS07 is only triggered by H315/H319/H320
        # If any other GHS07 code is present (like H332), we MUST keep GHS07
        ghs07_only_irritation = all(code in ["H315", "H319", "H320"] for code in clean_codes if any(code in h_list for p, h_list in PICTOGRAM_H_CODE_MAP.items() if p == "GHS07"))
        if ghs07_only_irritation:
            # We also need to check if GHS05 is specifically for Skin/Eye (H314/H318)
            if any(code in ["H314", "H318"] for code in clean_codes):
                suggested.discard("GHS07")
    
    # Rule 3: If GHS08 (health hazard) is present for respiratory sensitization, 
    # GHS07 should not appear for skin sensitization or irritation
    if "GHS08" in suggested and "GHS07" in suggested:
        # Only remove GHS07 if it's not needed for other hazards
        ghs07_needed = any(code in ["H302", "H312", "H332", "H336"] for code in clean_codes)
        if not ghs07_needed:
            suggested.discard("GHS07")
    
    return sorted(list(suggested))


def get_supplemental_hazards(product_name: str, h_codes: List[str]) -> List[str]:
    """
    Get supplemental hazard statements (EUH codes) based on product name and H-codes.
    """
    supplemental = []
    product_lower = product_name.lower() if product_name else ""
    
    # Check for chemical-specific EUH requirements
    for chemical, euh_codes in CHEMICAL_EUH_REQUIREMENTS.items():
        if chemical in product_lower:
            for euh in euh_codes:
                if euh in EUH_CODES:
                    supplemental.append(f"{euh}: {EUH_CODES[euh]}")
    
    return supplemental


def validate_sds_age(sds_date: str) -> Dict[str, Any]:
    """
    Validate if an SDS is outdated (older than 5 years).
    Returns dict with is_outdated flag and warning message.
    """
    if not sds_date:
        return {
            "is_outdated": False,
            "warning": None,
            "years_old": None
        }
    
    try:
        # Try various date formats
        date_formats = [
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%B %d, %Y",
            "%d %B %Y",
            "%Y/%m/%d",
        ]
        
        parsed_date = None
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(sds_date.strip(), fmt)
                break
            except ValueError:
                continue
        
        if not parsed_date:
            # Try to extract year at minimum
            year_match = re.search(r'\b(20\d{2})\b', sds_date)
            if year_match:
                parsed_date = datetime(int(year_match.group(1)), 6, 15)  # Assume mid-year
        
        if parsed_date:
            years_old = (datetime.now() - parsed_date).days / 365.25
            is_outdated = years_old > 5
            
            return {
                "is_outdated": is_outdated,
                "warning": f"SDS is {years_old:.1f} years old. Review recommended." if is_outdated else None,
                "years_old": round(years_old, 1)
            }
    except Exception:
        pass
    
    return {
        "is_outdated": False,
        "warning": None,
        "years_old": None
    }


def get_code_info(code: str) -> Optional[Dict[str, Any]]:
    """
    Get information about a specific H-code or P-code.
    """
    code = code.upper().strip()
    
    if code in GHS_H_CODES:
        return {
            "code": code,
            "type": "hazard",
            "text": GHS_H_CODES[code],
            "valid": True
        }
    elif code in GHS_P_CODES:
        return {
            "code": code,
            "type": "precautionary",
            "text": GHS_P_CODES[code],
            "valid": True
        }
    
    return None


def get_all_valid_h_codes() -> List[Dict[str, str]]:
    """
    Get all valid H-codes with their official text.
    """
    return [{"code": code, "text": text} for code, text in sorted(GHS_H_CODES.items())]


def get_all_valid_p_codes() -> List[Dict[str, str]]:
    """
    Get all valid P-codes with their official text.
    """
    return [{"code": code, "text": text} for code, text in sorted(GHS_P_CODES.items())]


def hazlabel_guard(
    product_name: str,
    hazard_statements: List[str],
    precautionary_statements: List[str],
    pictograms: List[str],
    sds_date: str = None
) -> Dict[str, Any]:
    """
    Comprehensive HazLabel guard that orchestrates all validation and correction.
    """
    # 1. Validate the label
    validation_result = validate_ghs_label(
        signal_word="Danger",  # Temporary placeholder logic
        hazard_statements=hazard_statements,
        precautionary_statements=precautionary_statements,
        pictograms=pictograms
    )
    
    # 2. Get supplemental hazards
    supplemental_hazards = get_supplemental_hazards(product_name, hazard_statements)
    
    # 3. Validate SDS age
    sds_age_result = validate_sds_age(sds_date)
    
    return {
        "validated_data": {
            "hazard_statements": validation_result.validated_hazard_statements,
            "precautionary_statements": validation_result.validated_precautionary_statements,
            "pictograms": suggest_pictograms_for_codes(hazard_statements)
        },
        "suggested_pictograms": suggest_pictograms_for_codes(hazard_statements),
        "supplemental_hazards": supplemental_hazards,
        "sds_age_warning": sds_age_result.get("warning"),
        "sds_years_old": sds_age_result.get("years_old"),
        "issues": [
            {"code": i.code, "severity": i.severity.value, "message": i.message}
            for i in validation_result.issues
        ],
        "is_valid": validation_result.is_valid
    }
