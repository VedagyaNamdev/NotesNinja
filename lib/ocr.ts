import { createWorker } from 'tesseract.js';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * Extracts text from an image using Tesseract.js OCR
 * @param imageFile - The image file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    console.log(`OCR: Processing image file: ${imageFile.name} (${imageFile.size} bytes)`);
    
    // Make sure we're in a browser environment
    if (!isBrowser) {
      throw new Error('OCR can only be performed in a browser environment');
    }
    
    // Convert file to data format based on environment
    let imageData: string;
    if (isBrowser) {
      // Browser: Convert to data URL
      imageData = await fileToDataURL(imageFile);
      console.log('OCR: Converted image to data URL');
    } else {
      // This should never run due to the check above, but for type safety
      throw new Error('OCR can only be performed in a browser environment');
    }
    
    // Create a Tesseract worker instance with English language
    console.log('OCR: Creating Tesseract worker...');
    const worker = await createWorker('eng');
    console.log('OCR: Worker created and initialized with English language');
    
    // Set parameters for better quality if needed
    await worker.setParameters({
      tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:\'\"()[]{}!@#$%^&*-+=<>?/ ',
    });
    
    // Recognize text in the image
    console.log('OCR: Starting text recognition...');
    const result = await worker.recognize(imageData);
    console.log('OCR: Recognition complete');
    
    // Terminate worker to free resources
    console.log('OCR: Terminating worker...');
    await worker.terminate();
    console.log('OCR: Worker terminated');
    
    if (!result.data.text || result.data.text.trim() === '') {
      console.log('OCR: No text detected in image');
      return 'No text detected in the image. Please try a clearer image with visible text.';
    }
    
    // Return extracted text
    console.log(`OCR: Successfully extracted ${result.data.text.length} characters`);
    return result.data.text;
  } catch (error) {
    console.error('OCR processing error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from the image: ${error.message}`);
    } else {
      throw new Error('Failed to extract text from the image');
    }
  }
}

/**
 * Convert a file to a data URL for use with Tesseract.js
 * @param file - The file to convert
 * @returns A promise that resolves to the data URL
 */
function fileToDataURL(file: File): Promise<string> {
  if (!isBrowser) {
    return Promise.reject(new Error('FileReader is only available in browser environments'));
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FileReader did not produce a string result'));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
} 