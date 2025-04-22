import requests
from bs4 import BeautifulSoup
import json
import time
import re
import sys # Import sys module

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
 
        # Image extraction
        image_tags = soup.find_all("img")
        all_upload_images = []
        for img in image_tags:
            src = img.get("src", "")
            src_lower = src.lower()
            if "/wp-content/uploads/" in src_lower and (src_lower.endswith(".jpg") or src_lower.endswith(".png") or src_lower.endswith(".gif")):
                all_upload_images.append(src)
 
        images = []
        # Filter images based on keywords
        keywords = [word.lower() for word in name.replace("´", "").replace("'", "").split()] # Keywords from cleaned name
        keywords.extend(["tapuit", "wheatear"]) # Add specific keywords
        
        for src in all_upload_images:
            src_lower = src.lower()
            if any(keyword in src_lower for keyword in keywords):
                images.append(src)
                if len(images) >= 4: # Limit to 4 images
                    break
 
        # Fallback image location (keep existing fallback logic)
        if not images:
            print(f"  No images found on page, trying fallback...")
            fallback_name = name.replace(" ", "%20") # Use %20 for spaces in fallback URL
            fallback_url = f"https://vogelsportugal.nl/Foto/{fallback_name}.jpg"
            try:
                fallback_response = requests.get(fallback_url, headers=HEADERS, stream=True)
                if fallback_response.status_code == 200 and 'image' in fallback_response.headers.get('Content-Type', '').lower():
                    images = [fallback_url] # Add the fallback image if found
                    print(f"  Found fallback image: {fallback_url}")
                else:
                    print(f"  Fallback image not found or not an image: {fallback_response.status_code}")
            except Exception as e:
                print(f"  Error fetching fallback image: {e}")
            finally:
                if 'fallback_response' in locals() and fallback_response:
                    fallback_response.close() # Ensure the connection is closed
 
        # Audio extraction
        audio = soup.select_one("a.wpaudio")
        audio_url = audio["href"] if audio and "href" in audio.attrs else None
 
        # Info text extraction and cleaning
        info_paragraphs = soup.select("div.entry-content p") # Modified selector to include p tags
 
        if info_paragraphs:
            full_text = " ".join(p.get_text(strip=True) for p in info_paragraphs if p.get_text(strip=True))
            # Remove unwanted sentences
            unwanted_sentences = [
                "Gezien in de Alentejo regio van Portugal.",
                "Gezien in de Alentejo regio van Portugal",
                "Gezien aan de westkust van de Alentejo regio van Portugal.",
                "Gezien vanuit deVogelhutopMonte Horizontein de Alentejo regio van Portugal.",
                "Gezien opMonte Horizontein de Alentejo regio van Portugal.",
                "Gezien opMonte Horizontein de Alentejo regio van Portugal",
                "Gezien bijMonte Horizontein de Alentejo regio van Portugal.",
                "Gezien vanuit de vogelkijkhut opMonte Horizontein de Alentejo regio van Portugal.",
                "Gezien nabijMonte Horizontein de Alentejo regio van Portugal.",
                "Gespot in de Alentejo regio van Portugal.",
                "Goedgekeurd door het Portuguese Rarities Ccommittee.",
                "Audouins Meeuw geluid",
                "Gezien op Monte Horizonte in de Alentejo regio van Portugal.",
                "Gezien op ons terreinMonte Horizontein de Alentejo regio van Portugal.",
                "Gezien op de kliffen bij de oceaan in de Alentejo regio van Portugal.",
                "Gezien vanuit devogelkijkhutopMonte Horizontein de Alentejo regio van Portugal.",
                "Filmpje gemaakt vanuit devogelkijkhutop Monte Horizonte:",
                "Gezien aan de westkust van de Alentejo regio van Portugal",
                "Gespot bij de Lagoa dos Patos in de Alentejo regio van Portugal.",
                "Voor onze Vogelfotografie Reis Grote Trap en veel meer in de periode van 1 maart tot 15 april en van 1 mei tot 20 mei.",
                "Zie:https://vogelsportugal.nl/vogelfotografie-reis-grote-trap-en-veel-meer-vogels-in-portugal/",
                "Vanuit de nieuwevogelkijkhutopMonte Horizontein de Alentejo regio van Portugal.",
                "Een klein filmpje van de Kleine Trap:",
                "Er staat een filmpje met geluid onder aan deze pagina.",
                "Deze zeer schuwe vogel is prima te zien vanuit onze vogelhut BSP7.",
                "Zie:https://vogelsportugal.nl/vogelkijkhut-bsp7/",
                "Gezien aan de kust van de Alentejo regio van Portugal.",
                "Gezien vanuit devogelhutopMonte Horizontein de Alentejo regio van Portugal.",
                "Gespot nabij Sines in de Alentejo regio van Portugal.",
                "Gespot nabij Sines in de Alentejo regio van Portugal",
                "Gezien in de Algarve regio van Portugal.",
                "Aanwezig opMonte Horizontein de Alentejo regio van Portugal.",
                "Gezien bij de kliffen aan de westkust in de Alentejo regio van Portugal.",
                "Deze zeer zeldzame arend voor west-europa is gezien op de steppen in de Alentejo regio van Portugal.",
                "Gezien bij deLagune van Santo Andréin de Alentejo regio van Portugal.",
                "Gespot vanaf de kliffen bij Sines in de Alentejo regio van Portugal",
                "Gespot opMonte Horizontein de Alentejo regio van Portugal.",
                "Gezien op o.a.Monte Horizontein de Alentejo regio van Portugal.",
                "Gezien bij Sines\u00a0in de Alentejo regio van Portugal."
            ]
            for sentence in unwanted_sentences:
                full_text = full_text.replace(sentence, "")
            
            info_text = full_text.strip()
        else:
            info_text = ""
        
        info_text = re.sub(rf"{re.escape(name)}\s+geluid", "", info_text, flags=re.IGNORECASE).strip()
        
        return images, audio_url, info_text
    except Exception as e:
        print(f"  Error: {e}")
        return None, None, ""

def main(target_name=None): # Accept optional target_name argument
    if target_name:
        bird_names = [target_name] # Process only the target bird
        output_file = f"text/{slugify(target_name)}.json" # Save to a specific file for the target bird
    else:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            bird_names = [line.strip() for line in f if line.strip()]
        # Process all birds if no target name is provided
        output_file = OUTPUT_FILE # Use default output file
 
    dataset = []
    for name in bird_names: # Iterate through the selected bird(s)
        images, audio, info = fetch_media(name)
        dataset.append({
            "name": name,
            "images": images,
            "audio": audio,
            "info": info
        })
        time.sleep(1)  # polite delay
 
    with open(output_file, "w", encoding="utf-8") as f: # Use the determined output file
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(dataset)} birds to {output_file}")
 
if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1]) # Pass the first command-line argument as target_name
    else:
        main() # Run without a target (processes first 10)