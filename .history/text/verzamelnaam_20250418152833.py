

import requests

BIRD_FILES = [
    "/Users/kalter/VS/codex/codex-cli/ornithica/text/birdsben.txt",
    "/Users/kalter/VS/codex/codex-cli/ornithica/text/birdseuropa.txt"
]

WIKI_BASE_URL = "https://nl.wikipedia.org/wiki/"

HEADERS = {
    "User-Agent": "ornithica-bird-checker/1.0 (https://github.com/yourproject)"
}


def is_disambiguation_page(html):
    return 'class="redirectMsg"' in html or 'class="disambig"' in html or 'doorverwijspagina' in html.lower()


def get_bird_names_from_files(file_paths):
    names = set()
    for file_path in file_paths:
        with open(file_path, "r", encoding="utf-8") as file:
            for line in file:
                name = line.strip()
                if name:
                    names.add(name)
    return sorted(names)


def check_wikipedia_pages(bird_names):
    problematic = []

    for name in bird_names:
        url = WIKI_BASE_URL + name.replace(" ", "_")
        try:
            response = requests.get(url, headers=HEADERS, timeout=10)
            if response.status_code == 200 and is_disambiguation_page(response.text):
                problematic.append((name, url))
        except Exception as e:
            print(f"Error fetching {url}: {e}")

    return problematic


def main():
    bird_names = get_bird_names_from_files(BIRD_FILES)
    disambig_birds = check_wikipedia_pages(bird_names)

    if disambig_birds:
        print("Birds leading to disambiguation pages:")
        for name, url in disambig_birds:
            print(f"- {name} → {url}")
    else:
        print("All bird names point directly to specific Wikipedia articles.")


if __name__ == "__main__":
    main()