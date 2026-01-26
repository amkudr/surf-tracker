
import httpx
import sys

URL = "https://www.surf-forecast.com/breaks/Fishermans-Sri-Lanka/forecasts/latest/six_day"

def fetch_forecast():
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
    }
    try:
        response = httpx.get(URL, headers=headers, follow_redirects=True)
        response.raise_for_status()
        print(f"Status Code: {response.status_code}")
        print(f"Content Length: {len(response.text)}")
        
        # Check for some keywords
        if "energy" in response.text.lower():
            print("Found 'energy' in content.")
        if "wave" in response.text.lower():
            print("Found 'wave' in content.")
            
        print("First 500 chars:")
        print(response.text[:500])
        
    except Exception as e:
        print(f"Error fetching: {e}")

if __name__ == "__main__":
    fetch_forecast()
