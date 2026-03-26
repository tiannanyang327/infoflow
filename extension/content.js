// InfoFlow Content Extractor
// Extracts full HTML (including images) from page content

// Convert a DOM element to clean HTML, keeping text + images
function extractHtml(el) {
  if (!el) return '';
  // Clone to avoid modifying the page
  const clone = el.cloneNode(true);
  // Remove scripts, styles, hidden elements
  clone.querySelectorAll('script, style, noscript, [hidden], .hide, [style*="display:none"], [style*="display: none"]').forEach(n => n.remove());
  // Convert relative image URLs to absolute
  clone.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-original');
    if (src) {
      try {
        img.setAttribute('src', new URL(src, location.href).href);
      } catch {}
    }
    // Remove srcset to simplify
    img.removeAttribute('srcset');
    // Keep alt text
    if (!img.getAttribute('alt')) img.setAttribute('alt', 'image');
  });
  return clone.innerHTML;
}

function extractXiaohongshu() {
  const title = document.querySelector('#detail-title')?.textContent
    || document.querySelector('.note-title')?.textContent
    || document.querySelector('[class*="title"]')?.textContent
    || document.title;

  const author = document.querySelector('.author-name')?.textContent
    || document.querySelector('[class*="author"] [class*="name"]')?.textContent
    || '';

  // Get the full note content area with images
  const noteContent = document.querySelector('.note-content')
    || document.querySelector('#noteContainer')
    || document.querySelector('[class*="note-detail"]')
    || document.querySelector('[class*="content"]');

  // Also grab images from the carousel/slider
  const images = [];
  document.querySelectorAll('.swiper-slide img, [class*="carousel"] img, [class*="slide"] img, .note-image img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (src && !src.includes('avatar') && !src.includes('icon')) {
      images.push(src.startsWith('http') ? src : new URL(src, location.href).href);
    }
  });

  const contentHtml = extractHtml(noteContent);
  const imagesHtml = images.map(src => `<img src="${src}" alt="image" />`).join('\n');
  const fullHtml = contentHtml + (imagesHtml ? '\n' + imagesHtml : '');

  // Also get plain text for AI processing
  const plainText = noteContent ? noteContent.innerText : '';

  return {
    title: title?.trim() || 'Xiaohongshu Post',
    author: author?.trim() || '',
    content: plainText?.trim() || '',
    contentHtml: fullHtml,
    sourceType: 'xiaohongshu'
  };
}

function extractWechat() {
  const title = document.querySelector('#activity-name')?.textContent
    || document.querySelector('.rich_media_title')?.textContent
    || document.title;

  const author = document.querySelector('#js_name')?.textContent
    || document.querySelector('.rich_media_meta_nickname')?.textContent
    || '';

  const contentEl = document.querySelector('#js_content');

  // Get full HTML with images
  const contentHtml = extractHtml(contentEl);
  // Get plain text for AI
  const plainText = contentEl ? contentEl.innerText : '';

  return {
    title: title?.trim() || 'WeChat Article',
    author: author?.trim() || '',
    content: plainText?.trim() || '',
    contentHtml: contentHtml,
    sourceType: 'wechat'
  };
}

function extractGeneric() {
  const title = document.querySelector('h1')?.textContent
    || document.title;

  const article = document.querySelector('article')
    || document.querySelector('[role="main"]')
    || document.querySelector('main')
    || document.querySelector('.post-content')
    || document.querySelector('.entry-content');

  const contentHtml = extractHtml(article || document.body);
  const plainText = article ? article.innerText : document.body.innerText;

  return {
    title: title?.trim() || document.title,
    author: '',
    content: plainText?.trim() || '',
    contentHtml: contentHtml,
    sourceType: 'web'
  };
}

function detectAndExtract() {
  const host = location.hostname.toLowerCase();

  if (host.includes('xiaohongshu.com') || host.includes('xhslink.com')) {
    return extractXiaohongshu();
  }
  if (host.includes('mp.weixin.qq.com')) {
    return extractWechat();
  }
  return extractGeneric();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    const result = detectAndExtract();
    result.url = location.href;
    sendResponse(result);
  }
  return true;
});
