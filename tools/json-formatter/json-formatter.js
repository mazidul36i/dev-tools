// JSON Formatter Tool JavaScript

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

  // Format tab elements
  const jsonInput = document.getElementById('json-input');
  const formatBtn = document.getElementById('format-btn');
  const formattedResult = document.getElementById('formatted-result');
  const copyFormattedBtn = document.getElementById('copy-formatted');
  const clearFormatBtn = document.getElementById('clear-format');
  const indentSelect = document.getElementById('indent-select');

  // View toggle elements
  const textViewBtn = document.getElementById('text-view-btn');
  const treeViewBtn = document.getElementById('tree-view-btn');
  const jsonTreeView = document.getElementById('json-tree-view');

  // Search elements
  const searchInput = document.getElementById('json-search');
  const searchBtn = document.getElementById('search-btn');
  const prevResultBtn = document.getElementById('prev-result');
  const nextResultBtn = document.getElementById('next-result');
  const searchResultsCount = document.getElementById('search-results-count');

  // Tree control buttons
  const expandAllBtn = document.getElementById('expand-all');
  const collapseAllBtn = document.getElementById('collapse-all');

  // Minify tab elements
  const jsonMinifyInput = document.getElementById('json-minify-input');
  const minifyBtn = document.getElementById('minify-btn');
  const minifiedResult = document.getElementById('minified-result');
  const copyMinifiedBtn = document.getElementById('copy-minified');
  const clearMinifyBtn = document.getElementById('clear-minify');

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

  // View toggle functionality
  textViewBtn.addEventListener('click', () => {
    textViewBtn.classList.add('active');
    treeViewBtn.classList.remove('active');
    formattedResult.classList.add('active-view');
    jsonTreeView.classList.remove('active-view');
  });

  treeViewBtn.addEventListener('click', () => {
    treeViewBtn.classList.add('active');
    textViewBtn.classList.remove('active');
    jsonTreeView.classList.add('active-view');
    formattedResult.classList.remove('active-view');

    // Generate tree view if it's empty and we have data
    if (jsonTreeView.children.length === 0 && formattedResult.value) {
      try {
        const jsonObj = JSON.parse(formattedResult.value);
        renderJsonTree(jsonObj);
      } catch (error) {
        showToast('Error parsing JSON: ' + error.message, true);
      }
    }
  });

  // Format JSON functionality
  formatBtn.addEventListener('click', () => {
    const inputJson = jsonInput.value.trim();
    if (!inputJson) {
      showToast('Please enter JSON to format');
      return;
    }

    try {
      const jsonObj = JSON.parse(inputJson);

      // Update the text view
      formattedResult.value = formatJSON(jsonObj);

      // Update the tree view if it's active
      if (jsonTreeView.classList.contains('active-view')) {
        renderJsonTree(jsonObj);
      }

      // Clear any search results
      clearSearchResults();

      showToast('JSON formatted successfully!');
    } catch (error) {
      showToast('Error: ' + error.message, true);
    }
  });

  // Minify JSON functionality
  minifyBtn.addEventListener('click', () => {
    const inputJson = jsonMinifyInput.value.trim();
    if (!inputJson) {
      showToast('Please enter JSON to minify');
      return;
    }

    try {
      minifiedResult.value = minifyJSON(inputJson);
      showToast('JSON minified successfully!');
    } catch (error) {
      showToast('Error: ' + error.message);
    }
  });

  // Copy functionality
  copyFormattedBtn.addEventListener('click', () => copyToClipboard(formattedResult));
  copyMinifiedBtn.addEventListener('click', () => copyToClipboard(minifiedResult));

  // Clear functionality
  clearFormatBtn.addEventListener('click', () => {
    jsonInput.value = '';
    formattedResult.value = '';
    jsonTreeView.innerHTML = '';
    jsonInput.focus();
    clearSearchResults();
  });

  clearMinifyBtn.addEventListener('click', () => {
    jsonMinifyInput.value = '';
    minifiedResult.value = '';
    jsonMinifyInput.focus();
  });

  // Search functionality
  let searchResults = [];
  let currentResultIndex = -1;

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  prevResultBtn.addEventListener('click', () => {
    if (searchResults.length > 0) {
      currentResultIndex = (currentResultIndex <= 0) ? searchResults.length - 1 : currentResultIndex - 1;
      highlightCurrentSearchResult();
    }
  });

  nextResultBtn.addEventListener('click', () => {
    if (searchResults.length > 0) {
      currentResultIndex = (currentResultIndex >= searchResults.length - 1) ? 0 : currentResultIndex + 1;
      highlightCurrentSearchResult();
    }
  });

  function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
      clearSearchResults();
      return;
    }

    // Determine which view is active and search accordingly
    if (formattedResult.classList.contains('active-view')) {
      searchInTextView(searchTerm);
    } else if (jsonTreeView.classList.contains('active-view')) {
      searchInTreeView(searchTerm);
    }
  }

  function searchInTextView(term) {
    const text = formattedResult.value;
    if (!text) return;

    // Clear previous results
    clearSearchResults();

    // Create a temporary div with the formatted text
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    const textContent = tempDiv.textContent;

    // Find all occurrences
    let startIndex = 0;
    let index;

    while ((index = textContent.toLowerCase().indexOf(term.toLowerCase(), startIndex)) > -1) {
      searchResults.push({
        start: index,
        end: index + term.length
      });
      startIndex = index + 1;
    }

    updateSearchResultsCount();

    if (searchResults.length > 0) {
      // Set up the textarea with highlights
      // Since we can't highlight in a textarea, we'll just focus and select the first result
      currentResultIndex = 0;
      const result = searchResults[0];
      formattedResult.focus();
      formattedResult.setSelectionRange(result.start, result.end);
    }
  }

  function searchInTreeView(term) {
    // Clear previous results
    clearSearchResults();

    // Get all text nodes in the tree
    const walker = document.createTreeWalker(
      jsonTreeView,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodesToHighlight = [];
    let currentNode;

    // Find text nodes containing the search term
    while (currentNode = walker.nextNode()) {
      const nodeText = currentNode.textContent;
      if (nodeText.toLowerCase().includes(term.toLowerCase())) {
        // Get the parent element to highlight
        let highlightNode = currentNode.parentElement;

        // Ensure we're highlighting a meaningful element
        while (highlightNode &&
        !highlightNode.classList.contains('tree-key') &&
        !highlightNode.classList.contains('tree-value')) {
          highlightNode = highlightNode.parentElement;
          if (highlightNode === jsonTreeView) {
            highlightNode = null;
            break;
          }
        }

        if (highlightNode) {
          nodesToHighlight.push({
            node: highlightNode,
            text: nodeText
          });

          // Expand all parent nodes
          let parent = highlightNode.closest('.tree-node');
          while (parent) {
            parent.classList.remove('collapsed');
            const expander = parent.querySelector('.tree-expander');
            if (expander) {
              expander.classList.add('expanded');
            }
            parent = parent.parentElement.closest('.tree-node');
          }
        }
      }
    }

    // Apply highlighting
    nodesToHighlight.forEach(item => {
      const {node, text} = item;
      const originalContent = node.innerHTML;
      const termRegex = new RegExp(term, 'gi');
      const highlightedContent = originalContent.replace(
        termRegex,
        match => `<span class="highlight">${match}</span>`
      );
      node.innerHTML = highlightedContent;
      searchResults.push(node);
    });

    updateSearchResultsCount();

    if (searchResults.length > 0) {
      currentResultIndex = 0;
      highlightCurrentSearchResult();
    }
  }

  function highlightCurrentSearchResult() {
    if (searchResults.length === 0) return;

    // Remove current highlight class from all results
    if (formattedResult.classList.contains('active-view')) {
      // For text view, just select the text
      const result = searchResults[currentResultIndex];
      formattedResult.focus();
      formattedResult.setSelectionRange(result.start, result.end);
    } else {
      // For tree view, scroll to and highlight the current node
      const highlights = jsonTreeView.querySelectorAll('.highlight');
      highlights.forEach(h => h.classList.remove('current'));

      const currentNode = searchResults[currentResultIndex];
      const currentHighlight = currentNode.querySelector('.highlight');
      if (currentHighlight) {
        currentHighlight.classList.add('current');
        currentHighlight.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }

    // Update the counter
    updateSearchResultsCount();
  }

  function updateSearchResultsCount() {
    if (searchResults.length === 0) {
      searchResultsCount.textContent = 'No results';
      prevResultBtn.disabled = true;
      nextResultBtn.disabled = true;
    } else {
      searchResultsCount.textContent = `${currentResultIndex + 1}/${searchResults.length}`;
      prevResultBtn.disabled = false;
      nextResultBtn.disabled = false;
    }
  }

  function clearSearchResults() {
    searchResults = [];
    currentResultIndex = -1;
    searchResultsCount.textContent = '';
    prevResultBtn.disabled = true;
    nextResultBtn.disabled = true;

    // Clear tree highlights if they exist
    const highlights = jsonTreeView.querySelectorAll('.highlight');
    highlights.forEach(h => {
      const parent = h.parentNode;
      if (parent) {
        // Replace the highlight span with its text content
        parent.replaceChild(document.createTextNode(h.textContent), h);
        // Normalize to merge adjacent text nodes
        parent.normalize();
      }
    });
  }

  // JSON Processing Functions
  function formatJSON(jsonData) {
    try {
      // If input is a string, parse it first
      const jsonObj = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // Get the selected indentation
      const indent = indentSelect.value === 'tab' ? '\t' : Number(indentSelect.value);

      // Return the formatted JSON
      return JSON.stringify(jsonObj, null, indent);
    } catch (error) {
      throw new Error('Invalid JSON format: ' + error.message);
    }
  }


  function minifyJSON(jsonString) {
    try {
      // Parse the JSON to validate it
      const jsonObj = JSON.parse(jsonString);

      // Return the minified JSON (no whitespace)
      return JSON.stringify(jsonObj);
    } catch (error) {
      throw new Error('Invalid JSON format: ' + error.message);
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

  function showToast(message, isError = false) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create and show new toast
    const toast = document.createElement('div');
    toast.className = isError ? 'toast error' : 'toast';
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

  // Render JSON as an interactive tree
  function renderJsonTree(json) {
    // Clear existing tree
    jsonTreeView.innerHTML = '';

    // Create the root list
    const rootList = document.createElement('ul');
    jsonTreeView.appendChild(rootList);

    // Generate tree based on JSON type
    if (Array.isArray(json)) {
      createArrayNode(rootList, json, null);
    } else if (typeof json === 'object' && json !== null) {
      createObjectNode(rootList, json, null);
    } else {
      // Simple value
      const valueLi = document.createElement('li');
      valueLi.className = 'tree-node';
      valueLi.appendChild(createValueElement(json));
      rootList.appendChild(valueLi);
    }
  }

  function createObjectNode(parentElement, obj, key) {
    const li = document.createElement('li');
    li.className = 'tree-node';

    // Create key-value container
    const container = document.createElement('div');

    // Add expand/collapse control if object has properties
    const objKeys = Object.keys(obj);
    if (objKeys.length > 0) {
      const expander = document.createElement('span');
      expander.className = 'tree-expander expanded';
      expander.textContent = '▶';
      expander.addEventListener('click', toggleNode);
      container.appendChild(expander);
    }

    // Add key if this is a property of a parent object
    if (key !== null) {
      const keyElement = document.createElement('span');
      keyElement.className = 'tree-key';
      keyElement.textContent = `"${key}"`;
      keyElement.addEventListener('click', toggleNode);
      container.appendChild(keyElement);

      const colon = document.createElement('span');
      colon.className = 'tree-colon';
      colon.textContent = ':';
      container.appendChild(colon);
    }

    // Opening bracket
    const openBracket = document.createElement('span');
    openBracket.className = 'tree-bracket';
    openBracket.textContent = '{';
    openBracket.addEventListener('click', toggleNode);
    container.appendChild(openBracket);

    // Add ellipsis for collapsed view
    if (objKeys.length > 0) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'tree-ellipsis';
      ellipsis.textContent = '...';
      container.appendChild(ellipsis);
    }

    // Closing bracket
    const closeBracket = document.createElement('span');
    closeBracket.className = 'tree-bracket';
    closeBracket.textContent = '}';
    container.appendChild(closeBracket);

    li.appendChild(container);

    // Create child list for properties
    if (objKeys.length > 0) {
      const childList = document.createElement('ul');
      childList.className = 'tree-children';

      objKeys.forEach(propKey => {
        const value = obj[propKey];

        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            createArrayNode(childList, value, propKey);
          } else {
            createObjectNode(childList, value, propKey);
          }
        } else {
          // Simple value property
          const propLi = document.createElement('li');
          propLi.className = 'tree-node';

          const propContainer = document.createElement('div');

          const keySpan = document.createElement('span');
          keySpan.className = 'tree-key';
          keySpan.textContent = `"${propKey}"`;
          propContainer.appendChild(keySpan);

          const colon = document.createElement('span');
          colon.className = 'tree-colon';
          colon.textContent = ':';
          propContainer.appendChild(colon);

          propContainer.appendChild(createValueElement(value));
          propLi.appendChild(propContainer);
          childList.appendChild(propLi);
        }
      });

      li.appendChild(childList);
    }

    parentElement.appendChild(li);
  }

  function createArrayNode(parentElement, arr, key) {
    const li = document.createElement('li');
    li.className = 'tree-node';

    // Create array container
    const container = document.createElement('div');

    // Add expand/collapse control if array has items
    if (arr.length > 0) {
      const expander = document.createElement('span');
      expander.className = 'tree-expander expanded';
      expander.textContent = '▶';
      expander.addEventListener('click', toggleNode);
      container.appendChild(expander);
    }

    // Add key if this is a property of a parent object
    if (key !== null) {
      const keyElement = document.createElement('span');
      keyElement.className = 'tree-key';
      keyElement.textContent = `"${key}"`;
      keyElement.addEventListener('click', toggleNode);
      container.appendChild(keyElement);

      const colon = document.createElement('span');
      colon.className = 'tree-colon';
      colon.textContent = ':';
      container.appendChild(colon);
    }

    // Opening bracket
    const openBracket = document.createElement('span');
    openBracket.className = 'tree-bracket';
    openBracket.textContent = '[';
    openBracket.addEventListener('click', toggleNode);
    container.appendChild(openBracket);

    // Add ellipsis for collapsed view
    if (arr.length > 0) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'tree-ellipsis';
      ellipsis.textContent = '...';
      container.appendChild(ellipsis);
    }

    // Closing bracket
    const closeBracket = document.createElement('span');
    closeBracket.className = 'tree-bracket';
    closeBracket.textContent = ']';
    container.appendChild(closeBracket);

    li.appendChild(container);

    // Create child list for array items
    if (arr.length > 0) {
      const childList = document.createElement('ul');
      childList.className = 'tree-children';

      arr.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          if (Array.isArray(item)) {
            createArrayNode(childList, item, index);
          } else {
            createObjectNode(childList, item, index);
          }
        } else {
          // Simple value
          const itemLi = document.createElement('li');
          itemLi.className = 'tree-node';

          const itemContainer = document.createElement('div');

          const indexSpan = document.createElement('span');
          indexSpan.className = 'tree-key';
          indexSpan.textContent = index;
          itemContainer.appendChild(indexSpan);

          const colon = document.createElement('span');
          colon.className = 'tree-colon';
          colon.textContent = ':';
          itemContainer.appendChild(colon);

          itemContainer.appendChild(createValueElement(item));
          itemLi.appendChild(itemContainer);
          childList.appendChild(itemLi);
        }
      });

      li.appendChild(childList);
    }

    parentElement.appendChild(li);
  }

  function createValueElement(value) {
    const valueEl = document.createElement('span');

    if (typeof value === 'string') {
      valueEl.className = 'tree-value tree-string';
      valueEl.textContent = `"${value}"`;
    } else if (typeof value === 'number') {
      valueEl.className = 'tree-value tree-number';
      valueEl.textContent = value;
    } else if (typeof value === 'boolean') {
      valueEl.className = 'tree-value tree-boolean';
      valueEl.textContent = value;
    } else if (value === null) {
      valueEl.className = 'tree-value tree-null';
      valueEl.textContent = 'null';
    } else {
      valueEl.className = 'tree-value';
      valueEl.textContent = value;
    }

    return valueEl;
  }

  function toggleNode(e) {
    // Find the li element
    let node = e.target;
    while (node && !node.classList.contains('tree-node')) {
      node = node.parentElement;
    }

    if (node) {
      // Toggle collapsed class
      node.classList.toggle('collapsed');

      // Update expander icon if it exists
      const expander = node.querySelector('.tree-expander');
      if (expander) {
        expander.classList.toggle('expanded');
      }
    }
  }

  // Expand/Collapse all functionality
  expandAllBtn.addEventListener('click', () => {
    const nodes = jsonTreeView.querySelectorAll('.tree-node');
    nodes.forEach(node => {
      node.classList.remove('collapsed');
      const expander = node.querySelector('.tree-expander');
      if (expander) {
        expander.classList.add('expanded');
      }
    });
  });

  collapseAllBtn.addEventListener('click', () => {
    const nodes = jsonTreeView.querySelectorAll('.tree-node');
    nodes.forEach(node => {
      // Don't collapse the root node
      if (node.parentElement !== jsonTreeView.firstChild) {
        node.classList.add('collapsed');
        const expander = node.querySelector('.tree-expander');
        if (expander) {
          expander.classList.remove('expanded');
        }
      }
    });
  });
});
