/**
 * Formats a text response by converting numbered points into Markdown headings
 * and asterisk bullet points into Markdown list items, with proper spacing.
 * @param {string} response - The text to be formatted
 * @returns {string} The formatted Markdown text
 */
function formatResponse(response) {
  // First, normalize line endings and ensure each sentence starts on a new line
  let formatted = response
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n+/g, '\n') // Remove multiple consecutive line breaks
    .trim();

  // Split the text into paragraphs
  let paragraphs = formatted.split('\n');

  // Process each paragraph
  formatted = paragraphs
    .map(paragraph => {
      // Convert numbered headings (e.g., "1. Title")
      if (/^\d+\.\s/.test(paragraph)) {
        return '\n## ' + paragraph.replace(/^\d+\.\s+/, '');
      }
      // Convert bullet points
      else if (/^\*\s/.test(paragraph)) {
        return '- ' + paragraph.replace(/^\*\s+/, '');
      }
      return paragraph;
    })
    .join('\n\n'); // Join paragraphs with double line breaks

  // Ensure proper spacing around headings and list items
  formatted = formatted
    .replace(/\n##\s/g, '\n\n## ') // Add extra line break before headings
    .replace(/\n-\s/g, '\n\n- ') // Add extra line break before list items
    .replace(/\n{3,}/g, '\n\n'); // Remove excessive line breaks

  return formatted.trim();
} 