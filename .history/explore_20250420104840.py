import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://vogelsportugal.nl/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
}
INPUT_FILE = "text/portugalbirds.txt"
OUTPUT_FILE = "text/test.json"

def slugify(name):
    return name.lower().replace("´", "").replace("'", "").replace(" ", "-")

def fetch_media(name):
    slug = slugify(name)
    url = f"{BASE_URL}{slug}/"
    print(f"Fetching {name} → {url}")
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            print("  Failed to fetch page")
            return None, None
        soup = BeautifulSoup(response.content, "html.parser")
        image_tags = soup.find_all("img")
        images = []
        for img in image_tags:
            src = img.get("src", "")
            if "/wp-content/uploads/" in src and slug in src.lower():
                images.append(src)
            if len(images) >= 4:
                break

        audio = soup.select_one("a.wpaudio")
        audio_url = audio["href"] if audio and "href" in audio.attrs else None

        info_paragraphs = soup.select("div.entry-content p span")
        info_text = " ".join(p.get_text(strip=True) for p in info_paragraphs if p.get_text(strip=True))
        return images, audio_url, info_text
    except Exception as e:
        print(f"  Error: {e}")
        return None, None

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        bird_names = [line.strip() for line in f if line.strip()]

    dataset = []
    for name in bird_names[:5]:
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
