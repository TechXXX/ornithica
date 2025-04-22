import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://vogelsportugal.nl"
LIST_URL = f"{BASE_URL}/vogels-portugal/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
}

def get_bird_list():
    print("Fetching bird list...")
    response = requests.get(LIST_URL, headers=HEADERS)
    soup = BeautifulSoup(response.content, "html.parser")
    bird_elements = soup.select("div.t4p-post-content h2.entry-title a")

    birds = []
    for bird in bird_elements:
        name = bird.text.strip()
        link = bird["href"]
        birds.append({"name": name, "url": link})
    print(f"Found {len(birds)} birds.")
    return birds

def get_bird_media(bird_url):
    print(f"Fetching media from {bird_url}...")
    response = requests.get(bird_url, headers=HEADERS)
    soup = BeautifulSoup(response.content, "html.parser")
    image_tag = soup.select_one("div.t4p-content-wrapper img")
    audio_tag = soup.select_one("a.wpaudio")
    
    image_url = image_tag["src"] if image_tag and "src" in image_tag.attrs else None
    audio_url = audio_tag["href"] if audio_tag and "href" in audio_tag.attrs else None
    
    return image_url, audio_url

def build_dataset():
    bird_list = get_bird_list()
    dataset = []

    for bird in bird_list:
        image_url, audio_url = get_bird_media(bird["url"])
        dataset.append({
            "name": bird["name"],
            "image": image_url,
            "audio": audio_url
        })
        time.sleep(1)  # Be nice to the server

    return dataset

def save_dataset(data, filename="birdsportugal.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(data)} birds to {filename}")

def main():
    dataset = build_dataset()
    save_dataset(dataset)

if __name__ == "__main__":
    main()
