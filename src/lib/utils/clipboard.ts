'use client';

/**
 * Safely copies text to clipboard with fallback for environments where clipboard API is not available
 * @param text The text to copy to clipboard
 * @returns Promise that resolves when copy is successful, rejects on failure
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Check if navigator.clipboard is available
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (clipboardError) {
      console.warn('Clipboard API failed, trying fallback:', clipboardError);
      // Fall through to try alternative methods
    }
  }

  // Fallback for edge cases where clipboard API is not available
  // This creates a temporary textarea element to copy text
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Avoid scrolling to bottom
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    // Execute copy command
    const success = document.execCommand('copy'); // execCommand is DEPREACATED. Browsers may remove support anytime.
    document.body.removeChild(textarea);
    
    if (!success) {
      throw new Error('Fallback \'execCommand\' copy method failed');
    }
  } catch (fallbackError) {
    console.error('All copy methods failed:', fallbackError);
    throw new Error('Failed to copy text to clipboard');
  }
}

// /**
//  * Checks if clipboard API is available
//  * @returns boolean indicating if clipboard API is available
//  */
// export function isClipboardAvailable(): boolean {
//   return navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
// }