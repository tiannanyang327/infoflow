const API_BASE = 'https://infoflow-two.vercel.app';

let extractedData = null;
let apiKey = '';

async function loadApiKey() {
  const result = await chrome.storage.local.get('infoflow_api_key');
  apiKey = result.infoflow_api_key || '';
}

function showSettings() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('main').style.display = 'none';
  document.getElementById('settings').style.display = 'block';
  document.getElementById('apiKeyInput').value = apiKey;
}

function hideSettings() {
  document.getElementById('settings').style.display = 'none';
  if (extractedData) {
    document.getElementById('main').style.display = 'block';
  } else {
    document.getElementById('loading').style.display = 'block';
    init();
  }
}

async function init() {
  await loadApiKey();

  // Show settings link
  document.getElementById('settingsLink').style.display = 'block';

  if (!apiKey) {
    document.getElementById('loading').textContent = '⚙️ 请先配置 API Key';
    document.getElementById('loading').style.cursor = 'pointer';
    document.getElementById('loading').onclick = showSettings;
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
    extractedData = response;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('main').style.display = 'block';

    document.getElementById('title').textContent = response.title || 'Untitled';
    document.getElementById('source').textContent = `${response.sourceType} · ${response.url?.slice(0, 50)}...`;
    document.getElementById('content').textContent = response.content?.slice(0, 300) || 'No content extracted';

    if (!response.content || response.content.length < 20) {
      document.getElementById('status').textContent = '⚠️ 提取到的内容较少，保存后可能影响 AI 分析质量';
      document.getElementById('status').className = 'status error';
    }
  } catch (err) {
    document.getElementById('loading').textContent = '❌ 无法提取此页面内容';
    console.error(err);
  }
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  if (!extractedData) return;

  const btn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  btn.disabled = true;
  btn.textContent = 'AI 分析中...';
  status.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        manualText: extractedData.content,
        manualTitle: extractedData.title,
        contentHtml: extractedData.contentHtml || '',
        url: extractedData.url,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed');
    }

    const result = await res.json();
    btn.textContent = '✅ 已保存';
    status.textContent = `标签: ${result.tags?.join(', ') || 'none'}`;
    status.className = 'status success';
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '保存到 InfoFlow';
    status.textContent = `❌ ${err.message}`;
    status.className = 'status error';
  }
});

// Settings handlers
document.getElementById('saveKeyBtn').addEventListener('click', async () => {
  const input = document.getElementById('apiKeyInput');
  const key = input.value.trim();
  if (!key) return;
  await chrome.storage.local.set({ infoflow_api_key: key });
  apiKey = key;
  hideSettings();
});

document.getElementById('cancelKeyBtn').addEventListener('click', () => {
  hideSettings();
});

document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  showSettings();
});

init();
