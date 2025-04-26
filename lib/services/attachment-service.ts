"use client";

import { Attachment, AttachmentWithData } from '@/types/attachment';

/**
 * Upload a file as an attachment
 */
export async function uploadAttachment(file: File): Promise<Attachment> {
  try {
    // Check if the file is valid
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided for upload');
    }

    console.log(`Preparing to upload file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    // Create form data with the file
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Sending attachment upload request...');
    const response = await fetch('/api/attachments', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to upload attachment';
      let details = '';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        details = errorData.details || '';
        
        console.error('Upload error response:', errorData);
      } catch (parseError) {
        // If we can't parse the JSON, use the status text
        errorMessage = `Upload failed: ${response.statusText || response.status}`;
        console.error('Failed to parse error response:', parseError);
      }
      
      const fullError = details ? `${errorMessage} - ${details}` : errorMessage;
      throw new Error(fullError);
    }

    try {
      const data = await response.json();
      console.log('Attachment uploaded successfully:', data);
      return data;
    } catch (parseError) {
      console.error('Error parsing successful response:', parseError);
      throw new Error('Server returned invalid response format');
    }
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    throw error;
  }
}

/**
 * Get an attachment by ID
 */
export async function getAttachment(attachmentId: string): Promise<AttachmentWithData> {
  try {
    console.log(`Fetching attachment: ${attachmentId}`);
    const response = await fetch(`/api/attachments/${attachmentId}`);

    if (!response.ok) {
      let errorMessage = 'Failed to get attachment';
      let isSessionOnly = false;
      
      try {
        const errorData = await response.json();
        
        // Check if this is a session-only error
        if (errorData.sessionOnly) {
          console.warn('Attachment exists in session only - no data available');
          isSessionOnly = true;
        }
        
        errorMessage = errorData.error || errorMessage;
        const details = errorData.details || '';
        const fullError = details ? `${errorMessage} - ${details}` : errorMessage;
        
        // For session-only errors, create a placeholder attachment
        if (isSessionOnly) {
          return {
            id: attachmentId,
            filename: 'unavailable-attachment.file',
            fileType: 'application/octet-stream',
            fileSize: 0,
            createdAt: new Date(),
            userId: '',
            data: null,
            _sessionOnly: true,
            _errorMessage: fullError
          };
        }
        
        throw new Error(fullError);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message.includes('sessionOnly')) {
          // Special handling for session-only errors we created above
          throw parseError;
        }
        // If we can't parse the JSON, use the status text
        throw new Error(`Failed to get attachment: ${response.statusText || response.status}`);
      }
    }

    // Get the file as a blob
    const blob = await response.blob();
    
    // Get the headers
    const filename = response.headers.get('X-Filename') || 'document';
    const fileType = response.headers.get('Content-Type') || 'application/octet-stream';
    const fileSize = parseInt(response.headers.get('Content-Length') || '0', 10);
    
    console.log(`Attachment retrieved: ${filename} (${fileSize} bytes)`);
    
    return {
      id: attachmentId,
      filename,
      fileType,
      fileSize,
      createdAt: new Date(),
      userId: '',  // This will be set by the server
      data: blob
    };
  } catch (error: any) {
    console.error('Error getting attachment:', error);
    
    // Preserve session-only errors for special handling by UI
    if (error.message?.includes('session') || (error as any)._sessionOnly) {
      throw error;
    }
    
    // Generic error
    throw new Error(`Failed to retrieve attachment: ${error.message}`);
  }
}

/**
 * Delete an attachment by ID
 */
export async function deleteAttachment(attachmentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/attachments/${attachmentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete attachment');
    }

    return true;
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    return false;
  }
}

/**
 * Open an attachment in a new tab
 */
export function openAttachment(attachment: AttachmentWithData): void {
  // Handle session-only attachments or missing data
  if (!attachment.data) {
    if (attachment._sessionOnly) {
      console.warn('Cannot open session-only attachment: no binary data available');
      throw new Error('Session-only attachment: File data is not available. The file was not saved to the database.');
    }
    throw new Error('Attachment data is missing');
  }
  
  // Create a blob URL for the attachment
  const blob = new Blob([attachment.data], { type: attachment.fileType });
  const url = URL.createObjectURL(blob);
  
  // Open the URL in a new tab
  window.open(url, '_blank');
  
  // Clean up the URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Download an attachment
 */
export function downloadAttachment(attachment: AttachmentWithData): void {
  // Handle session-only attachments or missing data
  if (!attachment.data) {
    if (attachment._sessionOnly) {
      console.warn('Cannot download session-only attachment: no binary data available');
      throw new Error('Session-only attachment: File data is not available. The file was not saved to the database.');
    }
    throw new Error('Attachment data is missing');
  }
  
  // Create a blob URL for the attachment
  const blob = new Blob([attachment.data], { type: attachment.fileType });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.filename;
  
  // Append to the document
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 