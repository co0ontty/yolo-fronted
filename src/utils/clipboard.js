/**
 * Clipboard utility functions
 */

/**
 * Copy text to clipboard with fallback for older browsers
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Whether the copy succeeded
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    return success
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
    return false
  }
}