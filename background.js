let currentTab = null;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('github.com')) {
    currentTab = tabId;
    chrome.tabs.sendMessage(tabId, { action: "checkTOC" })
      .catch(error => console.log(`无法发送消息到标签 ${tabId}: ${error}`));
    
    // 加载保存的颜色并发送到内容脚本
    chrome.storage.sync.get('tocColor', (data) => {
      if (data.tocColor) {
        chrome.tabs.sendMessage(tabId, {action: "updateColor", color: data.tocColor})
          .catch(error => console.log(`无法发送颜色更新消息到标签 ${tabId}: ${error}`));
      }
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('github.com')) {
    currentTab = tab.id;
    chrome.tabs.sendMessage(currentTab, {action: "toggleTOC"})
      .catch(error => console.log(`无法发送切换TOC消息到标签 ${currentTab}: ${error}`));
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('tocColor', (data) => {
    if (!data.tocColor) {
      chrome.storage.sync.set({ tocColor: '#0366d6' });
    }
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.tocColor) {
    chrome.tabs.query({url: 'https://github.com/*'}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: "updateColor",
          color: changes.tocColor.newValue
        }).catch(error => console.log(`无法发送颜色更新消息到标签 ${tab.id}: ${error}`));
      });
    });
  }
});