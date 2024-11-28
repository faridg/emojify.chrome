// initiate textarea with selected text from storage
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('inputText');
    
    chrome.storage.local.get(['selectedText'], (result) => {
      if (result.selectedText) {
        textarea.value = result.selectedText;
        chrome.storage.local.remove(['selectedText']);
      }
    });
  });
