/**
 * SkillAI Gemma 4 Studio - Frontend Client Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const promptInput = document.getElementById('prompt-input');
  const composerForm = document.getElementById('composer-form');
  const sendBtn = document.getElementById('send-btn');
  const attachBtn = document.getElementById('attach-btn');
  const imageInput = document.getElementById('image-input');
  const imagePreviewDock = document.getElementById('image-preview-dock');
  const previewImg = document.getElementById('preview-img');
  const previewName = document.getElementById('preview-name');
  const previewSize = document.getElementById('preview-size');
  const removeImageBtn = document.getElementById('remove-image-btn');
  const chatViewport = document.getElementById('chat-viewport');
  const messageList = document.getElementById('message-list');
  const welcomeCard = document.getElementById('welcome-card');
  const loadingIndicator = document.getElementById('loading-indicator');
  const charCounter = document.getElementById('char-counter');
  const verifyBtn = document.getElementById('verify-btn');
  const statusDot = document.getElementById('status-dot');
  const noticeBanner = document.getElementById('notice-banner');
  const noticeText = document.getElementById('notice-text');
  const noticeDismiss = document.getElementById('notice-dismiss');
  const sampleChips = document.querySelectorAll('.chip');

  // State
  let selectedImageFile = null;
  let isGenerating = false;

  // Auto-resize textarea
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 180) + 'px';
    const len = promptInput.value.length;
    charCounter.textContent = `${len.toLocaleString()} / 32,000 characters`;
    if (len > 32000) {
      charCounter.style.color = '#f43f5e';
    } else {
      charCounter.style.color = 'var(--text-muted)';
    }
  });

  // Enter to send (Shift+Enter for newline)
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      composerForm.dispatchEvent(new Event('submit'));
    }
  });

  // Sample prompt chips
  sampleChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      promptInput.value = chip.getAttribute('data-prompt');
      promptInput.dispatchEvent(new Event('input'));
      promptInput.focus();
    });
  });

  // Notice Banner helpers
  function showNotice(text, type = 'error') {
    noticeText.textContent = text;
    noticeBanner.className = `notice-banner ${type}`;
    noticeBanner.classList.remove('hidden');
  }

  function hideNotice() {
    noticeBanner.classList.add('hidden');
  }

  noticeDismiss.addEventListener('click', hideNotice);

  // Attach button triggers hidden file input
  attachBtn.addEventListener('click', () => {
    imageInput.click();
  });

  // Handle image selection
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file);
  });

  // Drag and drop image onto composer
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      }
    }
  });

  function handleImageFile(file) {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type)) {
      showNotice(`Invalid image type (${file.type}). Allowed: JPG, PNG, WEBP, GIF`, 'warning');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotice('Image file exceeds maximum allowed size (10 MB).', 'warning');
      return;
    }

    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewName.textContent = file.name;
      previewSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      imagePreviewDock.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  // Remove image
  removeImageBtn.addEventListener('click', () => {
    clearImageAttachment();
  });

  function clearImageAttachment() {
    selectedImageFile = null;
    imageInput.value = '';
    previewImg.src = '';
    imagePreviewDock.classList.add('hidden');
  }

  // Form submit / Send prompt
  composerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();

    // Validation
    if (!prompt) {
      showNotice('Please enter a prompt before sending.', 'warning');
      promptInput.focus();
      return;
    }

    if (prompt.length > 32000) {
      showNotice('Prompt exceeds maximum length of 32,000 characters.', 'warning');
      return;
    }

    if (isGenerating) return;

    hideNotice();

    // Hide welcome card upon first message
    if (welcomeCard) {
      welcomeCard.classList.add('hidden');
    }

    // Capture image preview data if present
    const attachedImageDataUrl = selectedImageFile ? previewImg.src : null;

    // Append User Message to UI
    appendUserMessage(prompt, attachedImageDataUrl);

    // Save current file and clear input form
    const imageToSend = selectedImageFile;
    promptInput.value = '';
    promptInput.style.height = 'auto';
    charCounter.textContent = '0 / 32,000 characters';
    clearImageAttachment();

    // Set loading state
    setLoadingState(true);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (imageToSend) {
        formData.append('image', imageToSend);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to get response`);
      }

      // Append Assistant Message
      appendAssistantMessage(data.response, data.model, data.usage);
    } catch (err) {
      console.error('Generation Error:', err);
      showNotice(`Error: ${err.message}`, 'error');
      appendErrorMessage(err.message);
    } finally {
      setLoadingState(false);
      promptInput.focus();
    }
  });

  // Set loading state
  function setLoadingState(loading) {
    isGenerating = loading;
    sendBtn.disabled = loading;
    promptInput.disabled = loading;
    attachBtn.disabled = loading;

    if (loading) {
      loadingIndicator.classList.remove('hidden');
      scrollToBottom();
    } else {
      loadingIndicator.classList.add('hidden');
    }
  }

  // Append user message
  function appendUserMessage(text, imageDataUrl) {
    const item = document.createElement('div');
    item.className = 'message-item user';

    let imageHtml = '';
    if (imageDataUrl) {
      imageHtml = `<img src="${imageDataUrl}" class="message-image-attachment" alt="User upload" />`;
    }

    item.innerHTML = `
      <div class="message-avatar">You</div>
      <div class="message-bubble">
        ${imageHtml}
        <div class="message-text">${escapeHtml(text)}</div>
      </div>
    `;

    messageList.appendChild(item);
    scrollToBottom();
  }

  // Append assistant message
  function appendAssistantMessage(text, modelId, usage) {
    const item = document.createElement('div');
    item.className = 'message-item assistant';

    const formattedText = formatMarkdown(text);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let usageStr = '';
    if (usage && usage.candidatesTokenCount) {
      usageStr = ` • ${usage.candidatesTokenCount} tokens`;
    }

    item.innerHTML = `
      <div class="message-avatar">G4</div>
      <div class="message-bubble">
        <div class="message-text">${formattedText}</div>
        <div class="message-meta">
          <span class="meta-model-tag">Model: ${escapeHtml(modelId || 'gemma-4-26b-a4b-it')}${usageStr}</span>
          <button class="btn-copy" title="Copy response">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </button>
        </div>
      </div>
    `;

    // Copy button listener
    const copyBtn = item.querySelector('.btn-copy');
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
      } catch (err) {
        console.warn('Copy failed:', err);
      }
    });

    messageList.appendChild(item);
    scrollToBottom();
  }

  // Append error message card
  function appendErrorMessage(errorMessage) {
    const item = document.createElement('div');
    item.className = 'message-item assistant';
    item.innerHTML = `
      <div class="message-avatar" style="background:#f43f5e">!</div>
      <div class="message-bubble" style="border-color: rgba(244, 63, 94, 0.4); background: rgba(244, 63, 94, 0.08);">
        <strong style="color: #fda4af;">Gemma 4 Request Failed</strong>
        <p style="margin-top: 0.35rem; font-size: 0.9rem; color: #fecdd3;">${escapeHtml(errorMessage)}</p>
      </div>
    `;
    messageList.appendChild(item);
    scrollToBottom();
  }

  // Scroll chat viewport to bottom
  function scrollToBottom() {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }

  // Verify button handler
  verifyBtn.addEventListener('click', async () => {
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Checking...';
    try {
      const res = await fetch('/api/model-info');
      const data = await res.json();
      if (data.success && data.available) {
        statusDot.className = 'pulse-dot active';
        showNotice(`Model ${data.modelId} verified active & accessible!`, 'info');
      } else {
        statusDot.className = 'pulse-dot warning';
        showNotice(`Status: ${data.error || 'Model check notice'}`, 'warning');
      }
    } catch (err) {
      statusDot.className = 'pulse-dot error';
      showNotice(`Could not reach backend: ${err.message}`, 'error');
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        Verify
      `;
    }
  });

  // Check initial backend health
  async function checkInitialHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (!data.apiKeyConfigured) {
        statusDot.className = 'pulse-dot warning';
        showNotice(
          'GEMINI_API_KEY is not configured. Please set your key in .env to call gemma-4-26b-a4b-it.',
          'warning'
        );
      } else {
        statusDot.className = 'pulse-dot active';
      }
    } catch (err) {
      statusDot.className = 'pulse-dot error';
      console.warn('Backend server not reachable on load:', err);
    }
  }

  checkInitialHealth();

  // Helper: Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper: Basic Markdown Parser for headings, lists, bold, italics, code blocks
  function formatMarkdown(raw) {
    if (!raw) return '';

    // Extract and preserve code blocks
    const codeBlocks = [];
    let text = raw.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<pre><code class="lang-${lang}">${escapeHtml(code.trim())}</code></pre>`);
      return `%%CODEBLOCK_${idx}%%`;
    });

    // Inline code
    text = text.replace(/`([^`]+)`/g, (match, inline) => {
      return `<code>${escapeHtml(inline)}</code>`;
    });

    // Escape remaining HTML
    text = escapeHtml(text);

    // Bold & Italics
    text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Bullet points
    text = text.replace(/^[\*\-]\s+(.*)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    // Fix consecutive ul tags
    text = text.replace(/<\/ul>\s*<ul>/g, '');

    // Paragraphs / line breaks
    text = text.replace(/\n{2,}/g, '</p><p>');
    text = text.replace(/\n/g, '<br/>');
    text = `<p>${text}</p>`;

    // Restore code blocks
    codeBlocks.forEach((block, idx) => {
      text = text.replace(`%%CODEBLOCK_${idx}%%`, block);
    });

    return text;
  }
});
