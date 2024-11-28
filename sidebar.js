// initiate textarea with selected text from storage
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('inputText');
    
    // initial load of text if exists
    chrome.storage.local.get(['selectedText'], (result) => {
      if (result.selectedText) {
        textarea.value = result.selectedText;
        chrome.storage.local.remove(['selectedText']);
      } else {
        textarea.value = '';
      }
    });
  
    // listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.selectedText) {
        textarea.value = changes.selectedText.newValue || '';
      }
    });
  });
