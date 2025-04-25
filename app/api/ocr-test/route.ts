import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/ocr';

/**
 * API route for testing OCR functionality
 * POST /api/ocr-test
 */
export async function POST(req: NextRequest) {
  try {
    // Get form data with image
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided'
      }, { status: 400 });
    }
    
    console.log(`OCR Test API: Processing file ${file.name} (${file.type}), size: ${file.size} bytes`);
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      // If file type is not detected, check the filename extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const hasImageExtension = imageExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      if (!hasImageExtension) {
        return NextResponse.json({ 
          error: 'File must be an image (JPEG, PNG, etc.)',
          fileInfo: {
            name: file.name,
            type: file.type,
            size: file.size
          }
        }, { status: 400 });
      }
      
      console.log('File type not detected as image, but has image extension. Proceeding with OCR.');
    }
    
    // Return a response that allows the client to perform OCR
    // Since OCR with Tesseract.js should be done client-side
    return NextResponse.json({ 
      success: true, 
      message: 'File accepted for processing',
      clientSideProcessing: true,
      fileInfo: {
        name: file.name,
        type: file.type || 'Unknown (detected from file extension)',
        size: file.size
      }
    });
    
  } catch (error) {
    console.error('Error in OCR test API:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 