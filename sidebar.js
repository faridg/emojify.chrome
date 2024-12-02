// persistent nano session
let nanoSession = null;

// get emoji for text via nano
async function getEmoji(text) {
  // init nano if needed
  if (!nanoSession) {
      try {
          nanoSession = await chrome.aiOriginTrial.languageModel.create({
              systemPrompt: 'respond with single most relevant emoji only'
          });
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
    const textarea = document.getElementById('inputText');
    const defaultState = document.querySelector('.default-state');
    const textState = document.querySelector('.text-state');
    const copyButton = document.querySelector('.copy-button');
    const welcomeTextarea = document.querySelector('.welcome-textarea');
    const emojifyButton = document.querySelector('.emojify-button');
    
    // handle emojify button
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
                copyButton.textContent = 'Copy text';
                copyButton.classList.remove('copied');
            }, 3000);
        }
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
  
    // listen for storage changes
    chrome.storage.onChanged.addListener(async (changes, namespace) => {
      if (namespace === 'local' && changes.selectedText) {
        const newText = changes.selectedText.newValue || '';
        const emoji = await getEmoji(newText);
        textarea.value = emoji ? `${emoji} ${newText}` : newText;
        defaultState.classList.add('hidden');
        textState.classList.remove('hidden');
      }
    });

    // handle slider functionality
    const sliderHandle = document.querySelector('.slider-handle');
    const sliderContainer = document.querySelector('.slider-container');
    let isDragging = false;

    sliderHandle.addEventListener('mousedown', () => {
        isDragging = true;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = sliderContainer.getBoundingClientRect();
            let x = e.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const percentage = (x / rect.width) * 100;
            sliderHandle.style.left = `${percentage}%`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
});
