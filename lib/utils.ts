import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a downloadable file from content
 */
export function createDownloadableFile(content: string, filename: string, type: string = 'text/plain') {
  // Create a blob with the content
  const blob = new Blob([content], { type });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  return {
    url,
    download: () => {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Append to the document
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    open: () => {
      // Open in a new window/tab
      window.open(url, '_blank');
      
      // Clean up after delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    },
    cleanup: () => {
      URL.revokeObjectURL(url);
    }
  };
}

/**
 * Detects if content is a document based on markers
 */
export function isDocumentContent(content: string): boolean {
  const documentMarkers = [
    '[Imported from',
    'File type:',
    '.doc',
    '.docx',
    '.pdf',
    '[PDF]',
    '[DOC]'
  ];
  
  return documentMarkers.some(marker => content.includes(marker));
}

/**
 * Extracts filename from document content
 */
export function extractFilenameFromContent(content: string, defaultName: string = 'document'): string {
  // Try to extract a filename from import text
  const importMatch = content.match(/\[Imported from ([^\]]+)\]/);
  if (importMatch && importMatch[1]) {
    return importMatch[1];
  }
  
  // If not found, use default with extension based on content
  if (content.includes('PDF') || content.includes('.pdf')) {
    return `${defaultName}.pdf`;
  } else if (content.includes('DOC') || content.includes('.docx') || content.includes('.doc')) {
    return `${defaultName}.docx`;
  }
  
  return `${defaultName}.txt`;
}
