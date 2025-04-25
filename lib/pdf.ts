/**
 * PDF processing utility functions
 * Uses PDF.js loaded from CDN to avoid Node.js dependencies that cause errors in the browser
 */

// Track if PDF.js is loaded
let pdfJsLoaded = false;
let pdfJsLib: any = null;

/**
 * Dynamically load PDF.js from CDN
 */
async function loadPdfJs(): Promise<void> {
  if (typeof window === 'undefined' || pdfJsLoaded) return;

  try {
    // Only load in browser environment
    const version = '3.11.174'; // A stable version that works well in browsers
    
    // Add PDF.js script to the page
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.min.js`;
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
    
    // Add the worker
    // @ts-ignore - PDF.js is loaded dynamically
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`;
    
    // @ts-ignore - PDF.js is loaded dynamically
    pdfJsLib = window.pdfjsLib;
    pdfJsLoaded = true;
    console.log("PDF.js loaded successfully from CDN");
  } catch (error) {
    console.error("Failed to load PDF.js from CDN:", error);
    throw new Error("Failed to initialize PDF processing");
  }
}

/**
 * Extracts text from a PDF file
 * @param pdfFile - The PDF file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromPdf(pdfFile: File): Promise<string> {
  try {
    // Load PDF.js
    await loadPdfJs();
    
    if (!pdfJsLib) {
      throw new Error('PDF.js library not available');
    }
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await fileToArrayBuffer(pdfFile);
    
    // Load the PDF
    const loadingTask = pdfJsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
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