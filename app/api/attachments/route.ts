import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveAttachment } from '@/lib/db-utils';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle form data manually
  },
};

// POST a new attachment
export async function POST(request: NextRequest) {
  console.log('Starting attachment upload process');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Authentication failed: No user session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Authenticated user: ${session.user.id}`);

    try {
      // Parse the form data
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        console.log('No file provided in the request');
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

      // Validate file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        console.log(`File too large: ${file.size} bytes (limit: ${MAX_FILE_SIZE} bytes)`);
        return NextResponse.json(
          { error: 'File too large, maximum size is 10MB' },
          { status: 400 }
        );
      }

      // Convert file to ArrayBuffer
      console.log('Converting file to buffer...');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`Buffer created, size: ${buffer.length} bytes`);

      try {
        // Save the attachment
        console.log('Saving attachment to database...');
        const attachment = await saveAttachment(session.user.id, {
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          data: buffer,
        });

        console.log(`Attachment saved successfully. ID: ${attachment.id}`);
        return NextResponse.json(attachment);
      } catch (dbError: any) {
        console.error('Database error saving attachment:', dbError);
        return NextResponse.json(
          { 
            error: 'Database error saving attachment', 
            details: dbError.message || 'Unknown database error',
            code: 'DB_ERROR'
          },
          { status: 500 }
        );
      }
    } catch (parseError: any) {
      console.error('Error parsing form data:', parseError);
      return NextResponse.json(
        { 
          error: 'Failed to process attachment data', 
          details: parseError.message || 'Error processing form data',
          code: 'FORM_PARSE_ERROR'
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Unhandled error in attachment upload:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save attachment', 
        details: error.message || 'Unknown error occurred',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
} 