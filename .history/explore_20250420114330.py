import json
import requests
from bs4 import BeautifulSoup

INPUT_FILE = "text/portugalbirds.txt"
OUTPUT_FILE = "text/test.json"

def main():
    url = "https://vogelsportugal.nl/aalscholver/"  # example bird page
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    title = soup.find("h1").get_text(strip=True)
    content_div = soup.find("div", class_="entry-content")

    if not content_div:
        print("Content not found")
        return

    paragraphs = content_div.find_all("p")
    text = "\n\n".join(p.get_text(strip=True) for p in paragraphs)

    entry = {
        "name": title,
        "info": text
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump([entry], f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
