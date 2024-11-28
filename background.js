// initiate context menu copy option
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'copyToSidebar',
      title: 'Copy to Sidebar',
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
