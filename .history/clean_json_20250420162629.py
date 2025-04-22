import json

def clean_bird_info(info):
    """Removes specific unwanted sentences from the info string."""
    unwanted_sentences = [
        'Vogels kijken in de Alentejo regio van Portugal, excursies met Nederlandse gids.',
        'Vogels kijken in de Alentejo regio van Portugal Vogelexcursies met Nederlandse gids.',
        'Vogelreizen en excursies met Nederlandse gids in de Alentejo regio van Portugal.',
        'Vogelreis en Vogelexcursies met Nederlandse Gids.',
        'Vogels kijken in de Alentejo regio van Portugal.',
        'Vogels kijken in de Alentejo regio van Portugal, Vogelreis en vogelexcursies met individuele vogelgids.',
        'Vogels in de Alentejo regio van Portugal Vogelreis en Excursies met Nederlandse Gids',
        'Vogels kijken in de Alentejo regio van Portugal, Vogelreis en vogel excursies met Nederlandse gids.',
        'Vogels kijken in de Alentejo regio van Portugal met Nederlandse gids.',
        'Vogels spotten in de Alentejo regio van Portugal, vogelexcursies met Nederlandse gids.',
        'Vogels kijken in de Alentejo regio van Portugal Vogelreis en Excursies met Nederlandse Gids.',
        'Vogels kijken in de Alentejo regio van Portugal,',
        'Vogelvakantie en Vogelreis,',
        'Vogelexcursies met Nederlandse gids',
        'Vogelreis en excursies met Nederlandse gids',
        'Vogels spotten in de Alentejo regio van Portugal.',
        'Vogels kijken in de Alentejo regio van Portugal',
        'Vogelreis en Vogelexcursies met Nederlandse Gids',
        'Vogels spotten in de Alentejo regio van Portugal, excursies met Nederlandse gids.',
        'Vogelreis en Vogelexcursies met Nederlandse vogelgids.',
        'Vogelreis en Excursies met Nederlandse gids.'
    ]
    cleaned_info = info
    print(f"Original info: {cleaned_info[:100]}...") # Log first 100 chars
    for sentence in unwanted_sentences:
        if sentence in cleaned_info:
            print(f"  Removing sentence: {sentence}")
            cleaned_info = cleaned_info.replace(sentence, '')
    cleaned_info = cleaned_info.strip()
    print(f"Cleaned info: {cleaned_info[:100]}...") # Log first 100 chars of cleaned info
    return cleaned_info

def main():
    """Reads scrapeportugal.json, cleans the info field, and saves the updated JSON."""
    file_path = 'text/scrapeportugal.json'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for bird in data:
            print(f"Processing info for bird: {bird.get('name', 'Unknown')}") # Log bird name
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