let tocVisible = true;
let userColor = '#0366d6'; // 默认颜色

// 加载保存的颜色
chrome.storage.sync.get('tocColor', (data) => {
  if (data.tocColor) {
    userColor = data.tocColor;
    updateTOCColor(userColor);
  }
});

function createTOC() {
  const article = document.querySelector('.repository-content article.markdown-body');
  if (!article || document.querySelector('.github-readme-toc')) return;

  const headers = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headers.length === 0) return;

  const toc = document.createElement('div');
  toc.className = 'github-readme-toc';

  const tocList = document.createElement('ul');
  toc.appendChild(tocList);

  let currentLevels = [tocList];

  headers.forEach((header, index) => {
    const level = parseInt(header.tagName.charAt(1));
    const li = document.createElement('li');
    li.className = `toc-item toc-h${level}`;
    
    const a = document.createElement('a');
    
    // 添加折叠按钮
    if (index < headers.length - 1 && parseInt(headers[index + 1].tagName.charAt(1)) > level) {
      const toggleButton = document.createElement('span');
      toggleButton.className = 'toggle-button';
      toggleButton.textContent = '▼';
      toggleButton.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止默认行为
        e.stopPropagation(); // 阻止事件冒泡
        toggleButton.textContent = toggleButton.textContent === '▼' ? '▶' : '▼';
        toggleSubitems(li, level);
      });
      a.insertBefore(toggleButton, a.firstChild);
    }

    // 使用 textContent 而不是 innerText，以确保正确的文本编码
    a.appendChild(document.createTextNode(header.textContent.trim()));
    a.href = `#${header.id}`;
    a.style.color = userColor;
    
    const headerTag = document.createElement('span');
    headerTag.className = 'header-tag';
    headerTag.textContent = `H${level}`;
    
    a.appendChild(headerTag);
    li.appendChild(a);

    // 找到正确的父级列表
    while (currentLevels.length > level) {
      currentLevels.pop();
    }
    while (currentLevels.length < level) {
      const newUl = document.createElement('ul');
      if (currentLevels[currentLevels.length - 1].lastElementChild) {
        currentLevels[currentLevels.length - 1].lastElementChild.appendChild(newUl);
      } else {
        currentLevels[currentLevels.length - 1].appendChild(newUl);
      }
      currentLevels.push(newUl);
    }

    currentLevels[currentLevels.length - 1].appendChild(li);

    a.addEventListener('click', (e) => {
      // 只有当点击的不是折叠按钮时，才执行滚动
      if (!e.target.classList.contains('toggle-button')) {
        e.preventDefault();
        header.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  document.body.appendChild(toc);
}

function toggleSubitems(li, level) {
  const isCollapsed = li.classList.toggle('collapsed');
  let sibling = li.nextElementSibling;
  
  while (sibling) {
    const siblingLevel = parseInt(sibling.className.split('toc-h')[1]);
    if (siblingLevel <= level) break;
    
    if (isCollapsed) {
      sibling.style.display = 'none';
      // 如果折叠了上级，确保所有子级都保持折叠状态
      const subToggle = sibling.querySelector('.toggle-button');
      if (subToggle && subToggle.textContent === '▼') {
        subToggle.click();
      }
    } else {
      sibling.style.display = '';
      // 展开时，只显示直接子级，保持其他层级的折叠状态
      if (siblingLevel === level + 1) {
        const subToggle = sibling.querySelector('.toggle-button');
        if (subToggle && subToggle.textContent === '▶') {
          subToggle.click();
        }
      }
    }
    sibling = sibling.nextElementSibling;
  }
}

function toggleTOC() {
  const toc = document.querySelector('.github-readme-toc');
  if (toc) {
    tocVisible = !tocVisible;
    toc.style.display = tocVisible ? 'block' : 'none';
  }
}

function updateTOCColor(color) {
  userColor = color;
  const tocLinks = document.querySelectorAll('.github-readme-toc a');
  tocLinks.forEach(link => link.style.color = color);
}

function init() {
  try {
    const targetNode = document.querySelector('.repository-content');
    if (targetNode) {
      const observer = new MutationObserver((mutations) => {
        if (mutations.some(mutation => mutation.type === 'childList' && mutation.addedNodes.length > 0)) {
          createTOC();
        }
      });
      observer.observe(targetNode, { childList: true, subtree: true });
      createTOC();
    } else {
      console.log('Target node not found. Retrying in 1 second...');
      setTimeout(init, 1000);
    }
  } catch (error) {
    handleError(error);
  }
}

// 在文件开头添加这个函数
function handleError(error) {
  console.error('GitHub README TOC Error:', error);
}

// 将所有的主要函数调用包裹在 try-catch 块中
try {
  // 初始化
  init();
} catch (error) {
  handleError(error);
}

// 监听来自背景脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'toggleTOC') {
      toggleTOC();
    } else if (request.action === 'updateColor') {
      updateTOCColor(request.color);
    } else if (request.action === 'checkTOC') {
      init();
    }
    sendResponse({status: "ok"});
  } catch (error) {
    handleError(error);
    sendResponse({status: "error", message: error.message});
  }
  return true;  // 保持消息通道开放
});

// 初始化
init();

// 在文件末尾添加以下代码
function handleTOCScroll() {
  // 由于滚动条现在总是可见，我们不需要特殊处理滚动事件
  // 如果将来需要在滚动时执行某些操作，可以在这里添加代码
}

// 在文件末尾添加
chrome.runtime.sendMessage({action: "contentScriptReady"});