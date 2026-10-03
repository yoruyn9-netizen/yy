/**
 * Robust clipboard utility with multiple fallback layers.
 * Handles iframe security restrictions, document focus states, and browser permissions.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Layer 1: Modern navigator.clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', err);
    }
  }

  // Layer 2: Legacy textarea + document.execCommand('copy') fallback
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-99999px';
    textarea.style.top = '-99999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    
    // Select the content
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (fallbackErr) {
    console.error('execCommand copy fallback failed:', fallbackErr);
    return false;
  }
}
