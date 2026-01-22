from validation import validate_ghs_label, suggest_pictograms_for_codes

# Mock TFA data from SDS
h_codes = [
    "H314: Causes severe skin burns and eye damage",
    "H332: Harmful if inhaled",
    "H412: Harmful to aquatic life with long lasting effects"
]
p_codes = [] # Not needed for pictograms
pictograms = ["GHS05", "GHS07"] # What the SDS says
signal_word = "Danger"

print("--- TESTING TFA PICTOGRAMS ---")
suggested = suggest_pictograms_for_codes(h_codes)
print(f"Suggested Pictograms: {suggested}")

res = validate_ghs_label(
    signal_word=signal_word,
    hazard_statements=h_codes,
    precautionary_statements=p_codes,
    pictograms=pictograms
)

print(f"Is Valid: {res.is_valid}")
print(f"Issues: {[i.message for i in res.issues]}")
print(f"Needs Review: {res.needs_review}")
