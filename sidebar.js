// persistent nano session
let nanoSession = null;

// slider state constants
const SLIDER_STATES = {
  FORMAL: { 
    position: 0, 
    temperature: 0.3, 
    topK: 1,
    maxEmojis: 1,
    prompt: 'analyze text and return single most professional and relevant emoji'
  },
  BALANCED: { 
    position: 50, 
    temperature: 0.7, 
    topK: 3,
    maxEmojis: 2,
    prompt: 'analyze text and return 1-2 most relevant emojis that best represent the key themes or emotions'
  },
  CREATIVE: { 
    position: 100, 
    temperature: 1, 
    topK: 5,
    maxEmojis: 3,
    prompt: 'analyze text and return 2-3 creative and expressive emojis that capture the mood, themes, and subtle context'
  }
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

// get emojis for text via nano
async function getEmojis(text, state) {
  if (!nanoSession) {
    try {
      nanoSession = await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: 'you analyze text and return only emojis without any other text or explanation'
      });
      await updateNanoParameters(state.temperature, state.topK);
    } catch {
      return '';
    }
  }
    
  try {
    const emojis = await nanoSession.prompt(state.prompt + ` text to analyze: "${text}"`);
    return emojis.trim();
  } catch {
    return '';
  }
}

// format text with emojis
function formatWithEmojis(text, emojis) {
  if (!emojis) return text;
  
  // remove any whitespace between emojis
  const cleanEmojis = emojis.replace(/\s+/g, '');
  
  // split text into sentences for more natural emoji placement
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  if (sentences.length === 1) {
    // single sentence - place emojis at start
    return `${cleanEmojis} ${text}`;
  } else {
    // multiple sentences - distribute emojis
    const emojiArray = Array.from(cleanEmojis);
    let emojiIndex = 0;
    
    return sentences.map(sentence => {
      if (emojiIndex < emojiArray.length) {
        const result = `${emojiArray[emojiIndex]} ${sentence}`;
        emojiIndex++;
        return result;
      }
      return sentence;
    }).join(' ');
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
      const originalText = textarea.value.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      const emojis = await getEmojis(originalText, currentState);
      textarea.value = formatWithEmojis(originalText, emojis);
      emojifyButtonSecondary.classList.add('hidden');
    }
  });
    
  // handle main emojify button
  emojifyButton.addEventListener('click', async () => {
    if (welcomeTextarea.value.trim()) {
      const emojis = await getEmojis(welcomeTextarea.value, currentState);
      textarea.value = formatWithEmojis(welcomeTextarea.value, emojis);
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
      const emojis = await getEmojis(result.selectedText, currentState);
      textarea.value = formatWithEmojis(result.selectedText, emojis);
      defaultState.classList.add('hidden');
      textState.classList.remove('hidden');
      chrome.storage.local.remove(['selectedText']);
    }
  });
  
  // handle storage changes
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local' && changes.selectedText) {
      const newText = changes.selectedText.newValue || '';
      const emojis = await getEmojis(newText, currentState);
      textarea.value = formatWithEmojis(newText, emojis);
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
        // show emojify button when state changes
        if (textarea.value.trim()) {
          emojifyButtonSecondary.classList.remove('hidden');
        }
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
      // show emojify button on slider release
      if (textarea.value.trim()) {
        emojifyButtonSecondary.classList.remove('hidden');
      }
    }
  });
});
