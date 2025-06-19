// Color Picker Tool JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Back navigation
  const backLink = document.querySelector('.back-link a');
  if (backLink) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/';
    });
  }

  // Color input elements
  const hexInput = document.getElementById('hex-input');
  const rgbRInput = document.getElementById('rgb-r');
  const rgbGInput = document.getElementById('rgb-g');
  const rgbBInput = document.getElementById('rgb-b');
  const hslHInput = document.getElementById('hsl-h');
  const hslSInput = document.getElementById('hsl-s');
  const hslLInput = document.getElementById('hsl-l');

  // Color display elements
  const pickerPreviewColor = document.getElementById('picker-preview-color');
  const pickerHexValue = document.getElementById('picker-hex-value');
  const pickerRgbValue = document.getElementById('picker-rgb-value');
  const pickerHslValue = document.getElementById('picker-hsl-value');

  // Button elements
  const copyHexBtn = document.getElementById('copy-hex');
  const copyRgbBtn = document.getElementById('copy-rgb');
  const copyHslBtn = document.getElementById('copy-hsl');
  const randomColorBtn = document.getElementById('random-color');
  const clearColorBtn = document.getElementById('clear-color');
  const addToPaletteBtn = document.getElementById('add-to-palette');

  // Color picker elements
  const colorGradient = document.getElementById('color-gradient');
  const hueSlider = document.getElementById('hue-slider');

  // Palette tab elements
  const colorPalette = document.getElementById('color-palette');
  const newPaletteBtn = document.getElementById('new-palette');
  const exportPaletteBtn = document.getElementById('export-palette');
  const clearPaletteBtn = document.getElementById('clear-palette');
  const paletteExport = document.getElementById('palette-export');
  const exportFormatBtns = document.querySelectorAll('.export-options button');
  const exportCode = document.getElementById('export-code');
  const copyExportBtn = document.getElementById('copy-export');

  // State
  let currentColor = { r: 255, g: 255, b: 255 };
  let pickerColor = { h: 0, s: 100, l: 50 };
  let colorPaletteList = [];
  let currentExportFormat = 'css';
  let isDragging = false;
  // Create single persistent color picker cursor
  let pickerCursor = null;

  // Initialize palette export
  exportPaletteBtn.addEventListener('click', () => {
    updatePaletteExport();
  });

  // Function declarations first, then we'll initialize the color display

  // Color Conversion Functions
  function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex
    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
      g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
      b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }

    // Check if valid numbers
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      throw new Error('Invalid HEX color format');
    }

    return { r, g, b };
  }

  function rgbToHex(r, g, b) {
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));

    return '#' +
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0');
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }

      h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return { h, s, l };
  }

  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  function initializeColorPicker() {
    // Create the cursor once if it doesn't exist
    if (!pickerCursor) {
      pickerCursor = document.createElement('div');
      pickerCursor.className = 'color-picker';
      colorGradient.appendChild(pickerCursor);
    }
  }

  // Update all displays with color values
  function updateColorDisplay(rgb, isRandom = false) {
    currentColor = rgb;
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Update input fields
    hexInput.value = hex;
    rgbRInput.value = rgb.r;
    rgbGInput.value = rgb.g;
    rgbBInput.value = rgb.b;
    hslHInput.value = hsl.h;
    hslSInput.value = hsl.s;
    hslLInput.value = hsl.l;

    // Update color preview and values
    pickerPreviewColor.style.backgroundColor = hex;
    pickerHexValue.textContent = hex;
    pickerRgbValue.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    pickerHslValue.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

    // Update hue slider if needed
    hueSlider.value = hsl.h;
    // Set the gradient background color to match current hue
    colorGradient.style.setProperty('background', `linear-gradient(to top, black, transparent 50%, white),
                          linear-gradient(to right, white, hsl(${hsl.h}, 100%, 50%))`);

    // Color the cursor with the current color
    if (pickerCursor) {
      pickerCursor.style.backgroundColor = hex;
    }

    // Initialize picker cursor if needed
    initializeColorPicker();

    // Add animation class if random color
    if (isRandom) {
      pickerCursor.classList.remove('random');
      // Force reflow to restart animation
      void pickerCursor.offsetWidth;
      pickerCursor.classList.add('random');
    }

    // Position cursor based on saturation and lightness
    const saturationPercent = hsl.s;
    const lightnessPercent = hsl.l;
    pickerCursor.style.left = `${saturationPercent}%`;
    pickerCursor.style.top = `${100 - lightnessPercent}%`;

    // Update pickerColor state
    pickerColor = hsl;
  }

  // Update picker display from HSL values
  function updatePickerDisplay(hsl) {
    pickerColor = hsl;
    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);

    // Use the main update function to keep everything in sync
    updateColorDisplay(rgb);

    // Update color gradient background with current hue
    colorGradient.style.backgroundColor = `hsl(${hsl.h}, 100%, 50%)`;
  }

  // Generate random color
  function generateRandomColor() {
    // Generate more visually pleasing colors by using HSL
    const h = Math.floor(Math.random() * 360);  // Random hue
    const s = Math.floor(Math.random() * 40) + 60;  // Saturation between 60-100%
    const l = Math.floor(Math.random() * 40) + 30;  // Lightness between 30-70%

    const rgb = hslToRgb(h, s, l);
    updateColorDisplay(rgb, true); // Pass true to indicate random color for animation
    showToast('Random color generated!');
  }

  // Event Listeners for Convert tab
  hexInput.addEventListener('input', function() {
    try {
      // Ensure # is present
      let hex = this.value;
      if (!hex.startsWith('#')) {
        hex = '#' + hex;
      }

      // Only process if we have at least 4 chars (#RGB or beginning of #RRGGBB)
      if (hex.length >= 4) {
        const rgb = hexToRgb(hex);
        updateColorDisplay(rgb);
      }
    } catch (error) {
      // Invalid input, don't update
    }
  });

  // RGB inputs
  function handleRgbInput() {
    const r = parseInt(rgbRInput.value) || 0;
    const g = parseInt(rgbGInput.value) || 0;
    const b = parseInt(rgbBInput.value) || 0;

    updateColorDisplay({ r, g, b });
  }

  rgbRInput.addEventListener('input', handleRgbInput);
  rgbGInput.addEventListener('input', handleRgbInput);
  rgbBInput.addEventListener('input', handleRgbInput);

  // HSL inputs
  function handleHslInput() {
    const h = parseInt(hslHInput.value) || 0;
    const s = parseInt(hslSInput.value) || 0;
    const l = parseInt(hslLInput.value) || 0;

    const rgb = hslToRgb(h, s, l);
    updateColorDisplay(rgb);
  }

  hslHInput.addEventListener('input', handleHslInput);
  hslSInput.addEventListener('input', handleHslInput);
  hslLInput.addEventListener('input', handleHslInput);

  // Button events
  randomColorBtn.addEventListener('click', generateRandomColor);

  clearColorBtn.addEventListener('click', () => {
    updateColorDisplay({ r: 255, g: 255, b: 255 });
  });

  // Copy buttons
  copyHexBtn.addEventListener('click', () => {
    copyToClipboard(hexInput.value);
  });

  copyRgbBtn.addEventListener('click', () => {
    copyToClipboard(`rgb(${rgbRInput.value}, ${rgbGInput.value}, ${rgbBInput.value})`);
  });

  copyHslBtn.addEventListener('click', () => {
    copyToClipboard(`hsl(${hslHInput.value}, ${hslSInput.value}%, ${hslLInput.value}%)`);
  });

  // Color Picker Functionality
  hueSlider.addEventListener('input', function() {
    const hue = parseInt(this.value);
    updatePickerDisplay({ ...pickerColor, h: hue });
  });

  // Color gradient selection
  colorGradient.addEventListener('mousedown', function(e) {
    isDragging = true;
    handleColorGradientSelection(e);
  });

  document.addEventListener('mousemove', function(e) {
    if (isDragging) {
      handleColorGradientSelection(e);
    }
  });

  document.addEventListener('mouseup', function() {
    isDragging = false;
  });

  function handleColorGradientSelection(e) {
    if (!colorGradient.contains(e.target) && e.target !== colorGradient) return;

    const rect = colorGradient.getBoundingClientRect();

    // Use clientX/clientY for accurate position
    let x = (e.clientX - rect.left) / rect.width;
    let y = 1 - (e.clientY - rect.top) / rect.height;

    // Clamp values between 0 and 1
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    // x = saturation (0-100%), y = lightness (0-100%)
    const s = Math.round(x * 100);
    const l = Math.round(y * 100);

    // Update the HSL values and redraw
    updatePickerDisplay({ ...pickerColor, h: pickerColor.h, s, l });
  }

  // Add color to palette
  addToPaletteBtn.addEventListener('click', function() {
    const rgb = hslToRgb(pickerColor.h, pickerColor.s, pickerColor.l);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);

    addColorToPalette(hex);
    showToast(`Color ${hex} saved to palette`);
  });

  // Palette functionality
  function addColorToPalette(hex) {
    // Don't add duplicates
    if (colorPaletteList.includes(hex)) {
      return;
    }

    colorPaletteList.push(hex);
    renderPalette();
    savePalette();
  }

  function renderPalette() {
    // Clear the empty message if we have colors
    if (colorPaletteList.length > 0) {
      colorPalette.innerHTML = '';
    } else {
      colorPalette.innerHTML = '<div class="empty-palette-message">Your palette is empty. Add colors from the Color Picker tab.</div>';
      return;
    }

    // Render each color
    colorPaletteList.forEach((hex, index) => {
      const colorElement = document.createElement('div');
      colorElement.className = 'palette-color';

      const colorBox = document.createElement('div');
      colorBox.className = 'palette-color-box';
      colorBox.style.backgroundColor = hex;
      colorBox.setAttribute('data-color', hex);
      colorBox.setAttribute('data-index', index);

      // Add click handler to select color
      colorBox.addEventListener('click', function() {
        const rgb = hexToRgb(hex);
        updateColorDisplay(rgb);

        // Switch to convert tab
        tabButtons[0].click();
      });

      // Add double-click handler to remove color
      colorBox.addEventListener('dblclick', function() {
        removeColorFromPalette(index);
      });

      // Add tooltip for double-click functionality
      colorBox.setAttribute('title', 'Click to use this color, double-click to remove');

      const colorValue = document.createElement('div');
      colorValue.className = 'palette-color-value';
      colorValue.textContent = hex;

      colorElement.appendChild(colorBox);
      colorElement.appendChild(colorValue);
      colorPalette.appendChild(colorElement);
    });
  }

  function removeColorFromPalette(index) {
    colorPaletteList.splice(index, 1);
    renderPalette();
    savePalette();
    showToast('Color removed from palette');
  }

  // Palette export functionality
  exportFormatBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      exportFormatBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentExportFormat = this.dataset.format;
      updatePaletteExport();
    });
  });

  function updatePaletteExport() {
    if (colorPaletteList.length === 0) {
      paletteExport.style.display = 'none';
      return;
    }

    paletteExport.style.display = 'block';

    let code = '';
    switch (currentExportFormat) {
      case 'css':
        code = ':root {\n';
        colorPaletteList.forEach((hex, index) => {
          code += `  --color-${index + 1}: ${hex};\n`;
        });
        code += '}';
        break;

      case 'scss':
        colorPaletteList.forEach((hex, index) => {
          code += `$color-${index + 1}: ${hex};\n`;
        });
        break;

      case 'json':
        const palette = {};
        colorPaletteList.forEach((hex, index) => {
          palette[`color${index + 1}`] = hex;
        });
        code = JSON.stringify(palette, null, 2);
        break;
    }

    exportCode.value = code;
  }

  // Palette action buttons
  newPaletteBtn.addEventListener('click', function() {
    // Generate 5 colors with nice variety
    colorPaletteList = [];

    // Generate colors based on color theory (complementary, analogous, etc)
    const baseHue = Math.floor(Math.random() * 360);
    const baseSaturation = 70 + Math.floor(Math.random() * 30); // 70-100%
    const baseLightness = 45 + Math.floor(Math.random() * 15); // 45-60%

    // Base color
    const baseRgb = hslToRgb(baseHue, baseSaturation, baseLightness);
    colorPaletteList.push(rgbToHex(baseRgb.r, baseRgb.g, baseRgb.b));

    // Complementary (opposite on color wheel)
    const complementaryHue = (baseHue + 180) % 360;
    const complementaryRgb = hslToRgb(complementaryHue, baseSaturation, baseLightness);
    colorPaletteList.push(rgbToHex(complementaryRgb.r, complementaryRgb.g, complementaryRgb.b));

    // Analogous colors (next to each other on color wheel)
    const analogous1Hue = (baseHue + 30) % 360;
    const analogous1Rgb = hslToRgb(analogous1Hue, baseSaturation, baseLightness);
    colorPaletteList.push(rgbToHex(analogous1Rgb.r, analogous1Rgb.g, analogous1Rgb.b));

    const analogous2Hue = (baseHue - 30 + 360) % 360;
    const analogous2Rgb = hslToRgb(analogous2Hue, baseSaturation, baseLightness);
    colorPaletteList.push(rgbToHex(analogous2Rgb.r, analogous2Rgb.g, analogous2Rgb.b));

    // Monochromatic (same hue, different lightness)
    const monoRgb = hslToRgb(baseHue, baseSaturation, baseLightness - 30);
    colorPaletteList.push(rgbToHex(monoRgb.r, monoRgb.g, monoRgb.b));

    renderPalette();
    savePalette();
    updatePaletteExport();
    showToast('New palette generated');
  });

  exportPaletteBtn.addEventListener('click', function() {
    if (colorPaletteList.length === 0) {
      showToast('Palette is empty');
      return;
    }

    updatePaletteExport();
  });

  clearPaletteBtn.addEventListener('click', function() {
    if (colorPaletteList.length === 0) {
      showToast('Palette is already empty');
      return;
    }

    colorPaletteList = [];
    renderPalette();
    savePalette();
    paletteExport.style.display = 'none';
    showToast('Palette cleared');
  });

  copyExportBtn.addEventListener('click', function() {
    copyToClipboard(exportCode.value);
  });

  // Load palette from local storage
  function loadPalette() {
    const savedPalette = localStorage.getItem('colorPalette');
    if (savedPalette) {
      try {
        colorPaletteList = JSON.parse(savedPalette);
        renderPalette();
      } catch (e) {
        console.error('Failed to load palette:', e);
        colorPaletteList = [];
      }
    }
  }

  function savePalette() {
    localStorage.setItem('colorPalette', JSON.stringify(colorPaletteList));
  }

  // Utility Functions
  function copyToClipboard(text) {
    if (!text) {
      showToast('Nothing to copy');
      return;
    }

    navigator.clipboard.writeText(text)
      .then(() => {
        showToast('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy to clipboard');
      });
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

  // Initialize
  loadPalette();

  // First create the cursor
  initializeColorPicker();

  // Then initialize the display (after cursor is created)
  updatePickerDisplay({ h: 0, s: 100, l: 50 });

  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Only handle keystrokes when not typing in an input
    if (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key.toLowerCase()) {
      case 'r':
        generateRandomColor();
        break;
      case 's':
        addToPaletteBtn.click();
        break;
      case 'c':
        copyHexBtn.click();
        break;
      case 'w':
        clearColorBtn.click();
        break;
    }
  });

  // The display is already initialized above, no need to do it again
});
