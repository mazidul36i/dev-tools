import { toast } from 'sonner';

/**
 * Triggers a file download from in-memory content.
 * @param {string} content - File content
 * @param {string} filename - Download filename
 * @param {string} [mimeType='text/plain'] - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Downloaded!');
}

