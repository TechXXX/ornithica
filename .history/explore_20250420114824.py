import json
import requests
from bs4 import BeautifulSoup

INPUT_FILE = "text/portugalbirds.txt"
OUTPUT_FILE = "text/test.json"

def main():
    url = "https://vogelsportugal.nl/aalscholver/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    title = soup.find("h1").get_text(strip=True)
    content_div = soup.select_one("article div.entry-content")

    if not content_div:
        print("Content not found")
        return

    # Find all paragraphs inside the content
    paragraphs = content_div.find_all("p")

    # Extract all text content, including from nested spans
    text_parts = []
    for p in paragraphs:
        text = p.get_text(separator=" ", strip=True)
        if text:
            unwanted_sentences = [
                "Gezien in de Alentejo regio van Portugal.",
                "Gezien aan de westkust van de Alentejo regio van Portugal.",
                "Gezien vanuit deVogelhutopMonte Horizontein de Alentejo regio van Portugal."
            ]
            sentences = [s.strip() for s in text.split(".") if s.strip()]
            filtered_sentences = [s for s in sentences if f"{s}." not in unwanted_sentences]
            cleaned_text = ". ".join(filtered_sentences)
            if cleaned_text:
                text_parts.append(cleaned_text)

    full_text = "\n\n".join(text_parts)

    entry = {
        "name": title,
        "info": full_text
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump([entry], f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()