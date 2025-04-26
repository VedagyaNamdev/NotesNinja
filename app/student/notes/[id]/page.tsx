"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Download, Edit, ExternalLink, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import LoadingScreen from '@/components/LoadingScreen';
import { useToast } from '@/hooks/use-toast';
import { deleteNote } from '@/lib/services/notes-service';
import { Note, NoteType } from '@/types/note';
import { EditNoteDialog } from '@/components/notes/EditNoteDialog';
import { getAttachment, openAttachment, downloadAttachment } from '@/lib/services/attachment-service';
import { createDownloadableFile, isDocumentContent, extractFilenameFromContent } from '@/lib/utils';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Function to extract tags from the content
const extractTags = (content: string): string[] => {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = content.match(hashtagRegex);
  
  if (!matches) return [];
  
  return matches.map(match => match.substring(1)); // Remove the # character
};

// Function to determine note type based on content
const determineNoteType = (content: string): NoteType => {
  if (content.includes('[IMAGE]') || content.includes('![')) {
    return 'image';
  } else if (content.includes('[PDF]') || content.includes('.pdf')) {
    return 'pdf';
  } else if (content.includes('.doc') || content.includes('.docx')) {
    return 'doc';
  }
  return 'text';
};

// Format date to readable format
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'Unknown date';
  return format(new Date(date), 'MMMM d, yyyy h:mm a');
};

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, userRole } = useAuth();
  
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingAttachment, setIsLoadingAttachment] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>('text');
  const [tags, setTags] = useState<string[]>([]);
  const [isDocument, setIsDocument] = useState(false);
  
  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      if (!params.id || !isAuthenticated) return;
      
      setIsLoading(true);
      try {
        console.log(`Fetching note with ID: ${params.id}`);
        const response = await fetch(`/api/notes/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`Note not found in database: ${params.id}`);
            
            // Check if the note might be in local storage (session-only)
            // First try to get notes from sessionStorage
            const sessionData = sessionStorage.getItem('notesNinja_notes');
            if (sessionData) {
              try {
                const sessionNotes = JSON.parse(sessionData);
                const sessionNote = sessionNotes.find((n: any) => n.id === params.id);
                
                if (sessionNote) {
                  console.log(`Found note in session storage: ${params.id}`);
                  setNote(sessionNote);
                  
                  // Extract metadata
                  setTags(extractTags(sessionNote.content));
                  setNoteType(determineNoteType(sessionNote.content));
                  setIsDocument(isDocumentContent(sessionNote.content) || !!sessionNote.attachmentId);
                  
                  // Show warning toast
                  toast({
                    title: "Session-only Note",
                    description: "This note exists only in your browser session and is not saved to the database.",
                    variant: "warning",
                    duration: 8000
                  });
                  
                  setIsLoading(false);
                  return;
                }
              } catch (parseError) {
                console.error("Error parsing session storage data:", parseError);
              }
            }
            
            // If we get here, note wasn't found in session either
            toast({
              title: "Note not found",
              description: "The requested note could not be found.",
              variant: "destructive"
            });
            router.push('/student/notes');
            return;
          }
          throw new Error(`Error: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Note fetched successfully: ${data.title}`);
        setNote(data);
        
        // Check if this is a session-only note
        if (data._sessionOnly) {
          console.warn(`This is a session-only note (not in database): ${params.id}`);
          toast({
            title: "Session-only Note",
            description: "This note exists only in your browser session due to database issues.",
            variant: "warning",
            duration: 8000
          });
        }
        
        // Extract metadata
        setTags(extractTags(data.content));
        setNoteType(determineNoteType(data.content));
        setIsDocument(isDocumentContent(data.content) || !!data.attachmentId);
      } catch (error) {
        console.error("Error fetching note:", error);
        toast({
          title: "Error",
          description: "Failed to load note. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchNote();
    }
  }, [params.id, isAuthenticated, router, toast]);
  
  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (userRole !== 'student') {
      router.push(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, router]);
  
  const handleDelete = async () => {
    if (!note) return;
    
    setIsDeleting(true);
    try {
      await deleteNote(note.id);
      toast({
        title: "Note deleted",
        description: "Your note has been successfully deleted.",
      });
      router.push('/student/notes');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleNoteUpdated = (updatedNote: Note) => {
    setNote(updatedNote);
    toast({
      title: "Note updated",
      description: "The note has been successfully updated.",
    });
  };
  
  const handleOpenContent = async () => {
    if (!note) return;
    
    // If there's an attachmentId, use that instead of the text content
    if (note.attachmentId) {
      setIsLoadingAttachment(true);
      try {
        // Check if this is a session-only note, which means the attachment is likely not in the database
        if (note._sessionOnly) {
          console.log('Note is session-only, attachment may not be available');
          toast({
            title: "Attachment unavailable",
            description: "This note's attachment exists only in session and cannot be opened. Create a new note to save the attachment properly.",
            variant: "destructive"
          });
          setIsLoadingAttachment(false);
          return;
        }
        
        const attachment = await getAttachment(note.attachmentId);
        openAttachment(attachment);
      } catch (error: any) {
        console.error('Error opening attachment:', error);
        
        // Provide a specific message for session-only attachments
        if (error.message?.includes('session-only')) {
          toast({
            title: "Attachment unavailable",
            description: "This attachment exists only in session and cannot be opened. The file data was not saved to the database.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to open the document. Please try again.",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoadingAttachment(false);
      }
      return;
    }
    
    // Fallback to text content if no attachment
    const filename = extractFilenameFromContent(note.content, note.title);
    const contentType = noteType === 'pdf' ? 'application/pdf' : 'text/plain';
    
    const downloadable = createDownloadableFile(note.content, filename, contentType);
    downloadable.open();
  };
  
  const handleDownloadContent = async () => {
    if (!note) return;
    
    // If there's an attachmentId, download the attachment
    if (note.attachmentId) {
      setIsLoadingAttachment(true);
      try {
        // Check if this is a session-only note, which means the attachment is likely not in the database
        if (note._sessionOnly) {
          console.log('Note is session-only, attachment may not be available for download');
          toast({
            title: "Attachment unavailable",
            description: "This note's attachment exists only in session and cannot be downloaded. Create a new note to save the attachment properly.",
            variant: "destructive"
          });
          setIsLoadingAttachment(false);
          return;
        }
        
        const attachment = await getAttachment(note.attachmentId);
        downloadAttachment(attachment);
      } catch (error: any) {
        console.error('Error downloading attachment:', error);
        
        // Provide a specific message for session-only attachments
        if (error.message?.includes('session-only')) {
          toast({
            title: "Attachment unavailable",
            description: "This attachment exists only in session and cannot be downloaded. The file data was not saved to the database.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to download the document. Please try again.",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoadingAttachment(false);
      }
      return;
    }
    
    // Fallback to text content if no attachment
    const filename = extractFilenameFromContent(note.content, note.title);
    const contentType = noteType === 'pdf' ? 'application/pdf' : 'text/plain';
    
    const downloadable = createDownloadableFile(note.content, filename, contentType);
    downloadable.download();
  };
  
  // Don't render until authenticated
  if (!isAuthenticated || userRole !== 'student') {
    return null;
  }
  
  if (isLoading) {
    return <LoadingScreen show={true} />;
  }
  
  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Note Not Found</h2>
        <p className="text-muted-foreground mb-6">The note you're looking for doesn't exist or was deleted.</p>
        <Button onClick={() => router.push('/student/notes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/student/notes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your note.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" size="sm" onClick={handleDownloadContent} disabled={isLoadingAttachment}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <EditNoteDialog note={note} onNoteUpdated={handleNoteUpdated} />
        </div>
      </div>
      
      <PageHeader 
        title={note.title}
        description={`Created on ${formatDate(note.createdAt)}`}
      />
      
      {/* Session-only warning banner */}
      {note._sessionOnly && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {/* Warning icon */}
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm0-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium">Session-only Note</p>
              <p className="text-sm mt-1">
                This note exists only in your browser session due to database connection issues. 
                {note.attachmentId && " Attachments cannot be opened or downloaded."}
              </p>
              <p className="text-sm mt-1">
                To preserve this note, please create a new note with the same content.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="bg-muted/40">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {note.updatedAt && note.updatedAt !== note.createdAt && (
                <div className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Updated: {formatDate(note.updatedAt)}
                </div>
              )}
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {isDocument && (
            <div className="flex justify-center mb-4">
              <Button
                variant="outline"
                className="w-full max-w-md py-8"
                onClick={handleOpenContent}
                disabled={isLoadingAttachment}
              >
                <FileText className="h-8 w-8 mr-3" />
                <div className="flex flex-col items-start">
                  <span className="text-lg font-semibold">
                    {isLoadingAttachment ? 'Loading Document...' : 'Open Document'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {note.attachmentId ? 
                      'Click to open the original document in a new tab' : 
                      'Click to open the document preview in a new tab'}
                  </span>
                </div>
                <ExternalLink className="ml-auto h-5 w-5" />
              </Button>
            </div>
          )}
          
          <div className="prose dark:prose-invert max-w-none">
            {/* Simple rendering of note content - could be enhanced with markdown */}
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {note.content}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {note.summary && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-3">Summary</h3>
            <Separator className="mb-4" />
            <div className="prose dark:prose-invert max-w-none">
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {note.summary}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {note.keyTerms && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-3">Key Terms</h3>
            <Separator className="mb-4" />
            <div className="prose dark:prose-invert max-w-none">
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {note.keyTerms}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {note.bullets && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-3">Bullet Points</h3>
            <Separator className="mb-4" />
            <div className="prose dark:prose-invert max-w-none">
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {note.bullets}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
} 