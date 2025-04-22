let portugalMedia = {};

const API = 'https://nl.wikipedia.org/w/api.php';

async function resolveRedirect(title) {
  const url = API + '?' + new URLSearchParams({
    action: 'query',
    format: 'json',
    redirects: '1',
    origin: '*',
    titles: title
  });
  try {
    const res = await fetch(url);
    const data = await res.json();
    const redirect = data.query.redirects?.[0];
    return redirect ? redirect.to : title;
  } catch {
    return title;
  }
}

async function fetchMedia(title) {
  // This function is primarily for fetching media from Wikipedia,
  // but it's included here as it's related to media handling.
  // The Portugal-specific media loading is handled by loadPortugalMedia.
  // This function might still be used for other regions if needed.
  if (mediaCache[title]) return mediaCache[title]; // Assuming mediaCache is accessible or passed

  const resolvedTitle = await resolveRedirect(title);
  const api = 'https://nl.wikipedia.org/w/api.php';
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    prop: 'images',
    titles: resolvedTitle
  });
  const res = await fetch(api + '?' + params.toString());
  const data = await res.json();
  const pages = Object.values(data.query.pages);
  const images = pages[0]?.images || [];

  const audio = [];
  const video = [];
  const urls = [];

  for (const file of images) {
    const filename = file.title;
    const infoParams = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      titles: filename,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata'
    });
    const infoRes = await fetch(api + '?' + infoParams.toString());
    const infoData = await infoRes.json();
    const filePage = Object.values(infoData.query.pages)[0];
    const url = filePage.imageinfo?.[0]?.url;
    if (!url) continue;

    if (/\.(jpe?g|png|gif)$/i.test(url)) {
      const rawCaption = filePage.imageinfo?.[0]?.extmetadata?.ImageDescription?.value || '';
      const caption = rawCaption.replace(/<[^>]*>/g, '').toLowerCase();
      const isCaptionedMap = /(range|distribution|kaart|verspreiding|habitat|area|status|locatie|map)/i.test(caption);
      if (
        !/(kaart|map\b|verspreiding|distribution|range|locatie|verspreidingsgebied|range_map|habitat|locatiekaart|areal|area|status|species_map|statuskaart|IUCN|Vista-kmixdocked|icon|logo|sound_icon)/i.test(filename) &&
        !isCaptionedMap
      ) {
        urls.push(url);
      }
    } else if (/\.ogg$/i.test(url)) {
      audio.push(url);
    } else if (/\.webm$/i.test(url)) {
      video.push(url);
    }
  }

  const result = { images: urls.slice(0, 4), audio, video };
  // mediaCache[title] = result; // Assuming mediaCache is accessible or passed
  return result;
}

async function loadPortugalMedia() {
  try {
    const res = await fetch('text/scrapeportugal.json');
    const json = await res.json();
    portugalMedia = {}; // Clear previous data
    for (const bird of json) {
      portugalMedia[bird.name] = bird;
    }
    console.log('Portugal media loaded successfully.');
  } catch (err) {
    console.error('Failed to load Portugal media:', err);
  }
}

function showBirdInfoModal(birdName) {
  console.log(portugalMedia); // Log the entire portugalMedia object
  const birdData = portugalMedia[birdName];
  console.log('Bird name:', birdName, 'Data:', birdData); // Log the bird name and retrieved data

  let infoModal = document.getElementById('info-modal');
  let modalTitle = document.getElementById('modal-title');
  let modalContent = document.getElementById('modal-content');


  if (birdData && birdData.info) {
    modalTitle.textContent = birdName;
    const sentences = birdData.info.match(/[^.!?]+[.!?]+/g) || [];
    let formattedText = '';
    for (let i = 0; i < sentences.length; i++) {
      formattedText += sentences[i].trim();
      if ((i + 1) % 5 === 0) {
        formattedText += '\n\n';
      } else {
        formattedText += ' ';
      }
    }
    modalContent.textContent = formattedText.trim();
    infoModal.style.display = 'block';
  } else {
    modalTitle.textContent = 'Information Not Available';
    modalContent.textContent = 'No information found for this bird.';
    infoModal.style.display = 'block';
  }
}

function closeBirdInfoModal() {
  let infoModal = document.getElementById('info-modal');
  infoModal.style.display = 'none';
}

// Make functions available globally if needed by other scripts
window.resolveRedirect = resolveRedirect;
window.fetchMedia = fetchMedia;
window.loadPortugalMedia = loadPortugalMedia;
window.showBirdInfoModal = showBirdInfoModal;
window.closeBirdInfoModal = closeBirdInfoModal;
window.portugalMedia = portugalMedia; // Expose portugalMedia globally