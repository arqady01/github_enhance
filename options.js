document.addEventListener('DOMContentLoaded', () => {
  const colorPicker = document.getElementById('color');
  const saveButton = document.getElementById('save');

  // 加载保存的颜色
  chrome.storage.sync.get('tocColor', (data) => {
    colorPicker.value = data.tocColor || '#0366d6';
  });

  saveButton.addEventListener('click', () => {
    const color = colorPicker.value;
    chrome.storage.sync.set({ tocColor: color }, () => {
      alert('颜色已保存');
      // 通知所有标签页更新颜色
      chrome.tabs.query({url: 'https://github.com/*'}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {action: "updateColor", color: color})
            .catch(error => console.log(`无法发送消息到标签 ${tab.id}: ${error}`));
        });
      });
    });
  });
});