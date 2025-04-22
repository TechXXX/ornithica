import requests
from bs4 import BeautifulSoup

URL = "https://vogelsportugal.nl/vogels-portugal/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
}

def main():
    print("Fetching bird names from:", URL)
    response = requests.get(URL, headers=HEADERS)
    soup = BeautifulSoup(response.content, "html.parser")

    bird_elements = soup.select("div.t4p-post-content h3 a")
    bird_names = []

    for a in bird_elements:
        name = a.get_text(strip=True)
        if name:
            bird_names.append(name)

    print(f"Found {len(bird_names)} bird names:")
    for name in bird_names:
        print("-", name)

if __name__ == "__main__":
    main()
