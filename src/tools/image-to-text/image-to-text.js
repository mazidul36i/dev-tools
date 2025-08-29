// Get DOM elements
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const preview = document.getElementById("preview");
const previewSection = document.getElementById("preview-section");
const progress = document.getElementById("progress");
const status = document.getElementById("status");
const output = document.getElementById("output");
const resultSection = document.getElementById("result-section");
const copyBtn = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");
const clearBtn = document.getElementById("clear-btn");
const toast = document.getElementById("toast");

// Open file dialog on click
dropZone.addEventListener("click", () => fileInput.click());

// File input handler
fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

// Drag & Drop
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragging");
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

// Clipboard paste (Ctrl+V image)
window.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      handleFile(file);
      break;
    }
  }
});

// Process file with OCR
function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showToast("Please select a valid image file", "error");
    return;
  }

  // Show preview
  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    previewSection.style.display = "block";
  };
  reader.readAsDataURL(file);

  // Run OCR
  status.textContent = "Initializing OCR...";
  progress.style.display = "block";
  progress.value = 0;

  Tesseract.recognize(file, 'eng', {
    logger: m => {
      if (m.status === "recognizing text") {
        progress.value = m.progress;
        status.textContent = `Processing: ${(m.progress * 100).toFixed(1)}%`;
      }
    }
  }).then(({ data: { text } }) => {
    // Process the text to merge lines that belong to the same paragraph
    const processedText = processParagraphs(text);
    output.value = processedText;
    status.textContent = "✅ Text extraction complete!";
    resultSection.style.display = "block";
    progress.style.display = "none";
    
    // Scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }).catch(err => {
    console.error(err);
    status.textContent = "❌ Error reading image";
    progress.style.display = "none";
    showToast("Failed to extract text from image", "error");
  });
}

// Copy text
copyBtn.addEventListener("click", () => {
  if (!output.value) {
    showToast("No text to copy", "error");
    return;
  }

  navigator.clipboard.writeText(output.value).then(() => {
    showToast("Text copied to clipboard!");
  }).catch(err => {
    console.error(err);
    showToast("Failed to copy text", "error");
  });
});

// Download text
downloadBtn.addEventListener("click", () => {
  if (!output.value) {
    showToast("No text to download", "error");
    return;
  }

  const blob = new Blob([output.value], {type: "text/plain"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "extracted-text.txt";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Text file downloaded!");
});

// Clear everything
clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  preview.src = "";
  previewSection.style.display = "none";
  output.value = "";
  resultSection.style.display = "none";
  status.textContent = "";
  progress.style.display = "none";
  progress.value = 0;
});

// Process text to merge lines that belong to the same paragraph
function processParagraphs(text) {
  if (!text) return '';
  
  const lines = text.split('\n');
  const processedLines = [];
  let currentParagraph = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    // Skip empty lines
    if (line === '') {
      // If we have a current paragraph, add it to processed lines
      if (currentParagraph) {
        processedLines.push(currentParagraph);
        currentParagraph = '';
        // Add empty line to preserve paragraph breaks
        processedLines.push('');
      }
      continue;
    }
    
    // Check if line appears to end a sentence/paragraph
    const endsWithPunctuation = /[.!?:;]$/.test(line);
    const nextLineStartsNewSentence = nextLine && /^[A-Z]/.test(nextLine);
    const isLikelyHeader = line.length < 50 && /^[A-Z\d]/.test(line) && !endsWithPunctuation;
    const nextLineIsEmpty = nextLine === '';
    
    // Decide if this line should be merged with the next
    if (isLikelyHeader || (endsWithPunctuation && (nextLineStartsNewSentence || nextLineIsEmpty))) {
      // This line ends a paragraph or is a header
      if (currentParagraph) {
        processedLines.push(currentParagraph + ' ' + line);
        currentParagraph = '';
      } else {
        processedLines.push(line);
      }
    } else {
      // This line continues the paragraph
      currentParagraph = currentParagraph ? currentParagraph + ' ' + line : line;
    }
  }
  
  // Add any remaining paragraph
  if (currentParagraph) {
    processedLines.push(currentParagraph);
  }
  
  // Clean up multiple consecutive empty lines
  return processedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Show toast notification
function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
