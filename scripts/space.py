import json
from urllib.parse import quote
from pathlib import Path

INPUT_FILE = "text/birdsportugal.json"
OUTPUT_FILE = "text/birdsportugal.json"

def encode_audio_urls(data):
    for bird in data:
        audio_url = bird.get("audio")
        if audio_url and ' ' in audio_url:
            parts = audio_url.rsplit("/", 1)
            if len(parts) == 2:
                base, filename = parts
                encoded = quote(filename)
                bird["audio"] = f"{base}/{encoded}"
    return data

def main():
    path = Path(INPUT_FILE)
    if not path.exists():
        print(f"File not found: {INPUT_FILE}")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        birds = json.load(f)

    updated = encode_audio_urls(birds)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False, indent=2)

    print(f"Updated audio URLs written to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
