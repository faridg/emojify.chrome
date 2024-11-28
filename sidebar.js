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
    
    // initial load of text if exists
    chrome.storage.local.get(['selectedText'], async (result) => {
      if (result.selectedText) {
        const emoji = await getEmoji(result.selectedText);
        textarea.value = emoji ? `${emoji} ${result.selectedText}` : result.selectedText;
        chrome.storage.local.remove(['selectedText']);
      } else {
        textarea.value = '';
      }
    });
  
    // listen for storage changes
    chrome.storage.onChanged.addListener(async (changes, namespace) => {
      if (namespace === 'local' && changes.selectedText) {
        const newText = changes.selectedText.newValue || '';
        const emoji = await getEmoji(newText);
        textarea.value = emoji ? `${emoji} ${newText}` : newText;
      }
    });
  });
