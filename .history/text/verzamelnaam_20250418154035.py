import requests

# BIRD_FILES = [
#     "/Users/kalter/VS/codex/codex-cli/ornithica/text/birdsben.txt",
#     "/Users/kalter/VS/codex/codex-cli/ornithica/text/birdseuropa.txt"
# ]
BIRD_FILES = [
    "/Users/kalter/VS/codex/codex-cli/ornithica/text/test.txt"
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
        base_url = WIKI_BASE_URL + name.replace(" ", "_")
        vogel_url = WIKI_BASE_URL + name.replace(" ", "_") + "_(vogel)"

        try:
            base_response = requests.get(base_url, headers=HEADERS, timeout=10)
            if base_response.status_code == 200 and is_disambiguation_page(base_response.text):
                vogel_response = requests.get(vogel_url, headers=HEADERS, timeout=10)
                if vogel_response.status_code == 200:
                    problematic.append((name, base_url, vogel_url))
        except Exception as e:
            print(f"Error checking {name}: {e}")

    return problematic


def main():
    bird_names = get_bird_names_from_files(BIRD_FILES)
    disambig_birds = check_wikipedia_pages(bird_names)

    if disambig_birds:
        print("Birds leading to disambiguation pages but have specific '(vogel)' articles:")
        for name, base_url, vogel_url in disambig_birds:
            print(f"- {name} → {base_url} → Suggested: {vogel_url}")
    else:
        print("All bird names point directly to specific Wikipedia articles.")


if __name__ == "__main__":
    main()