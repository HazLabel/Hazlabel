from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from enum import Enum


class GHSLabel(BaseModel):
    """Core GHS label data extracted from an SDS."""
    product_identifier: str = Field(..., description="The name or identifier of the product.")
    signal_word: Literal["Danger", "Warning", "None"] = Field(..., description="The GHS signal word.")
    hazard_statements: List[str] = Field(..., description="List of hazard statements (e.g., 'H225: Highly flammable liquid and vapor').")
    precautionary_statements: List[str] = Field(..., description="List of precautionary statements (e.g., 'P210: Keep away from heat').")
    pictograms: List[Literal["GHS01", "GHS02", "GHS03", "GHS04", "GHS05", "GHS06", "GHS07", "GHS08", "GHS09"]] = Field(
        ..., description="List of GHS pictogram codes."
    )
    supplier_info: str = Field(..., description="Information about the supplier/manufacturer.")
    sds_date: Optional[str] = Field(None, description="The revision or issuing date of the SDS.")


class SDSParseResult(BaseModel):
    """Result of parsing a Safety Data Sheet."""
    ghs_label: GHSLabel
    raw_text_summary: Optional[str] = Field(None, description="A brief summary of the extracted text (optional).")


# -----------------------------------------------------------------------------
# Validation Result Models (for API responses)
# -----------------------------------------------------------------------------

class ValidationSeverityEnum(str, Enum):
    """Severity levels for validation issues."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ValidationIssueResponse(BaseModel):
    """A single validation issue for API response."""
    code: str = Field(..., description="The GHS code related to this issue, or 'UNKNOWN'/'SIGNAL_WORD'")
    severity: ValidationSeverityEnum = Field(..., description="Severity level of the issue")
    message: str = Field(..., description="Human-readable description of the issue")
    suggestion: Optional[str] = Field(None, description="Suggested fix for the issue")


class ValidationResponse(BaseModel):
    """Complete validation result for API response."""
    is_valid: bool = Field(..., description="Whether the label passes all critical validations")
    needs_review: bool = Field(..., description="Whether human review is recommended")
    issues: List[ValidationIssueResponse] = Field(default_factory=list, description="List of validation issues found")
    validated_hazard_statements: List[str] = Field(default_factory=list, description="Validated/corrected hazard statements")
    validated_precautionary_statements: List[str] = Field(default_factory=list, description="Validated precautionary statements")
    missing_p_codes: List[str] = Field(default_factory=list, description="Required P-codes that are missing")
    signal_word_valid: bool = Field(True, description="Whether the signal word matches hazard severity")
    suggested_signal_word: Optional[str] = Field(None, description="Correct signal word if current is wrong")
    suggested_pictograms: List[str] = Field(default_factory=list, description="Pictograms suggested based on hazard codes")
    supplemental_hazards: List[str] = Field(default_factory=list, description="Supplemental hazard statements (EUH codes)")
    sds_age_warning: Optional[str] = Field(None, description="Warning if SDS is outdated")


class GHSLabelValidated(BaseModel):
    """GHS label with validation results attached."""
    label: GHSLabel = Field(..., description="The GHS label data")
    validation: ValidationResponse = Field(..., description="Validation results for this label")


class GHSCodeInfo(BaseModel):
    """Information about a single GHS code."""
    code: str = Field(..., description="The GHS code (e.g., 'H225', 'P210')")
    type: Literal["hazard", "precautionary"] = Field(..., description="Type of code")
    statement: str = Field(..., description="Official statement text")
    hazard_class: Optional[str] = Field(None, description="Hazard class this code belongs to")
    category: Optional[str] = Field(None, description="Category within the hazard class")
    is_deleted: bool = Field(False, description="Whether this code is deleted in current revision")


class PictogramMapping(BaseModel):
    """Mapping between hazard codes and pictograms."""
    h_code: str
    pictogram_code: str
    hazard_class: str
    category: str
