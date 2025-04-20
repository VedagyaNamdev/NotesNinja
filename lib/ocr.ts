import { createWorker } from 'tesseract.js';

/**
 * Extracts text from an image file using OCR
 * @param imageFile - The image file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    const worker = await createWorker('eng');
    
    // Convert file to image data URL
    const imageDataUrl = await fileToDataUrl(imageFile);
    
    // Recognize text in the image
    const { data: { text } } = await worker.recognize(imageDataUrl);
    
    // Terminate the worker to free resources
    await worker.terminate();
    
    return text;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to extract text from the image');
  }
}

/**
 * Convert a file to a data URL
 * @param file - The file to convert
 * @returns A promise that resolves to the data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
} 