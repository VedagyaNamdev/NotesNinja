import { extractTextFromImage } from './ocr';
import { extractTextFromPdf } from './pdf';

/**
 * Extracts text from various file types
 * @param file - The file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name;
  
  console.log(`Processing file: ${fileName} (${fileType})`);
  
  try {
    if (fileType.startsWith('image/')) {
      // Process image files with OCR
      console.log(`Starting OCR for image: ${fileName}`);
      const text = await extractTextFromImage(file);
      console.log(`OCR completed for: ${fileName}`);
      return text;
    } else if (fileType === 'application/pdf') {
      // Process PDF files
      console.log(`Starting PDF extraction for: ${fileName}`);
      const text = await extractTextFromPdf(file);
      console.log(`PDF extraction completed for: ${fileName}`);
      return text;
    } else if (fileType === 'text/plain') {
      // Process text files
      console.log(`Reading text file: ${fileName}`);
      return await readTextFile(file);
    } else if (fileType.includes('word') || 
              fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              fileType === 'application/msword') {
      // For Word documents, we'll just inform that they're not directly supported
      // In a production app, you'd add a Word document parser library
      throw new Error('Word documents cannot be processed directly. Please export as PDF or text file.');
    } else {
      // If filetype is empty but filename has image extension, try to process as image
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      if (!fileType && imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) {
        console.log(`File type not detected but has image extension. Trying OCR for: ${fileName}`);
        const text = await extractTextFromImage(file);
        console.log(`OCR completed for: ${fileName}`);
        return text;
      }
      
      throw new Error(`Unsupported file type: ${fileType || 'Unknown'} for file ${fileName}`);
    }
  } catch (error) {
    console.error(`Text extraction error for file ${fileName}:`, error);
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
    reader.onerror = (error) => {
      console.error('Error reading text file:', error);
      reject(error);
    };
    reader.readAsText(file);
  });
} 