// Import types only, actual library will be dynamically imported
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Dynamic imports that only run on client side
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

// Initialize PDF.js only on client side
async function initPdfJs() {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    // Dynamically import PDF.js only on the client
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
}

/**
 * Extracts text from a PDF file
 * @param pdfFile - The PDF file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromPdf(pdfFile: File): Promise<string> {
  try {
    // Initialize PDF.js (only on client)
    await initPdfJs();
    
    if (!pdfjsLib) {
      throw new Error('PDF.js could not be initialized (are you on server side?)');
    }
    
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
        .map((item: any) => {
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