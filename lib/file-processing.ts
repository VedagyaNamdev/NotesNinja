import { extractTextFromImage } from './ocr';
import { extractTextFromPdf } from './pdf';

/**
 * Extracts text from various file types
 * @param file - The file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  
  try {
    if (fileType.startsWith('image/')) {
      // Process image files with OCR
      return await extractTextFromImage(file);
    } else if (fileType === 'application/pdf') {
      // Process PDF files
      return await extractTextFromPdf(file);
    } else if (fileType === 'text/plain') {
      // Process text files
      return await readTextFile(file);
    } else if (fileType.includes('word') || 
              fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              fileType === 'application/msword') {
      // For Word documents, we'll just inform that they're not directly supported
      // In a production app, you'd add a Word document parser library
      throw new Error('Word documents cannot be processed directly. Please export as PDF or text file.');
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
}

/**
 * Reads a text file and returns its contents
 * @param file - The text file to read
 * @returns A promise that resolves to the file contents
 */
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
} 