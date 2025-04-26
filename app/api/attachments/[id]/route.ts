import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAttachment, deleteAttachment } from '@/lib/db-utils';

// GET an attachment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`Fetching attachment with ID: ${params.id}`);
  
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

    const attachmentId = params.id;
    console.log(`Authenticated user ${session.user.id} requesting attachment ${attachmentId}`);
    
    try {
      // Get the attachment
      const attachment = await getAttachment(attachmentId, session.user.id);
      
      if (!attachment) {
        console.log(`Attachment not found: ${attachmentId}`);
        return NextResponse.json(
          { error: 'Attachment not found' },
          { status: 404 }
        );
      }
      
      // Check if this is a session-only attachment (would not have binary data)
      if ((attachment as any)._sessionOnly) {
        console.log(`Received session-only attachment (no data): ${attachmentId}`);
        return NextResponse.json(
          { 
            error: 'Attachment data not available', 
            details: 'This attachment exists only in the session and its data is not retrievable',
            sessionOnly: true
          },
          { status: 404 }
        );
      }
      
      // Return the attachment data as a stream with appropriate headers
      console.log(`Returning attachment data: ${attachment.filename} (${attachment.fileSize} bytes)`);
      const headers = new Headers();
      headers.set('Content-Type', attachment.fileType);
      headers.set('Content-Disposition', `inline; filename="${attachment.filename}"`);
      headers.set('Content-Length', attachment.fileSize.toString());
      headers.set('X-Filename', attachment.filename);
      
      return new NextResponse(attachment.data, {
        status: 200,
        headers,
      });
    } catch (dbError: any) {
      console.error('Database error fetching attachment:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error retrieving attachment', 
          details: dbError.message || 'Unknown database error',
          code: 'DB_ERROR'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unhandled error retrieving attachment:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve attachment', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE an attachment by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const attachmentId = params.id;
    
    // Delete the attachment
    const result = await deleteAttachment(attachmentId, session.user.id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Attachment not found or no permission to delete' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment', details: error.message },
      { status: 500 }
    );
  }
} 