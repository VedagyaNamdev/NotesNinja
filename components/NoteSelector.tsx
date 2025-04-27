import React, { useState, useEffect } from 'react';
import { fetchNotes, fetchNoteById } from '@/lib/data-service';
import { extractNoteContent } from '@/lib/document-processing';
import { Note } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookText, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { isDocumentContent } from '@/lib/utils';

interface NoteSelectorProps {
  onNoteSelected: (content: string, title: string) => void;
}

export default function NoteSelector({ onNoteSelected }: NoteSelectorProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [loadingNote, setLoadingNote] = useState(false);
  const [processingAttachment, setProcessingAttachment] = useState(false);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const response = await fetchNotes();
        if (response.data && Array.isArray(response.data)) {
          setNotes(response.data);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
        toast.error('Failed to load notes');
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  const handleNoteSelect = async (id: string) => {
    if (!id) return;
    
    setSelectedNoteId(id);
    setLoadingNote(true);
    
    try {
      const note = await fetchNoteById(id);
      if (note) {
        const isDocument = note.attachmentId || isDocumentContent(note.content);
        
        if (isDocument) {
          // This is a document note, need to extract content
          setProcessingAttachment(true);
          try {
            const extractedContent = await extractNoteContent(note);
            onNoteSelected(extractedContent, note.title);
            toast.success(`Document content extracted: ${note.title}`, {
              description: 'Document text has been extracted for quiz generation'
            });
          } catch (extractError) {
            console.error('Error extracting document content:', extractError);
            toast.error('Could not extract document content', {
              description: 'Using basic note text as fallback'
            });
            // Fall back to original content if extraction fails
            onNoteSelected(note.content, note.title);
          } finally {
            setProcessingAttachment(false);
          }
        } else {
          // Regular note, use content as is
          onNoteSelected(note.content, note.title);
        }
      }
    } catch (error) {
      console.error('Error loading note content:', error);
      toast.error('Failed to load note content');
    } finally {
      setLoadingNote(false);
    }
  };

  const refreshNotes = async () => {
    try {
      setLoading(true);
      const response = await fetchNotes();
      if (response.data && Array.isArray(response.data)) {
        setNotes(response.data);
        toast.success('Notes refreshed');
      }
    } catch (error) {
      console.error('Error refreshing notes:', error);
      toast.error('Failed to refresh notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-medium flex items-center gap-2">
              <BookText className="h-4 w-4" />
              Select Note
            </h3>
            <Button variant="ghost" size="sm" onClick={refreshNotes} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          
          {loading ? (
            <div className="py-2 text-center text-sm text-muted-foreground">
              Loading notes...
            </div>
          ) : notes.length > 0 ? (
            <Select value={selectedNoteId} onValueChange={handleNoteSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a note" />
              </SelectTrigger>
              <SelectContent>
                {notes.map((note) => {
                  const isDocument = note.attachmentId || (note.content && isDocumentContent(note.content));
                  return (
                    <SelectItem key={note.id} value={note.id} className="flex items-center">
                      {isDocument && <FileText className="h-3 w-3 mr-2 inline-block" />}
                      {note.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className="py-2 text-center text-sm text-muted-foreground">
              No notes found. Create some notes to generate quizzes.
            </div>
          )}
          
          {(loadingNote || processingAttachment) && (
            <div className="py-2 text-center text-sm flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {processingAttachment ? 'Extracting document content...' : 'Loading note content...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 