// URL Parser Tool JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Back navigation
  const backLink = document.querySelector('.back-link a');
  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/';
    });
  }
  // Elements
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Encode tab elements
  const urlInput = document.getElementById('url-input');
  const encodeBtn = document.getElementById('encode-btn');
  const encodedResult = document.getElementById('encoded-result');
  const copyEncodedBtn = document.getElementById('copy-encoded');
  const clearEncodeBtn = document.getElementById('clear-encode');

  // Decode tab elements
  const encodedInput = document.getElementById('encoded-input');
  const decodeBtn = document.getElementById('decode-btn');
  const decodedResult = document.getElementById('decoded-result');
  const copyDecodedBtn = document.getElementById('copy-decoded');
  const clearDecodeBtn = document.getElementById('clear-decode');

  // Tab functionality
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = `${button.dataset.tab}-tab`;
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Encode URL functionality
  encodeBtn.addEventListener('click', () => {
    const inputUrl = urlInput.value.trim();
    if (!inputUrl) {
      showToast('Please enter a URL to encode');
      return;
    }

    try {
      encodedResult.value = encodeURL(inputUrl);
    } catch (error) {
      showToast('Error encoding URL: ' + error.message);
    }
  });

  // Decode URL functionality
  decodeBtn.addEventListener('click', () => {
    const inputUrl = encodedInput.value.trim();
    if (!inputUrl) {
      showToast('Please enter a URL to decode');
      return;
    }

    try {
      decodedResult.value = decodeURL(inputUrl);
    } catch (error) {
      showToast('Error decoding URL: ' + error.message);
    }
  });

  // Copy functionality
  copyEncodedBtn.addEventListener('click', () => copyToClipboard(encodedResult));
  copyDecodedBtn.addEventListener('click', () => copyToClipboard(decodedResult));

  // Clear functionality
  clearEncodeBtn.addEventListener('click', () => {
    urlInput.value = '';
    encodedResult.value = '';
    urlInput.focus();
  });

  clearDecodeBtn.addEventListener('click', () => {
    encodedInput.value = '';
    decodedResult.value = '';
    encodedInput.focus();
  });

  // URL Processing Functions
  function encodeURL(url) {
    // Split the URL into components to handle them separately
    try {
      // For simple encoding without breaking the URL structure
      return encodeURIComponent(url);
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  function decodeURL(encodedUrl) {
    try {
      return decodeURIComponent(encodedUrl);
    } catch (error) {
      throw new Error('Invalid encoded URL format');
    }
  }

  // Utility Functions
  function copyToClipboard(element) {
    if (!element.value) {
      showToast('Nothing to copy');
      return;
    }

    element.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();

    showToast('Copied to clipboard!');
  }

  function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create and show new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
