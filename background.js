const WELCOME_URL = "/pages/welcome.html";

chrome.runtime.onInstalled.addListener((details) => {
  // on install
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({
      url: WELCOME_URL,
    });
  } 
});

// initiate context menu copy option
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'copyToSidebar',
      title: 'Emojify',
      contexts: ['selection']
    });
    
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  });
  
  // handle context menu click to sidebar
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'copyToSidebar') {
      chrome.storage.local.set({ selectedText: info.selectionText });
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });
