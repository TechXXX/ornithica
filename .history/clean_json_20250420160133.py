import json

def clean_bird_info(info):
    """Removes a specific unwanted sentence from the info string."""
    unwanted_sentence = 'Vogels kijken in de Alentejo regio van Portugal, excursies met Nederlandse gids.'
    # Use replace to remove all occurrences of the unwanted sentence
    cleaned_info = info.replace(unwanted_sentence, '').strip()
    return cleaned_info

def main():
    """Reads scrapeportugal.json, cleans the info field, and saves the updated JSON."""
    file_path = 'text/scrapeportugal.json'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for bird in data:
            if 'info' in bird and isinstance(bird['info'], str):
                bird['info'] = clean_bird_info(bird['info'])

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Successfully cleaned '{file_path}'")

    except FileNotFoundError:
        print(f"Error: File not found at '{file_path}'")
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{file_path}'")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()