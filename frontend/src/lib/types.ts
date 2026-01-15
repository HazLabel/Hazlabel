export type GHSLabel = {
    product_identifier: string;
    signal_word: "Danger" | "Warning" | "None";
    hazard_statements: string[];
    precautionary_statements: string[];
    pictograms: string[];
    supplier_info: string;
};

export type ValidationSeverity = "info" | "warning" | "error" | "critical";

export type ValidationIssue = {
    code: string;
    severity: ValidationSeverity;
    message: string;
    suggestion?: string | null;
    h_code?: string;
    p_code?: string;
    field?: string;
};

export type ValidationResult = {
    is_valid: boolean;
    needs_review: boolean;
    issues: ValidationIssue[];
    validated_hazard_statements: string[];
    validated_precautionary_statements: string[];
    missing_p_codes: string[];
    signal_word_valid: boolean;
    suggested_signal_word?: string | null;
    suggested_pictograms?: string[];
};

export type Chemical = {
    id: string;
    user_id: string;
    name: string;
    ghs_data: GHSLabel | null;
    validation_results?: ValidationResult | null;
    source_pdf_url: string;
    status: "processing" | "completed" | "failed";
    needs_review: boolean;
    error_message?: string;
    created_at: string;
    updated_at?: string;
};
