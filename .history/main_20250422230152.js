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

// --- Info Modal Logic Variables (Functions are in portugalMedia.js) ---
let infoModal;
let closeModalSpan;
let modalTitle;
let modalContent;

// --- Event Listeners ---

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
  } catch {
    customBirdListDiv.innerHTML = 'Failed to load birds.';
  }
}

function renderCustomBirdList() {
  customBirdListDiv.innerHTML = '';
  customSelectedBirds = [];
  customBirds.forEach((bird, idx) => {
    const id = `custom-bird-${idx}`;
    const label = document.createElement('label');
    label.style.cssText = `
      display: block;
      cursor: pointer;
      font-size: 0.9em;
      padding: 4px;
      background: #333;
      border-radius: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.value = bird;
    checkbox.style.marginRight = '8px';
    checkbox.onchange = () => {
      if (checkbox.checked) {
        customSelectedBirds.push(bird);
      } else {
        customSelectedBirds = customSelectedBirds.filter(b => b !== bird);
      }
    };
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(bird));
    customBirdListDiv.appendChild(label);
  });
}

startCustomQuizBtn.onclick = async () => {
  if (customSelectedBirds.length === 0) {
    alert('Select at least one bird to start the quiz.');
    return;
  }
  // Hide custom quiz UI, show quiz
  customQuizSection.style.display = 'none';
  document.getElementById('quiz').style.display = 'block';
  // document.getElementById('quiz-heading').style.maxWidth = '10%'; // Remove shrinking from here
  // Set up quiz state
  quizState.speciesList = [...customSelectedBirds];
  quizState.allSpecies = [...customBirds]; // Keep the full list for generating wrong answers
  quizState.currentIndex = 0;
  quizState.score = 0;
  // Load family suffixes for similar answers
  const suffixResponse = await fetch('text/birdfamilies.txt');
  const suffixText = await suffixResponse.text();
  familySuffixes = suffixText.split('\n').map(l => l.trim()).filter(Boolean);
  loadQuestion();
};

saveCustomQuizBtn.onclick = () => {
  const quizName = customQuizNameInput.value.trim();
  if (!quizName) {
    alert('Please enter a name for the quiz.');
    return;
  }
  if (customSelectedBirds.length === 0) {
    alert('Please select at least one bird to save.');
    return;
  }

  const savedQuizzes = JSON.parse(localStorage.getItem(SAVED_QUIZZES_KEY) || '[]');
  // Check if name already exists, overwrite if it does
  const existingIndex = savedQuizzes.findIndex(q => q.name === quizName);
  const newQuizData = {
    name: quizName,
    sourceFile: customFileSelect.value,
    birds: [...customSelectedBirds] // Save a copy
  };

  if (existingIndex > -1) {
    savedQuizzes[existingIndex] = newQuizData;
  } else {
    savedQuizzes.push(newQuizData);
  }

  localStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(savedQuizzes));
  alert(`Quiz "${quizName}" saved!`);
  customQuizNameInput.value = ''; // Clear input
};

loadSavedQuizBtn.onclick = () => {
  document.getElementById('nav-sound').play(); // Play sound on click
  // Hide other setup UI
  document.querySelectorAll('.region-button, .quiz-length-button, .difficulty-button').forEach(btn => btn.style.display = 'none');
  document.getElementById('trophy-container').style.display = 'none';
  document.getElementById('length-buttons').style.display = 'none';
  customQuizSection.style.display = 'none';
  // Show load section
  renderSavedQuizList();
  loadQuizSection.style.display = 'flex';
};

closeLoadSectionBtn.onclick = () => {
  loadQuizSection.style.display = 'none';
  document.body.classList.remove('custom-quiz-active'); // Remove class to restore header size
  // Show initial buttons again
  document.querySelectorAll('.region-button').forEach(btn => btn.style.display = 'inline-block');
  document.getElementById('trophy-container').style.display = 'flex'; // Assuming it was flex
};

// --- Load/Render Saved Quizzes ---
function renderSavedQuizList() {
  savedQuizListDiv.innerHTML = '';
  const savedQuizzes = JSON.parse(localStorage.getItem(SAVED_QUIZZES_KEY) || '[]');

  if (savedQuizzes.length === 0) {
    savedQuizListDiv.innerHTML = '<p style="color: #aaa; text-align: center;">No saved quizzes yet.</p>';
    return;
  }

  savedQuizzes.forEach((quiz, index) => {
    const quizDiv = document.createElement('div');
    quizDiv.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #333;
      border-radius: 6px;
      margin-bottom: 8px;
    `;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${quiz.name} (${quiz.birds.length} birds)`;
    nameSpan.style.flexGrow = '1';
    nameSpan.style.marginRight = '10px';

    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load';
    loadBtn.style.cssText = 'padding: 5px 10px; background: #4aa3df; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;';
    loadBtn.onclick = () => loadSpecificQuiz(quiz);

    const runBtn = document.createElement('button');
    runBtn.textContent = 'Run';
    runBtn.style.cssText = 'padding: 5px 10px; background: #28a745; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;';
    runBtn.onclick = () => runSavedQuiz(quiz);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.cssText = 'padding: 5px 10px; background: #dc3545; color: #fff; border: none; border-radius: 4px; cursor: pointer;';
    deleteBtn.onclick = () => deleteSavedQuiz(index);

    quizDiv.appendChild(nameSpan);
    quizDiv.appendChild(loadBtn);
    quizDiv.appendChild(runBtn);
    quizDiv.appendChild(deleteBtn);
    savedQuizListDiv.appendChild(quizDiv);
  });
}

async function loadSpecificQuiz(quizData) {
    loadQuizSection.style.display = 'none'; // Hide load section
    document.body.classList.add('custom-quiz-active'); // Shrink header
    customQuizSection.style.display = 'flex'; // Show custom setup

    // Set the dropdown to the correct source file
    customFileSelect.value = quizData.sourceFile;

    // Load the bird list from the source file
    await loadCustomBirdList(); // This calls renderCustomBirdList internally

    // Now that the list is rendered, check the boxes for the saved birds
    const checkboxes = customBirdListDiv.querySelectorAll('input[type="checkbox"]');
    customSelectedBirds = []; // Reset selection
    checkboxes.forEach(checkbox => {
        if (quizData.birds.includes(checkbox.value)) {
            checkbox.checked = true;
            customSelectedBirds.push(checkbox.value); // Add to current selection
        } else {
            checkbox.checked = false;
        }
    });
    // Optionally set the quiz name input
    customQuizNameInput.value = quizData.name;
}

async function runSavedQuiz(quizData) {
    loadQuizSection.style.display = 'none'; // Hide load section
    document.body.classList.add('custom-quiz-active'); // Shrink header
    document.getElementById('quiz').style.display = 'block'; // Show quiz UI

    // Load all birds from the source file for wrong answers
    const response = await fetch(quizData.sourceFile);
    const text = await response.text();
    const allBirds = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Set up quiz state
    quizState.speciesList = [...quizData.birds];
    quizState.allSpecies = allBirds; // Full list for generating wrong answers
    quizState.currentIndex = 0;
    quizState.score = 0;

    // Load family suffixes for similar answers
    const suffixResponse = await fetch('text/birdfamilies.txt');
    const suffixText = await suffixResponse.text();
    familySuffixes = suffixText.split('\n').map(l => l.trim()).filter(Boolean);

    // Start the quiz
    loadQuestion();
}

function deleteSavedQuiz(indexToDelete) {
  let savedQuizzes = JSON.parse(localStorage.getItem(SAVED_QUIZZES_KEY) || '[]');
  savedQuizzes.splice(indexToDelete, 1); // Remove quiz at index
  localStorage.setItem(SAVED_QUIZZES_KEY, JSON.stringify(savedQuizzes));
  renderSavedQuizList(); // Re-render the list
}

let familySuffixes = [];
let quizRegion = 'europa';
let quizLength = 20;
let quizDifficulty = 2;
let regionSelected = false;
let lengthSelected = false;
let difficultySelected = false;

const choicesDiv = document.getElementById('choices');
const nextButton = document.getElementById('next');

const quizState = {
  speciesList: null,
  currentIndex: 0,
  score: 0
};

let mediaCache = {}; // Declared mediaCache here and made global

function tryStartQuiz() {
  if (regionSelected && lengthSelected && difficultySelected) {
    document.querySelectorAll('.region-button, .quiz-length-button, .difficulty-button').forEach(btn => btn.style.display = 'none');
    document.getElementById('trophy-container').style.display = 'none';
    document.body.classList.remove('autoriteit-mode');
    document.getElementById('quiz').style.display = 'block';
    document.getElementById('quiz-heading').style.maxWidth = '10%';
    document.getElementById('sound-toggle-button').style.display = 'block'; // Show sound toggle button

    // Set muted state of audio elements based on isSoundEnabled
    document.querySelectorAll('audio').forEach(audio => audio.muted = !isSoundEnabled);

    // const cheatButton = document.getElementById('cheat-button');
    // if (cheatButton) cheatButton.style.display = 'block';
    loadQuestion();
  }
}

document.querySelectorAll('.quiz-length-button').forEach(button => {
  button.onclick = () => {
    document.getElementById('nav-sound').play(); // Play sound on click
    document.querySelectorAll('.quiz-length-button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    quizLength = parseInt(button.dataset.length, 10);
    lengthSelected = true;

    const container = document.getElementById('length-buttons');
    container.style.animation = 'fadeScaleDown 0.4s ease forwards';
    setTimeout(() => {
      container.style.display = 'none';
      tryStartQuiz();
    }, 400);
  };
});

document.querySelectorAll('.difficulty-button').forEach(button => {
  button.onclick = () => {
    document.getElementById('click-sound').play();
    document.querySelectorAll('.difficulty-button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    quizDifficulty = parseInt(button.dataset.difficulty, 10);
    difficultySelected = true;

    // Toggle autoriteit-mode class on body
    document.body.classList.toggle('autoriteit-mode', quizDifficulty === 5);

    // Handle Autoriteit difficulty (manual input)
    if (quizDifficulty === 5) {
      const choicesColumn = document.querySelector('.choices-column');
      if (choicesColumn) {
        // Hide multiple choice options
        choicesDiv.style.display = 'none';
        // nextButton.style.display = 'none'; // Keep next button in DOM but hidden initially

        // Remove next button from its current position
        if (nextButton.parentNode === choicesColumn) {
          choicesColumn.removeChild(nextButton);
        }

        // Add text input and submit button if they don't exist
        if (!document.getElementById('manual-answer-input')) {
          const input = document.createElement('input');
          input.type = 'text';
          input.id = 'manual-answer-input';
          input.placeholder = 'Voer vogelnaam in';
          input.style.cssText = `
            padding: 10px;
            font-size: 1.2em;
            border-radius: 6px;
            border: 1px solid #555;
            background: #333;
            color: #fff; /* Set input text color to white */
            margin-bottom: 10px; /* Adjusted margin */
            width: calc(100% - 22px); /* Adjust for padding and border */
          `;
          // Add style for placeholder text
          input.style.setProperty('--webkit-input-placeholder-color', '#aaa');
          input.style.setProperty('--moz-placeholder-color', '#aaa');
          input.style.setProperty('--ms-input-placeholder-color', '#aaa');
          input.style.setProperty('placeholder-color', '#aaa');
          choicesColumn.appendChild(input);

          const submitButton = document.createElement('button');
          submitButton.id = 'submit-manual-answer';
          submitButton.textContent = 'Antwoord indienen';
          submitButton.style.cssText = `
             padding: 12px 28px;
             font-size: 1.1em;
             background: #4aa3df;
             color: #fff;
             border: none;
             border-radius: 8px;
             cursor: pointer;
             margin-bottom: 10px; /* Adjusted margin */
           `;
          choicesColumn.appendChild(submitButton);

          // Add event listener for the submit button (will be implemented later)
          submitButton.onclick = handleManualSubmit;

          // Add event listener for Enter key on the input field
          input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
              event.preventDefault(); // Prevent default form submission if input is in a form
              handleManualSubmit(); // Submit answer
              event.stopPropagation(); // Stop event propagation
            }
          });
        } else {
          // If elements exist, just make sure they are visible
          document.getElementById('manual-answer-input').style.display = 'block';
          document.getElementById('submit-manual-answer').style.display = 'block';
         }

         // Append next button after manual input elements
         choicesColumn.appendChild(nextButton);
       }
     } else {
       // For other difficulties, ensure manual input is hidden and choices are shown
       if (document.getElementById('manual-answer-input')) {
         document.getElementById('manual-answer-input').style.display = 'none';
         document.getElementById('submit-manual-answer').style.display = 'none';
       }
       choicesDiv.style.display = 'flex'; // Assuming choices are flex
    }

    tryStartQuiz();
  };
});

// Placeholder function for manual answer submission
function handleManualSubmit() {
  const input = document.getElementById('manual-answer-input');
  const userAnswer = input.value.trim().toLowerCase();
  const correctName = quizState.speciesList[quizState.currentIndex - 1].toLowerCase(); // Get correct name from the previous index

  const submitButton = document.getElementById('submit-manual-answer');

  // Disable input and submit button after submission
  input.disabled = true;
  submitButton.disabled = true;
  submitButton.style.display = 'none'; // Hide submit button after submission

  if (userAnswer === correctName) {
    input.style.borderColor = '#28a745'; // Green border for correct
    input.style.borderWidth = '3px'; // Make border thicker
    input.style.color = '#28a745';
    const correctSound = document.getElementById('correct-sound');
    correctSound.volume = 0.25; // Set volume to 25%
    correctSound.play();
    // Add pulse animation for correct answer
    input.classList.add('pulse-green');
    setTimeout(() => {
      input.classList.remove('pulse-green');
    }, 1000); // Animation duration is 1s
  } else {
    input.style.borderColor = '#dc3545'; // Red border for incorrect
    input.style.borderWidth = '3px'; // Make border thicker for incorrect as well
    input.style.color = '#dc3545';
    // Display the correct answer
    const correctAnswerDisplay = document.createElement('p');
    correctAnswerDisplay.textContent = `Juiste antwoord: ${quizState.speciesList[quizState.currentIndex - 1]}`; // Changed text to Juiste antwoord
    correctAnswerDisplay.style.color = '#28a745';
    correctAnswerDisplay.style.marginTop = '15px'; // Increased top margin
    correctAnswerDisplay.style.marginBottom = '15px'; // Added bottom margin
    document.querySelector('.choices-column').insertBefore(correctAnswerDisplay, nextButton);
  }

  // Show the next button
  nextButton.style.marginTop = ''; // Remove inline margin-top
  nextButton.style.display = 'inline-block';

  // Add keydown listener to the next button
  nextButton.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      loadQuestion();
    }
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function loadQuestion() {
  document.getElementById('nav-sound').play(); // Play sound when loading next question
  document.getElementById('quiz-heading').style.setProperty('max-width', '10%', 'important'); // Shrink header when question loads
  nextButton.style.display = 'none';
  choicesDiv.innerHTML = '';
  // Remove existing info button if any
  const existingInfoButton = document.querySelector('.info-button');
  if (existingInfoButton) {
    existingInfoButton.remove();
  }
  document.getElementById('left-images').innerHTML = '';
  document.getElementById('right-images').innerHTML = '';

  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  // Reset manual input for Autoriteit difficulty
  if (quizDifficulty === 5) {
    const manualInput = document.getElementById('manual-answer-input');
    const submitButton = document.getElementById('submit-manual-answer');
    const correctAnswerDisplay = document.querySelector('.choices-column p'); // Assuming the correct answer is in a paragraph

    if (manualInput) {
      manualInput.value = ''; // Clear input value
      manualInput.disabled = false; // Re-enable input
      manualInput.style.borderColor = ''; // Reset border color
      manualInput.style.color = ''; // Reset text color
    }
    if (submitButton) {
      submitButton.disabled = false; // Re-enable submit button
      submitButton.style.display = 'inline-block'; // Make submit button visible
    }
    if (correctAnswerDisplay) {
      correctAnswerDisplay.remove(); // Remove previous correct answer display
    }
    // Set focus to the input field
    manualInput.focus();
  }

  let fullList;
  if (quizRegion === 'europa') {
    fullList = 'text/birdseuropa.txt';
  } else if (quizRegion === 'benelux') {
    fullList = 'text/birdsben.txt';
  } else if (quizRegion === 'portugal') {
    fullList = 'text/portugalbirds.txt';
  } else {
    fullList = 'text/testbird.txt';
  }
  if (!quizState.speciesList) {
    progressContainer.style.display = 'block';
    progressFill.style.width = '0';
    progressText.textContent = 'Laden...';

    const response = await fetch(fullList);
    const suffixResponse = await fetch('text/birdfamilies.txt');
    const suffixText = await suffixResponse.text();
    familySuffixes = suffixText.split('\n').map(l => l.trim()).filter(Boolean);
    const text = await response.text();
    const allSpecies = text.split('\n').map(l => l.trim()).filter(Boolean);
    quizState.allSpecies = allSpecies;
    shuffle(allSpecies);
    quizState.speciesList = [];

    // Load just the first species synchronously
    let firstSpecies;
    for (let i = 0; i < allSpecies.length; i++) {
      const name = allSpecies[i];
      // Use the globally available fetchMedia
      const media = await fetchMedia(name);
      if (media.images.length > 0 || media.audio.length > 0 || media.video.length > 0) {
        firstSpecies = name;
        quizState.speciesList.push(name);
        break;
      }
    }

    progressContainer.style.display = 'none';

    // Start background loading of the rest
    (async () => {
      for (let i = 0; i < allSpecies.length && quizState.speciesList.length < quizLength; i++) {
        const name = allSpecies[i];
        if (quizState.speciesList.includes(name)) continue;
        // Use the globally available fetchMedia
        const media = await fetchMedia(name);
        if (media.images.length > 0 || media.audio.length > 0 || media.video.length > 0) {
          quizState.speciesList.push(name);
        }
      }
    })();
  }

  if (quizState.currentIndex >= quizState.speciesList.length) {
    setTimeout(() => {
      document.body.classList.remove('custom-quiz-active'); // Remove class to restore header size
      updateHighscores();
      showHighscores();
      document.getElementById('quiz').innerHTML = `
        <h2>Je score: ${quizState.score} van ${quizState.currentIndex}</h2>
      <button onclick="location.reload()" style="margin-top:30px;padding:16px 32px;background:#4aa3df;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:1.2em;font-weight:bold;box-shadow:0 4px 10px rgba(0,0,0,0.4);transition: background 0.3s;">🎉 Opnieuw spelen 🎉</button>
      `;
    }, 100);
    return;
  }

  const correctName = quizState.speciesList[quizState.currentIndex];
  const media = quizRegion === 'portugal'
    ? {
        images: (() => {
          // Use the globally available portugalMedia
          const imgs = (portugalMedia[correctName]?.images || []).slice(0, 4);
          if (imgs.length === 0) {
            const fallbackUrl = `https://vogelsportugal.nl/Foto/${correctName.replace(/\s/g, '%20')}.jpg`;
            return [fallbackUrl];
          }
          return imgs;
        })(),
        audio: portugalMedia[correctName]?.audio ? [portugalMedia[correctName].audio] : [],
        video: []
      }
    // Use the globally available fetchMedia for other regions
    : await fetchMedia(correctName);
  console.log('Media for', correctName, media);
  const current = { name: correctName, images: media.images };
  quizState.currentIndex++;

  const left = document.getElementById('left-images');
  const right = document.getElementById('right-images');
  media.images.forEach((url, index) => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = current.name;
    const container = index % 2 === 0 ? left : right;
    container.appendChild(img);
  });

  const audioContainer = document.getElementById('audio-container');
  const videoContainer = document.getElementById('video-container');
  const audio = document.getElementById('bird-audio');
  const video = document.getElementById('bird-video');

  audio.pause();
  audio.currentTime = 0;
  const supportedAudio = media.audio.find(url =>
    url.endsWith('.mp3') || url.endsWith('.aac') || url.endsWith('.ogg')
  );
  if (supportedAudio) {
    audio.src = supportedAudio;
    audio.load();
    audioContainer.style.display = 'block';
  } else {
    audio.src = '';
    audioContainer.style.display = 'none';
  }

  if (media.video.length && media.video[0]) {
    video.crossOrigin = "anonymous";
    // Remove any existing <source> elements
    while (video.firstChild) video.removeChild(video.firstChild);
    // Add new <source>
    const source = document.createElement('source');
    source.src = media.video[0];
    source.type = 'video/webm';
    video.appendChild(source);
    // Also set src directly as a fallback
    video.src = media.video[0];
    video.load();
    videoContainer.style.display = 'block';
  } else {
    while (video.firstChild) video.removeChild(video.firstChild);
    video.src = '';
    videoContainer.style.display = 'none';
  }

  const options = [current.name];
  const allAnswers = quizState.allSpecies.filter(n => n !== current.name);

  // Find similar bird using suffix-based matching
  const suffixes = familySuffixes;

  const lowerCurrent = current.name.toLowerCase();
  const matchSuffix = suffixes.find(suffix => lowerCurrent.includes(suffix));

  let similarAnswers = [];
  if (matchSuffix) {
    similarAnswers = allAnswers.filter(name =>
      name.toLowerCase().includes(matchSuffix)
    );
  }

  // Remove any duplicates or already used correct answer
  similarAnswers = similarAnswers.filter(name => name !== current.name);
  shuffle(similarAnswers);

  shuffle(allAnswers); // Random fallback pool

  if (quizDifficulty === 1) {
    // Easy – all random
    while (options.length < 4 && allAnswers.length > 0) {
      options.push(allAnswers.shift());
    }
  } else if (quizDifficulty === 2) {
    // Normal – one similar bird if available
    if (similarAnswers.length > 0) {
      options.push(similarAnswers.shift());
    }
    while (options.length < 4 && allAnswers.length > 0) {
      options.push(allAnswers.shift());
    }
  } else if (quizDifficulty === 3) {
    // Hard – two similar birds if available
    while (similarAnswers.length > 0 && options.length < 3) {
      options.push(similarAnswers.shift());
    }
    while (options.length < 4 && allAnswers.length > 0) {
      options.push(allAnswers.shift());
    }
  } else if (quizDifficulty === 4) {
    // Expert – fill all remaining options with similar birds
    while (similarAnswers.length > 0 && options.length < 4) {
      options.push(similarAnswers.shift());
    }
    while (options.length < 4 && allAnswers.length > 0) {
      options.push(allAnswers.shift());
    }
  }

  shuffle(options);

  options.forEach(option => {
    const btn = document.createElement('div');
    btn.className = 'choice';
    btn.textContent = option;
    btn.onclick = () => {
      const allChoices = document.querySelectorAll('.choice');
      allChoices.forEach(c => c.onclick = null);
      if (option === current.name) {
        btn.classList.add('correct');
        const correctSound = document.getElementById('correct-sound');
        correctSound.volume = 0.25; // Set volume to 25%
        correctSound.play();
        quizState.score++;
      } else {
        btn.classList.add('incorrect');
        document.getElementById('click-sound').play(); // Play sound for incorrect answer
        const correctBtn = Array.from(allChoices).find(c => c.textContent === current.name);
        if (correctBtn) correctBtn.classList.add('correct');
      }

      // Show info button for Portugal region
      if (quizRegion === 'portugal') {
        const choicesColumn = document.querySelector('.choices-column');
        if (choicesColumn) {
          const infoButton = document.createElement('button');
          infoButton.classList.add('info-button'); // Add a class for styling
          const infoIcon = document.createElement('img');
          infoIcon.src = 'images/info.svg';
          infoIcon.alt = 'Info';
          infoButton.appendChild(infoIcon);
          // Use the globally available showBirdInfoModal
          infoButton.onclick = () => showBirdInfoModal(current.name);
          choicesColumn.insertBefore(infoButton, choicesColumn.firstChild); // Insert at the beginning
        }
      }

      nextButton.style.display = 'inline-block';
    };
    choicesDiv.appendChild(btn);
  });
}

nextButton.onclick = loadQuestion;
// Assign handlers to standard region buttons
// Handle standard region buttons (Europa, Benelux)
document.querySelectorAll('.region-button').forEach(button => {
  if (button.id === 'custom-quiz-btn' || button.id === 'load-saved-quiz-btn') return; // Skip custom and load buttons
  button.onclick = () => {
    document.getElementById('nav-sound').play(); // Play sound on click
    document.querySelectorAll('.region-button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    quizRegion = button.dataset.region;
    // Preload Portugal media data if selected
    if (quizRegion === 'portugal') {
      // Use the globally available loadPortugalMedia
      loadPortugalMedia();
    }
    regionSelected = true;
    const container = document.querySelector('.region-buttons-container');
    container.style.animation = 'fadeScaleDown 0.4s ease forwards';
    setTimeout(() => {
      container.style.display = 'none';
      document.getElementById('length-buttons').style.display = 'flex';
      tryStartQuiz();
    }, 400);
  };
});

// Handle custom quiz button separately
document.getElementById('custom-quiz-btn').onclick = () => {
  document.getElementById('nav-sound').play(); // Play sound on click
  document.body.classList.add('custom-quiz-active'); // Add class to body
  document.querySelectorAll('.region-button, .quiz-length-button, .difficulty-button').forEach(btn => btn.style.display = 'none');
  document.getElementById('trophy-container').style.display = 'none';
  document.getElementById('length-buttons').style.display = 'none';
  customQuizSection.style.display = 'flex';
  loadCustomBirdList();
};

function renderTrophyBadges() {
  const container = document.getElementById('inline-trophies');
  container.innerHTML = ''; // Clear previous content
  container.style.cssText = 'display: flex; flex-direction: row; flex-wrap: wrap; gap: 20px; margin-top: 40px; justify-content: center;'; // Adjust container style for horizontal layout and wrapping and increased top margin

  const regions = ['europa', 'benelux', 'portugal']; // Include all regions
  const questionCounts = [10, 20, 50];
  const difficulties = ['Makkelijk', 'Normaal', 'Moeilijk', 'Expert', 'Autoriteit'];
  const difficultyIds = [1, 2, 3, 4, 5];

  regions.forEach(region => {
    const regionSection = document.createElement('div');
    regionSection.style.cssText = 'border: 1px solid #555; border-radius: 8px; padding: 15px;';

    questionCounts.forEach(qCount => {
      const trophiesGrid = document.createElement('div');
      trophiesGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 10px; margin-bottom: 40px;'; // Responsive grid with increased bottom margin

      difficultyIds.forEach(dId => {
        const key = `${region}-${qCount}-${dId}`;
        const value = localStorage.getItem(`highscore-${key}`);
        const isTrophy = value === '🏆';
        const difficultyName = difficulties[difficultyIds.indexOf(dId)];
        const scoreDisplay = value === '🏆' ? `${qCount}/${qCount}` : (value || '-/-'); // Use qCount for trophy score

        const trophyBadge = document.createElement('div');
        trophyBadge.style.cssText = `
          padding: 8px;
          border: 2px ${isTrophy ? 'solid #ffd700' : 'dashed #555'};
          border-radius: 8px;
          background: ${isTrophy ? '#222820' : '#181818'};
          color: ${isTrophy ? '#ffd700' : '#aaa'};
          font-size: 0.9em;
          text-align: center;
          box-shadow: ${isTrophy ? '0 0 6px rgba(255,215,0,0.4)' : 'none'};
        `;

        trophyBadge.innerHTML = `
          <div>${region.charAt(0).toUpperCase() + region.slice(1)}</div> <!-- Added region name -->
          <div>${difficultyName}</div>
          <div>${isTrophy ? '🏆 ' : ''}${scoreDisplay}</div>
        `;
        trophiesGrid.appendChild(trophyBadge);
      });

      regionSection.appendChild(trophiesGrid); // Append trophiesGrid directly to regionSection
    });

    container.appendChild(regionSection);
  });
}
renderTrophyBadges();

/*
document.getElementById('cheat-button').onclick = () => {
  if (!regionSelected || !lengthSelected || !difficultySelected) {
    alert('Start the quiz first by selecting region, length, and difficulty.');
    return;
  }

  quizState.score = quizLength;
  quizState.currentIndex = quizLength;

  updateHighscores();
  renderTrophyBadges();

  document.getElementById('quiz').innerHTML = `
    <h2>Je score: ${quizState.score} van ${quizLength}</h2>
    <button onclick="location.reload()" style="margin-top:30px;padding:16px 32px;background:#4aa3df;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:1.2em;font-weight:bold;box-shadow:0 4px 10px rgba(0,0,0,0.4);transition: background 0.3s;">🎉 Opnieuw spelen 🎉</button>
  `;
};
*/

function resetHeadingSize() {
  const heading = document.getElementById('quiz-heading');
  if (heading) heading.style.maxWidth = '30%';
}

function clearQuizSettings() {
  localStorage.removeItem('quizRegion');
  localStorage.removeItem('quizLength');
  localStorage.removeItem('quizDifficulty');
}

function updateHighscores() {
  const key = `${quizRegion}-${quizLength}-${quizDifficulty}`;
  const value = quizState.score === quizState.currentIndex ? '🏆' : `${quizState.score}/${quizState.currentIndex}`;
  localStorage.setItem(`highscore-${key}`, value);
}

function showHighscores() {
  const levels = {
    1: 'Makkelijk',
    2: 'Normaal',
    3: 'Moeilijk',
    4: 'Expert',
    5: 'Autoriteit'
  };
  let table = `<table style="margin: 30px auto; border-collapse: collapse; color: #fff;">`;
  table += `<caption>Highscores for ${quizRegion.charAt(0).toUpperCase() + quizRegion.slice(1)} - ${quizLength} vragen</caption>`; // Add a caption
  table += '<tr>';
  // Add table headers for all difficulty levels
  for (let d = 1; d <= 5; d++) {
    table += `<th style="padding: 10px; border-bottom: 1px solid #888;">${levels[d]}</th>`;
  }
  table += '</tr><tr>';

  // Display highscores for the current region and length across all difficulties
  for (let d = 1; d <= 5; d++) {
    const key = `${quizRegion}-${quizLength}-${d}`;
    const val = localStorage.getItem(`highscore-${key}`) || '-';
    table += `<td style="padding: 10px; border: 1px solid #666;">${val}</td>`;
  }

  table += '</tr></table>';


  const container = document.createElement('div');
  container.innerHTML = table;
  document.body.appendChild(container);

  // Hide the sound toggle button when the quiz ends
  document.getElementById('sound-toggle-button').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', (event) => {
  // --- Info Modal Logic ---
  infoModal = document.getElementById('info-modal');
  closeModalSpan = document.getElementById('close-modal');
  modalTitle = document.getElementById('modal-title');
  modalContent = document.getElementById('modal-content');

  // Close the modal when the user clicks on <span> (x)
  if (closeModalSpan) { // Check if element exists
    // Use the globally available closeBirdInfoModal
    closeModalSpan.onclick = closeBirdInfoModal;
  }
});

// Add keydown listener to the document for the next button
document.addEventListener('keydown', function(event) {
  const nextButton = document.getElementById('next');
  if (event.key === 'Enter' && nextButton && nextButton.style.display !== 'none') {
    event.preventDefault();
    loadQuestion();
  }
});

// Function to show the main menu
// Add click listener to the quiz heading to return to main menu
document.getElementById('quiz-heading').onclick = function() {
  location.reload(); // Reload the page to return to the main menu
};

// --- Sound Toggle Logic ---
const soundToggleButton = document.getElementById('sound-toggle-button');
const soundIcon = document.getElementById('sound-icon');
let isSoundEnabled = localStorage.getItem('isSoundEnabled') === 'true'; // Load from localStorage

// Set initial sound icon and muted state based on stored setting
if (isSoundEnabled) {
  soundIcon.src = 'images/soundon.svg';
  soundIcon.alt = 'Sound On';
  document.querySelectorAll('audio').forEach(audio => audio.muted = false);
} else {
  soundIcon.src = 'images/soundoff.svg';
  soundIcon.alt = 'Sound Off';
  document.querySelectorAll('audio').forEach(audio => audio.muted = true);
}

soundToggleButton.onclick = () => {
  isSoundEnabled = !isSoundEnabled;
  localStorage.setItem('isSoundEnabled', isSoundEnabled); // Save to localStorage

  if (isSoundEnabled) {
    soundIcon.src = 'images/soundon.svg'; // Use the provided soundon.svg
    soundIcon.alt = 'Sound On';
    // Re-enable sounds - need to find all audio elements and unmute them
    document.querySelectorAll('audio').forEach(audio => {
      audio.muted = false;
    });
  } else {
    soundIcon.src = 'images/soundoff.svg'; // Use the provided soundoff.svg
    soundIcon.alt = 'Sound Off';
    // Mute all audio elements
    document.querySelectorAll('audio').forEach(audio => {
      audio.muted = true;
    });
  }
};

// Also need to handle the case when the quiz ends and the button should be hidden again
// This might require modifying the quiz end logic (showHighscores function) test