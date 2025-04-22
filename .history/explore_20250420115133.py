import json
import requests
from bs4 import BeautifulSoup

INPUT_FILE = "text/portugalbirds.txt"
OUTPUT_FILE = "text/test.json"

def main():
    url = "https://vogelsportugal.nl/aalscholver/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    title_tag = soup.find("h1")
    content_div = soup.find("div", class_="entry-content")

    if not title_tag or not content_div:
        print("Title or content not found")
        return

    title = title_tag.get_text(strip=True)

    unwanted_sentences = {
        "Gezien in de Alentejo regio van Portugal.",
        "Gezien aan de westkust van de Alentejo regio van Portugal.",
        "Gezien vanuit deVogelhutopMonte Horizontein de Alentejo regio van Portugal."
    }

    text_parts = []
    paragraphs = content_div.find_all("p")
    for p in paragraphs:
        raw_text = p.get_text(separator=" ", strip=True)
        if raw_text:
            sentences = [s.strip() for s in raw_text.split(".") if s.strip()]
            filtered = [s for s in sentences if s + "." not in unwanted_sentences]
            cleaned = ". ".join(filtered)
            if cleaned:
                text_parts.append(cleaned)

    full_text = "\n\n".join(text_parts)

    entry = {
        "name": title,
        "info": full_text
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump([entry], f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()