// persistent nano session
let nanoSession = null;

// slider state constants
const SLIDER_STATES = {
  FORMAL: { position: 0, temperature: 0.3, topK: 1 },
  BALANCED: { position: 50, temperature: 0.7, topK: 3 },
  CREATIVE: { position: 100, temperature: 1, topK: 5 }
};

// get slider state based on position
function getSliderState(percentage) {
  if (percentage <= 33) {
    return {
      state: 'FORMAL',
      label: 'Professional 👔',
      ...SLIDER_STATES.FORMAL
    };
  } else if (percentage <= 66) {
    return {
      state: 'BALANCED',
      label: 'Balanced 🎯',
      ...SLIDER_STATES.BALANCED
    };
  }
  return {
    state: 'CREATIVE',
    label: 'Creative 🎨',
    ...SLIDER_STATES.CREATIVE
  };
}

// update ai parameters
async function updateNanoParameters(temperature, topK) {
  if (nanoSession) {
    try {
      await nanoSession.setParameters({
        temperature: temperature,
        topK: topK
      });
    } catch (error) {
      console.error('error updating parameters:', error);
    }
  }
}

// get emoji for text via nano
async function getEmoji(text) {
  if (!nanoSession) {
    try {
      nanoSession = await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: 'respond with single most relevant emoji only'
      });
      const initialState = getSliderState(50);
      await updateNanoParameters(initialState.temperature, initialState.topK);
    } catch {
      return '';
    }
  }
    
  try {
    const emoji = await nanoSession.prompt(`analyze and return single most relevant emoji for the text: "${text}"`);
    return emoji.trim();
  } catch {
    return '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // get dom elements
  const textarea = document.getElementById('inputText');
  const defaultState = document.querySelector('.default-state');
  const textState = document.querySelector('.text-state');
  const copyButton = document.querySelector('.copy-button');
  const welcomeTextarea = document.querySelector('.welcome-textarea');
  const emojifyButton = document.querySelector('.emojify-button');
  const clearButton = document.querySelector('.clear-button');
  const emojifyButtonSecondary = document.querySelector('.emojify-button-secondary');
  const styleLabel = document.querySelector('.style-label');
  
  // initialize slider
  const sliderHandle = document.querySelector('.slider-handle');
  const sliderContainer = document.querySelector('.slider-container');
  let isDragging = false;
  let currentState = getSliderState(50);
  
  // set initial states
  sliderHandle.style.left = '50%';
  styleLabel.textContent = currentState.label;
  updateNanoParameters(currentState.temperature, currentState.topK);
  
  // handle text input
  textarea.addEventListener('input', () => {
    if (textarea.value.trim()) {
      emojifyButtonSecondary.classList.remove('hidden');
    } else {
      emojifyButtonSecondary.classList.add('hidden');
    }
  });

  // handle secondary emojify button
  emojifyButtonSecondary.addEventListener('click', async () => {
    if (textarea.value.trim()) {
      const emoji = await getEmoji(textarea.value);
      textarea.value = emoji ? `${emoji} ${textarea.value}` : textarea.value;
      emojifyButtonSecondary.classList.add('hidden');
    }
  });
    
  // handle main emojify button
  emojifyButton.addEventListener('click', async () => {
    if (welcomeTextarea.value.trim()) {
      const emoji = await getEmoji(welcomeTextarea.value);
      textarea.value = emoji ? `${emoji} ${welcomeTextarea.value}` : welcomeTextarea.value;
      defaultState.classList.add('hidden');
      textState.classList.remove('hidden');
      welcomeTextarea.value = '';
    }
  });

  // handle copy button
  copyButton.addEventListener('click', async () => {
    if (textarea.value) {
      await navigator.clipboard.writeText(textarea.value);
      copyButton.textContent = 'Copied';
      copyButton.classList.add('copied');
        
      setTimeout(() => {
        copyButton.textContent = 'Copy';
        copyButton.classList.remove('copied');
      }, 3000);
    }
  });

  // handle clear button
  clearButton.addEventListener('click', () => {
    textarea.value = '';
    textState.classList.add('hidden');
    defaultState.classList.remove('hidden');
    welcomeTextarea.value = '';
    emojifyButtonSecondary.classList.add('hidden');
  });

  // load initial text if exists
  chrome.storage.local.get(['selectedText'], async (result) => {
    if (result.selectedText) {
      const emoji = await getEmoji(result.selectedText);
      textarea.value = emoji ? `${emoji} ${result.selectedText}` : result.selectedText;
      defaultState.classList.add('hidden');
      textState.classList.remove('hidden');
      chrome.storage.local.remove(['selectedText']);
    }
  });
  
  // handle storage changes
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local' && changes.selectedText) {
      const newText = changes.selectedText.newValue || '';
      const emoji = await getEmoji(newText);
      textarea.value = emoji ? `${emoji} ${newText}` : newText;
      defaultState.classList.add('hidden');
      textState.classList.remove('hidden');
    }
  });

  // handle slider events
  sliderHandle.addEventListener('mousedown', () => {
    isDragging = true;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const rect = sliderContainer.getBoundingClientRect();
      let x = e.clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const percentage = (x / rect.width) * 100;
      
      const newState = getSliderState(percentage);
      sliderHandle.style.left = `${newState.position}%`;
      styleLabel.textContent = newState.label;
      
      if (newState.state !== currentState.state) {
        currentState = newState;
        updateNanoParameters(currentState.temperature, currentState.topK);
      }
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      const currentPosition = parseFloat(sliderHandle.style.left);
      const newState = getSliderState(currentPosition);
      sliderHandle.style.left = `${newState.position}%`;
      styleLabel.textContent = newState.label;
    }
  });
});
