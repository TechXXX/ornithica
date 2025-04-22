import requests
from bs4 import BeautifulSoup
import json
import time
import re

BASE_URL = "https://vogelsportugal.nl/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
}
INPUT_FILE = "text/portugalbirds.txt"
OUTPUT_FILE = "text/test.json"

def slugify(name):
    # Revert to original slugify: remove ´ and '
    return name.lower().replace("´", "").replace("'", "").replace(" ", "-")

def fetch_media(name):
    slug = slugify(name)
    url = f"{BASE_URL}{slug}/"
    print(f"Fetching {name} → {url}")
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            print("  Failed to fetch page")
            return None, None, ""
        soup = BeautifulSoup(response.content, "html.parser")
        image_tags = soup.find_all("img")
        images = []
        for img in image_tags:
            src = img.get("src", "")
            # More flexible image filtering: check for parts of the cleaned name
            cleaned_name = name.lower().replace("´", "").replace("'", "")
            name_parts = cleaned_name.split(" ")
            
            src_lower = src.lower()
            
            if "/wp-content/uploads/" in src_lower:
                # Check if all parts of the name are in the image URL
                all_parts_match = all(part in src_lower for part in name_parts if part)
                if all_parts_match:
                     images.append(src)
                if len(images) >= 4:
                    break

        audio = soup.select_one("a.wpaudio")
        audio_url = audio["href"] if audio and "href" in audio.attrs else None

        info_paragraphs = soup.select("div.entry-content p") # Modified selector to include p tags

        if info_paragraphs:
            full_text = " ".join(p.get_text(strip=True) for p in info_paragraphs if p.get_text(strip=True))
            full_text = full_text.replace("Gezien in de Alentejo regio van Portugal.", "")
            full_text = full_text.replace("Gezien in de Alentejo regio van Portugal", "") # Remove without period
            full_text = full_text.replace("Gezien aan de westkust van de Alentejo regio van Portugal.", "") # Remove new unwanted sentence
            full_text = full_text.replace("Gezien vanuit deVogelhutopMonte Horizontein de Alentejo regio van Portugal.", "") # Remove another unwanted sentence
            full_text = full_text.replace("Gezien opMonte Horizontein de Alentejo regio van Portugal.", "") # Remove yet another unwanted sentence (with period)
            full_text = full_text.replace("Gezien opMonte Horizontein de Alentejo regio van Portugal", "") # Remove the same sentence (without period)
            full_text = full_text.replace("Gezien bijMonte Horizontein de Alentejo regio van Portugal.", "") # Remove new unwanted sentence
            info_text = full_text.strip()
        else:
            info_text = ""
        
        info_text = re.sub(rf"{re.escape(name)}\s+geluid", "", info_text, flags=re.IGNORECASE).strip()
        
        return images, audio_url, info_text
    except Exception as e:
        print(f"  Error: {e}")
        return None, None, ""

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        bird_names = [line.strip() for line in f if line.strip()]

    dataset = []
    for name in bird_names[:10]:
        images, audio, info = fetch_media(name)
        dataset.append({
            "name": name,
            "images": images,
            "audio": audio,
            "info": info
        })
        time.sleep(1)  # polite delay

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(dataset)} birds to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()