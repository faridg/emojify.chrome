// persistent nano session
let nanoSession = null;

// slider state constants
const SLIDER_STATES = {
  FORMAL: { 
    position: 0, 
    temperature: 0.3, 
    topK: 1,
    maxEmojis: 1,
    prompt: 'summarize and rewrite the following text in a formal and concise way. respond with only the rewritten text without any explanations:',
    emojiPrompt: 'select a single professional emoji that matches this text. respond with only the emoji:'
  },
  BALANCED: { 
    position: 50, 
    temperature: 0.7, 
    topK: 3,
    maxEmojis: 2,
    prompt: 'summarize and rewrite this text in a balanced and natural way. respond with only the rewritten text without any explanations:',
    emojiPrompt: 'select 1-2 relevant emojis that match this text. respond with only the emojis:'
  },
  CREATIVE: { 
    position: 100, 
    temperature: 1, 
    topK: 5,
    maxEmojis: 3,
    prompt: 'summarize and rewrite this text in an expressive and engaging way. respond with only the rewritten text without any explanations:',
    emojiPrompt: 'select 2-3 expressive emojis that match this text. respond with only the emojis:'
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
      await nanoSession.prompt(`adjust your responses to use temperature ${temperature} and top_k ${topK}`);
    } catch (error) {
      console.error('error updating params:', error);
    }
  }
}

// transform text via nano
async function transformText(text, state) {
  if (!nanoSession) {
    try {
      nanoSession = await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: 'you are a text rewriting assistant. always respond with only the rewritten text, without any explanations or notes about changes made.'
      });
    } catch (error) {
      console.error('session create error:', error);
      return text;
    }
  }
    
  try {
    const result = await nanoSession.prompt(state.prompt + ` "${text}"`);
    return result.trim();
  } catch (error) {
    console.error('text transform error:', error);
    return text;
  }
}

// get emojis via nano
async function getEmojis(text, state) {
  if (!nanoSession) {
    try {
      nanoSession = await chrome.aiOriginTrial.languageModel.create({
        systemPrompt: 'you are an emoji selector. always respond with only emojis, without any explanations or extra text.'
      });
    } catch {
      return '';
    }
  }
    
  try {
    const emojis = await nanoSession.prompt(state.emojiPrompt + `: "${text}"`);
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
  
  // set initial state
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
      const originalText = textarea.value.trim();
      const transformedText = await transformText(originalText, currentState);
      const emojis = await getEmojis(transformedText, currentState);
      textarea.value = formatWithEmojis(transformedText, emojis);
      emojifyButtonSecondary.classList.add('hidden');
    }
  });
    
  // handle main emojify button
  emojifyButton.addEventListener('click', async () => {
    if (welcomeTextarea.value.trim()) {
      const originalText = welcomeTextarea.value.trim();
      const transformedText = await transformText(originalText, currentState);
      const emojis = await getEmojis(transformedText, currentState);
      textarea.value = formatWithEmojis(transformedText, emojis);
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
      const originalText = result.selectedText;
      const transformedText = await transformText(originalText, currentState);
      const emojis = await getEmojis(transformedText, currentState);
      textarea.value = formatWithEmojis(transformedText, emojis);
      defaultState.classList.add('hidden');
      textState.classList.remove('hidden');
      chrome.storage.local.remove(['selectedText']);
    }
  });
  
  // handle storage changes
  chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local' && changes.selectedText) {
      const originalText = changes.selectedText.newValue || '';
      const transformedText = await transformText(originalText, currentState);
      const emojis = await getEmojis(transformedText, currentState);
      textarea.value = formatWithEmojis(transformedText, emojis);
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
