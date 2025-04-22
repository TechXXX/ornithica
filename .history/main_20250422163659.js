// --- Custom Quiz Logic ---
const customQuizBtn = document.getElementById('custom-quiz-btn');
const customQuizSection = document.getElementById('custom-quiz-section');
const customFileSelect = document.getElementById('custom-file-select');
const customBirdListDiv = document.getElementById('custom-bird-list');
const startCustomQuizBtn = document.getElementById('start-custom-quiz');
const saveCustomQuizBtn = document.getElementById('save-custom-quiz');
const customQuizNameInput = document.getElementById('custom-quiz-name');
const loadSavedQuizBtn = document.getElementById('load-saved-quiz-btn');
const loadQuizSection = document.getElementById('load-quiz-section');
const savedQuizListDiv = document.getElementById('saved-quiz-list');
const closeLoadSectionBtn = document.getElementById('close-load-section');

let customBirds = [];
let customSelectedBirds = [];
const SAVED_QUIZZES_KEY = 'ornithica_saved_quizzes';

// --- Info Modal Logic ---
let infoModal;
let closeModalSpan;
let modalTitle;
let modalContent;

function showBirdInfoModal(birdName) {
  console.log(portugalMedia); // Log the entire portugalMedia object
  const birdData = portugalMedia[birdName];
  console.log('Bird name:', birdName, 'Data:', birdData); // Log the bird name and retrieved data

  if (birdData && birdData.info) {
    modalTitle.textContent = birdName;
    // Split text into sentences and add two line breaks after every 5th sentence
    const sentences = birdData.info.match(/[^.!?]+[.!?]+/g) || [];
    let formattedText = '';
    for (let i = 0; i < sentences.length; i++) {
      formattedText += sentences[i].trim();
      if ((i + 1) % 5 === 0) {
        formattedText += '\n\n'; // Add two newline characters
      } else {
        formattedText += ' '; // Add a space between sentences
      }
    }
    modalContent.textContent = formattedText.trim(); // Trim trailing space/newlines
    infoModal.style.display = 'block';
  } else {
    modalTitle.textContent = 'Information Not Available';
    modalContent.textContent = 'No information found for this bird.';
    infoModal.style.display = 'block';
  }
}

function closeBirdInfoModal() {
  infoModal.style.display = 'none';
}

// Close the modal when the user clicks on <span> (x)

// --- Event Listeners ---

// customQuizBtn.onclick handler moved to bottom of script

customFileSelect.onchange = loadCustomBirdList;

async function loadCustomBirdList() {
  customBirdListDiv.innerHTML = 'Loading...';
  const file = customFileSelect.value;
  try {
    const response = await fetch(file);
    const text = await response.text();
    customBirds = text.split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
    renderCustomBirdList();
