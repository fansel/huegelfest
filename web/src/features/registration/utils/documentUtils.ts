/**
 * Utility functions for document template processing
 */

export interface PlaceholderData {
  public_notes?: string;
  terms?: string;
  iban?: string;
  bic?: string;
  bank_name?: string;
  account_holder?: string;
  [key: string]: string | undefined;
}

/**
 * Replaces placeholders in document content with actual values
 * @param content - The content containing placeholders like $public_notes, $terms
 * @param data - The data to replace placeholders with
 * @returns The content with placeholders replaced
 */
export function replacePlaceholders(content: string, data: PlaceholderData): string {
  let result = content;
  
  // Replace each placeholder with corresponding data
  Object.keys(data).forEach(key => {
    const placeholder = `$${key}`;
    const value = data[key] || '';
    
    // Replace all occurrences of the placeholder
    result = result.replace(new RegExp(`\\${placeholder}`, 'g'), value);
  });
  
  return result;
}

/**
 * Processes document HTML and replaces div placeholders with content
 * @param html - HTML content containing placeholder divs
 * @param data - The data to replace placeholders with
 * @returns Processed HTML with placeholders replaced
 */
export function processDocumentTemplate(html: string, data: PlaceholderData): string {
  let result = html;
  
  // Replace div id="terms" with terms content
  if (data.terms) {
    const termsRegex = /<div\s+id="terms"[^>]*>\$terms<\/div>/gi;
    const termsContent = `<div id="terms" class="document-section">
      <h3 class="section-title">Geschäftsbedingungen</h3>
      <div class="section-content">${data.terms}</div>
    </div>`;
    result = result.replace(termsRegex, termsContent);
  }
  
  // Replace div id="public-notes" with public notes content  
  if (data.public_notes) {
    const notesRegex = /<div\s+id="public-notes"[^>]*>\$public_notes<\/div>/gi;
    const notesContent = `<div id="public-notes" class="document-section">
      <h3 class="section-title">Öffentliche Hinweise</h3>
      <div class="section-content">${data.public_notes}</div>
    </div>`;
    result = result.replace(notesRegex, notesContent);
  }
  
  return result;
}

/**
 * Formats IBAN with proper spacing for readability
 * @param iban - The IBAN to format
 * @returns Formatted IBAN with spaces every 4 characters
 */
export function formatIban(iban: string): string {
  // Remove all spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  // Add spaces every 4 characters for readability
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
}