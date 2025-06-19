// Encoder Decoder Tool

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const inputText = document.getElementById('input-text');
  const outputText = document.getElementById('output-text');
  const encodeButton = document.getElementById('encode-button');
  const decodeButton = document.getElementById('decode-button');
  const swapButton = document.getElementById('swap-button');
  const clearButton = document.getElementById('clear-input');
  const pasteButton = document.getElementById('paste-input');
  const copyButton = document.getElementById('copy-output');
  const downloadButton = document.getElementById('download-output');
  const modeButtons = document.querySelectorAll('.tab-button');

  // Options Elements
  const base64Options = document.getElementById('base64-options');
  const urlOptions = document.getElementById('url-options');
  const hexOptions = document.getElementById('hex-options');

  // Base64 specific options
  const base64UrlSafe = document.getElementById('base64-url-safe');
  const base64NoPadding = document.getElementById('base64-no-padding');

  // URL specific options
  const urlComponent = document.getElementById('url-component');

  // Hex specific options
  const hexUppercase = document.getElementById('hex-uppercase');
  const hexWithPrefix = document.getElementById('hex-with-prefix');

  // Current encoding mode
  let currentMode = 'base64';

  // Function to show toast notification
  function showToast(message, isError = false) {
    // Create toast element if it doesn't exist
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show');

    // Apply error styling if needed
    if (isError) {
      toast.style.backgroundColor = '#ff5252';
    } else {
      toast.style.backgroundColor = '';
    }

    // Hide toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Set active encoding mode
  function setActiveMode(mode) {
    currentMode = mode;

    // Update UI
    modeButtons.forEach(button => {
      if (button.dataset.mode === mode) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });

    // Show/hide appropriate options
    const allOptionGroups = [base64Options, urlOptions, hexOptions];
    allOptionGroups.forEach(group => group.classList.add('hidden'));

    // Show the relevant options group
    switch(mode) {
      case 'base64':
        base64Options.classList.remove('hidden');
        break;
      case 'url':
        urlOptions.classList.remove('hidden');
        break;
      case 'hex':
        hexOptions.classList.remove('hidden');
        break;
    }
  }

  // Encoding functions
  function encodeText() {
    const text = inputText.value;
    if (!text) {
      showToast('Please enter some text to encode', true);
      return;
    }

    try {
      let result = '';

      switch(currentMode) {
        case 'base64':
          result = encodeBase64(text);
          break;
        case 'url':
          result = encodeURL(text);
          break;
        case 'html':
          result = encodeHTML(text);
          break;
        case 'hex':
          result = encodeHex(text);
          break;
      }

      outputText.value = result;
    } catch (error) {
      showToast(`Error encoding: ${error.message}`, true);
    }
  }

  // Decoding functions
  function decodeText() {
    const text = inputText.value;
    if (!text) {
      showToast('Please enter some text to decode', true);
      return;
    }

    try {
      let result = '';

      switch(currentMode) {
        case 'base64':
          result = decodeBase64(text);
          break;
        case 'url':
          result = decodeURL(text);
          break;
        case 'html':
          result = decodeHTML(text);
          break;
        case 'hex':
          result = decodeHex(text);
          break;
      }

      outputText.value = result;
    } catch (error) {
      showToast(`Error decoding: ${error.message}`, true);
    }
  }

  // Base64 encoding/decoding
  function encodeBase64(text) {
    // Convert to Base64
    let encoded = btoa(unescape(encodeURIComponent(text)));

    // Apply options
    if (base64UrlSafe.checked) {
      encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
    }

    if (base64NoPadding.checked) {
      encoded = encoded.replace(/=+$/, '');
    }

    return encoded;
  }

  function decodeBase64(text) {
    try {
      // Prepare for decoding
      let prepared = text;

      // Handle URL-safe Base64
      if (base64UrlSafe.checked) {
        prepared = prepared.replace(/-/g, '+').replace(/_/g, '/');
      }

      // Add padding if removed
      if (base64NoPadding.checked && prepared.length % 4 !== 0) {
        const padLength = 4 - (prepared.length % 4);
        prepared += '='.repeat(padLength);
      }

      // Decode
      return decodeURIComponent(escape(atob(prepared)));
    } catch (e) {
      throw new Error('Invalid Base64 string');
    }
  }

  // URL encoding/decoding
  function encodeURL(text) {
    return urlComponent.checked ? encodeURIComponent(text) : encodeURI(text);
  }

  function decodeURL(text) {
    try {
      return urlComponent.checked ? decodeURIComponent(text) : decodeURI(text);
    } catch (e) {
      throw new Error('Invalid URL encoded string');
    }
  }

  // HTML encoding/decoding
  function encodeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function decodeHTML(text) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent;
  }

  // Hex encoding/decoding
  function encodeHex(text) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const hex = text.charCodeAt(i).toString(16);
      result += hexUppercase.checked ? hex.toUpperCase() : hex;
    }

    if (hexWithPrefix.checked) {
      result = '0x' + result;
    }

    return result;
  }

  function decodeHex(text) {
    // Remove 0x prefix if present
    let hexString = text.startsWith('0x') ? text.slice(2) : text;
    hexString = hexString.toLowerCase();

    if (hexString.length % 2 !== 0) {
      throw new Error('Invalid hex string: length must be even');
    }

    let result = '';
    for (let i = 0; i < hexString.length; i += 2) {
      const hexChar = hexString.substr(i, 2);
      // Validate hex characters
      if (!/^[0-9a-f]{2}$/i.test(hexChar)) {
        throw new Error('Invalid hex string: contains non-hex characters');
      }
      result += String.fromCharCode(parseInt(hexChar, 16));
    }

    return result;
  }

  // Utility functions
  function swapInputOutput() {
    const temp = inputText.value;
    inputText.value = outputText.value;
    outputText.value = temp;
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      inputText.value = text;
    } catch (err) {
      showToast('Unable to paste from clipboard. Check browser permissions.', true);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(outputText.value);
      showToast('Copied to clipboard!');
    } catch (err) {
      showToast('Failed to copy. Check browser permissions.', true);
    }
  }

  function downloadOutput() {
    if (!outputText.value) {
      showToast('No content to download', true);
      return;
    }

    // Create file name based on mode
    let extension = '.txt';
    switch(currentMode) {
      case 'base64': extension = '.b64'; break;
      case 'html': extension = '.html'; break;
      case 'hex': extension = '.hex'; break;
    }

    const filename = `encoded${extension}`;
    const blob = new Blob([outputText.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // Event listeners
  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      setActiveMode(button.dataset.mode);
    });
  });

  encodeButton.addEventListener('click', encodeText);
  decodeButton.addEventListener('click', decodeText);
  swapButton.addEventListener('click', swapInputOutput);
  clearButton.addEventListener('click', () => { inputText.value = ''; });
  pasteButton.addEventListener('click', pasteFromClipboard);
  copyButton.addEventListener('click', copyToClipboard);
  downloadButton.addEventListener('click', downloadOutput);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + E to encode
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      encodeText();
    }

    // Ctrl/Cmd + D to decode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      decodeText();
    }
  });

  // Initialize with Base64 mode
  setActiveMode('base64');
});
