import * as pdfjsLib from 'pdfjs-dist';
import { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Set worker source path for PDF.js
// This is needed because PDF.js uses web workers
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extracts text from a PDF file
 * @param pdfFile - The PDF file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromPdf(pdfFile: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await fileToArrayBuffer(pdfFile);
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get total number of pages
    const numPages = pdf.numPages;
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: TextItem | TextMarkedContent) => {
          // Check if item is TextItem (has str property)
          return 'str' in item ? item.str : '';
        })
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to extract text from the PDF');
  }
}

/**
 * Convert a file to an ArrayBuffer
 * @param file - The file to convert
 * @returns A promise that resolves to the ArrayBuffer
 */
function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
} 