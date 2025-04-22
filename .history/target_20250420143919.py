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
        image_tags = soup.find_all("img")
        images = []
        for img in image_tags:
            src = img.get("src", "")
            # More flexible image filtering: check for parts of the cleaned name
            cleaned_name = name.lower().replace("´", "").replace("'", "")
            name_parts = cleaned_name.split(" ")
            
            src_lower = src.lower()
            
            if "/wp-content/uploads/" in src_lower:
                # Check if any word from the cleaned name is in the image URL
                if any(part in src_lower for part in name_parts if part):
                     images.append(src)
                     if len(images) >= 4: # Check and break immediately after appending
                         break
                # Use regex for gierzwaluw images as an additional check
                elif re.search(r'\w+gierzwaluw-\d+\.jpg', src_lower):
                    images.append(src)
                    if len(images) >= 4: # Check and break immediately after appending
                         break
                # Add other filtering logic here if needed for other patterns
                if len(images) >= 4:
                    break
     
        # Fallback image location
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
            full_text = full_text.replace("Gezien vanuit de vogelkijkhut opMonte Horizontein de Alentejo regio van Portugal.", "") # Remove another unwanted sentence
            full_text = full_text.replace("Gezien nabijMonte Horizontein de Alentejo regio van Portugal.", "") # Remove yet another unwanted sentence
            full_text = full_text.replace("Gespot in de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 1
            full_text = full_text.replace("Goedgekeurd door het Portuguese Rarities Ccommittee.", "") # Remove new unwanted sentence 2
            full_text = full_text.replace("Audouins Meeuw geluid", "") # Remove specific geluid sentence
            full_text = full_text.replace("Gezien op Monte Horizonte in de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 3
            full_text = full_text.replace("Gezien op ons terreinMonte Horizontein de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 4
            full_text = full_text.replace("Gezien op de kliffen bij de oceaan in de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 5
            full_text = full_text.replace("Gezien vanuit devogelkijkhutopMonte Horizontein de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 6
            full_text = full_text.replace("Filmpje gemaakt vanuit devogelkijkhutop Monte Horizonte:", "") # Remove new unwanted sentence 7
            full_text = full_text.replace("Gezien aan de westkust van de Alentejo regio van Portugal", "") # Remove new unwanted sentence 8 (without period)
            full_text = full_text.replace("Gespot bij de Lagoa dos Patos in de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 9
            full_text = full_text.replace("Voor onze Vogelfotografie Reis Grote Trap en veel meer in de periode van 1 maart tot 15 april en van 1 mei tot 20 mei.", "") # Remove new unwanted sentence 10
            full_text = full_text.replace("Zie:https://vogelsportugal.nl/vogelfotografie-reis-grote-trap-en-veel-meer-vogels-in-portugal/", "") # Remove new unwanted sentence 11
            full_text = full_text.replace("Vanuit de nieuwevogelkijkhutopMonte Horizontein de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 12
            full_text = full_text.replace("Een klein filmpje van de Kleine Trap:", "") # Remove new unwanted sentence 13
            full_text = full_text.replace("Er staat een filmpje met geluid onder aan deze pagina.", "") # Remove new unwanted sentence 14
            full_text = full_text.replace("Deze zeer schuwe vogel is prima te zien vanuit onze vogelhut BSP7.", "") # Remove new unwanted sentence 15
            full_text = full_text.replace("Zie:https://vogelsportugal.nl/vogelkijkhut-bsp7/", "") # Remove new unwanted sentence 16
            full_text = full_text.replace("Gezien aan de kust van de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 17
            full_text = full_text.replace("Gezien vanuit devogelhutopMonte Horizontein de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 18
            full_text = full_text.replace("Gespot nabij Sines in de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 19 (with period)
            full_text = full_text.replace("Gespot nabij Sines in de Alentejo regio van Portugal", "") # Remove new unwanted sentence 20 (without period)
            full_text = full_text.replace("Gezien in de Algarve regio van Portugal.", "") # Remove new unwanted sentence 21
            full_text = full_text.replace("Aanwezig opMonte Horizontein de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 22
            full_text = full_text.replace("Gezien bij de kliffen aan de westkust in de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 23
            full_text = full_text.replace("Deze zeer zeldzame arend voor west-europa is gezien op de steppen in de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 24
            full_text = full_text.replace("Gezien bij deLagune van Santo Andréin de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 25
            full_text = full_text.replace("Gespot vanaf de kliffen bij Sines in de Alentejo regio van Portugal", "") # Remove new unwanted sentence 26
            full_text = full_text.replace("Gespot opMonte Horizontein de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 27
            full_text = full_text.replace("Gezien op o.a.Monte Horizontein de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 28
            full_text = full_text.replace("Gezien bij Sines in de Alentejo regio van Portugal.", "") # Remove new unwanted sentence 29
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