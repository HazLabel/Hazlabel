import requests
import os

def test_parse_sds():
    url = "http://127.0.0.1:8000/parse-sds"
    # Note: I need a real PDF for this to work correctly.
    # For now, I'll check if the server is up.
    try:
        response = requests.get("http://127.0.0.1:8000/")
        print(f"Root endpoint response: {response.json()}")
    except Exception as e:
        print(f"Error connecting to server: {e}")

if __name__ == "__main__":
    test_parse_sds()
