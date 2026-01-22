import pdfplumber
import sys

def extract(path):
    try:
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages):
                print(f"--- PAGE {i+1} ---")
                print(page.extract_text())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract(sys.argv[1])
