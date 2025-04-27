import { extractTextFromFile } from './file-processing';
import { getAttachment } from './services/attachment-service';
import { isDocumentContent } from './utils';
import { Note } from '@/types/note';

/**
 * Clean up extracted document text to improve AI processing
 * This removes common extraction artifacts, page numbers, headers/footers, etc.
 * 
 * @param text - The extracted text to clean
 * @returns Cleaned text
 */
export function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  // Remove common PDF extraction artifacts
  let cleaned = text
    // Remove page numbers (various formats)
    .replace(/\n\s*\d+\s*\n/g, '\n\n')
    .replace(/\n\s*Page \d+ of \d+\s*\n/gi, '\n\n')
    .replace(/\n\s*-\s*\d+\s*-\s*\n/g, '\n\n')
    
    // Remove common headers/footers
    .replace(/\n\s*confidential\s*\n/gi, '\n\n')
    .replace(/\n\s*private and confidential\s*\n/gi, '\n\n')
    .replace(/\n\s*all rights reserved\s*\n/gi, '\n\n')
    .replace(/\n\s*copyright ©.*\n/gi, '\n\n')
    
    // Fix OCR/PDF extraction spacing issues
    .replace(/([a-z])\s+([a-z])/g, '$1 $2')
    .replace(/([a-z])\.([A-Z])/g, '$1. $2')
    .replace(/\n{3,}/g, '\n\n');  // Normalize multiple newlines
  
  // Remove OCR metadata blocks that might be added
  if (cleaned.includes('OCR completed') || cleaned.includes('PDF extraction')) {
    cleaned = cleaned.replace(/\[.*?extraction completed.*?\]/gi, '');
  }
  
  return cleaned.trim();
}

/**
 * Extract content from a note, handling document/attachment content if needed
 * This is used to get the actual text content from notes that contain document references
 * 
 * @param note - The note to extract content from
 * @returns The extracted content as text
 */
export async function extractNoteContent(note: Note): Promise<string> {
  // If the note doesn't have attachment or doesn't look like a document, return content as is
  if (!note.attachmentId && !isDocumentContent(note.content)) {
    return note.content;
  }

  // If the note has an attachment, try to get the attachment content
  if (note.attachmentId) {
    try {
      // Fetch the attachment
      const attachment = await getAttachment(note.attachmentId);
      
      // If attachment is session-only or has no data, return message and use content as fallback
      if (!attachment.data || (attachment as any)._sessionOnly) {
        console.warn('Could not retrieve attachment data for note:', note.id);
        return `[Could not extract attachment content] \n\n${note.content}`;
      }
      
      try {
        // Convert attachment data to File object for processing
        const file = new File(
          [attachment.data], 
          attachment.filename, 
          { type: attachment.fileType }
        );
        
        // Extract text from the file
        let extractedText = await extractTextFromFile(file);
        
        // Clean up the extracted text
        if (extractedText && extractedText.trim().length > 0) {
          extractedText = cleanExtractedText(extractedText);
          return extractedText;
        } else {
          // If extraction returned empty content, return a message with original content
          return `[Document content extraction failed - no text found] \n\n${note.content}`;
        }
      } catch (extractionError) {
        console.error('Error extracting text from attachment:', extractionError);
        // Return a message with the original content
        return `[Document content extraction error: ${extractionError.message}] \n\n${note.content}`;
      }
    } catch (attachmentError) {
      console.error('Error retrieving attachment:', attachmentError);
      // Return a message with the original content
      return `[Error accessing attachment: ${attachmentError.message}] \n\n${note.content}`;
    }
  }
  
  // For document-like content without attachmentId, 
  // just return the note content (which might be a document description)
  return note.content;
} 