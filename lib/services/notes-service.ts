import { Note } from '@/types/note';
import { uploadAttachment } from './attachment-service';
import { notifyNoteChange } from '@/lib/data-service';

export interface CreateNoteData {
  title: string;
  content: string;
  summary?: string;
  keyTerms?: string;
  bullets?: string;
  attachment?: File;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  summary?: string;
  keyTerms?: string;
  bullets?: string;
  attachment?: File;
}

export interface NotesResponse {
  data: Note[];
  error?: any;
}

export interface ImportNoteOptions {
  file?: File;
  text?: string;
  title: string;
  saveOriginalFile?: boolean;
}

// Session storage key for notes
const SESSION_STORAGE_KEY = 'notesNinja_notes';

/**
 * Synchronize a note with session storage
 */
function syncNoteWithSessionStorage(note: Note) {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing notes from session storage
    const existingData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    let existingNotes: Note[] = [];
    
    if (existingData) {
      try {
        existingNotes = JSON.parse(existingData);
      } catch (e) {
        console.error('Error parsing session storage data:', e);
        existingNotes = [];
      }
    }
    
    // Check if this note already exists in storage
    const existingIndex = existingNotes.findIndex(n => n.id === note.id);
    
    if (existingIndex >= 0) {
      // Update existing note
      existingNotes[existingIndex] = note;
    } else {
      // Add new note
      existingNotes.push(note);
    }
    
    // Save back to session storage
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(existingNotes));
    console.log(`Note synchronized with session storage: ${note.id}`);
  } catch (error) {
    console.error('Error syncing note with session storage:', error);
  }
}

/**
 * Fetch all notes for the current user
 */
export async function fetchNotes(): Promise<NotesResponse> {
  try {
    console.log('Fetching notes from server');
    
    // Add timestamp to URL to prevent caching
    const timestamp = new Date().getTime();
    const url = `/api/notes?_t=${timestamp}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store', // Don't cache this request
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch notes');
    }

    const serverData = await response.json();
    
    // Check if the server response contains data but also has the _warning flag
    // This means the database query worked but with some limitations (e.g., no attachment support)
    if (serverData._warning && serverData.data && serverData.data.length > 0) {
      console.log('Notes fetched with warnings:', serverData._warning);
      // We still return the data but don't mark it as _sessionOnly since it's in the database
      return {
        data: serverData.data,
        _warning: serverData._warning
      };
    }
    
    // Check if we're in the browser and session storage is available
    if (typeof window !== 'undefined') {
      try {
        // Try to get session-only notes from session storage
        const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        
        if (sessionData) {
          const sessionNotes = JSON.parse(sessionData);
          console.log(`Found ${sessionNotes.length} notes in session storage`);
          
          if (Array.isArray(sessionNotes) && sessionNotes.length > 0) {
            // Filter out session notes that also exist in database results
            // (by matching IDs) to avoid duplicates
            const serverNoteIds = new Set(serverData.data.map((note: Note) => note.id));
            
            // Only include session notes that aren't already in the server response
            const uniqueSessionNotes = sessionNotes.filter(
              (note: Note) => !serverNoteIds.has(note.id)
            );
            
            if (uniqueSessionNotes.length > 0) {
              console.log(`Adding ${uniqueSessionNotes.length} unique session-only notes to results`);
              
              // Include session-only flag on the response
              return {
                data: [...serverData.data, ...uniqueSessionNotes],
                _sessionOnly: true,
                _sessionOnlyCount: uniqueSessionNotes.length
              };
            }
          }
        }
      } catch (sessionError) {
        console.error('Error processing session storage data:', sessionError);
        // Continue with just server data
      }
    }

    return serverData;
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    
    // If we're in the browser, try to fall back to session storage
    if (typeof window !== 'undefined') {
      try {
        const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionData) {
          const sessionNotes = JSON.parse(sessionData);
          console.log(`Server fetch failed. Using ${sessionNotes.length} notes from session storage`);
          
          if (Array.isArray(sessionNotes) && sessionNotes.length > 0) {
            return { 
              data: sessionNotes,
              error: error.message,
              _sessionOnly: true,
              _offline: true
            };
          }
        }
      } catch (sessionError) {
        console.error('Error processing session storage fallback:', sessionError);
      }
    }
    
    return { data: [], error: error.message };
  }
}

/**
 * Create a new note
 */
export async function createNote(data: CreateNoteData): Promise<Note> {
  try {
    // If there's an attachment, upload it first
    let attachmentId = null;
    let attachmentError = null;
    
    if (data.attachment) {
      try {
        console.log(`Uploading attachment for new note: ${data.attachment.name}`);
        const attachment = await uploadAttachment(data.attachment);
        attachmentId = attachment.id;
        console.log(`Attachment uploaded, ID: ${attachmentId}`);
      } catch (attachErr: any) {
        console.error('Error uploading attachment for note:', attachErr);
        attachmentError = attachErr.message || 'Failed to upload attachment';
        // Continue without attachment - note can still be saved
      }
    }

    // Create the note with the attachment reference if available
    console.log(`Creating note: ${data.title}${attachmentId ? ' with attachment' : ''}`);
    
    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const url = `/api/notes?_t=${timestamp}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        ...data,
        attachmentId,
        attachment: undefined // Don't send the file in the JSON
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create note');
    }

    const note = await response.json();
    
    // Manually trigger a real-time update to ensure UI syncs
    if (typeof window !== 'undefined') {
      notifyNoteChange();
    }
    
    // Check for the warning property we set in the enhanced saveNote function
    // If the note was saved with a warning (e.g., due to schema limitations), handle it
    if (note._warning && note._warning.includes('attachment')) {
      console.log('Note created with attachment warning:', note._warning);
      return {
        ...note,
        _attachmentError: 'Note was saved without attachment due to database limitations'
      };
    }
    
    // If this is a session-only note, make sure to store it in session storage
    if (note._sessionOnly) {
      console.log('Note is session-only, syncing with session storage');
      syncNoteWithSessionStorage(note);
    }
    
    // Add warning about attachment if there was an error
    if (attachmentError) {
      console.warn('Note created without attachment due to upload error');
      const noteWithError = {
        ...note,
        _attachmentError: attachmentError
      };
      
      // Make sure to sync the note with error to session storage
      syncNoteWithSessionStorage(noteWithError);
      
      return noteWithError;
    }
    
    return note;
  } catch (error: any) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Update an existing note
 */
export async function updateNote(noteId: string, data: UpdateNoteData): Promise<Note> {
  try {
    // If there's an attachment, upload it first
    let attachmentId = null;
    let attachmentError = null;
    
    if (data.attachment) {
      try {
        console.log(`Uploading attachment for note update: ${data.attachment.name}`);
        const attachment = await uploadAttachment(data.attachment);
        attachmentId = attachment.id;
        console.log(`Attachment uploaded, ID: ${attachmentId}`);
      } catch (attachErr: any) {
        console.error('Error uploading attachment for note update:', attachErr);
        attachmentError = attachErr.message || 'Failed to upload attachment';
        // Continue without attachment - note can still be updated
      }
    }

    console.log(`Updating note ${noteId}${attachmentId ? ' with attachment' : ''}`);
    
    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime(); 
    const url = `/api/notes/${noteId}?_t=${timestamp}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        ...data,
        attachmentId: data.attachment ? attachmentId : undefined,
        attachment: undefined // Don't send the file in the JSON
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update note');
    }

    const result = await response.json();
    
    // Manually trigger a real-time update to ensure UI syncs
    if (typeof window !== 'undefined') {
      notifyNoteChange();
    }
    
    // Add warning about attachment if there was an error
    if (attachmentError) {
      console.warn('Note updated without attachment due to upload error');
      return {
        ...result.note,
        _attachmentError: attachmentError
      };
    }
    
    return result.note;
  } catch (error: any) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Delete a note by ID
 */
export async function deleteNote(noteId: string): Promise<{ success: boolean }> {
  try {
    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    const url = `/api/notes/${noteId}?_t=${timestamp}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete note');
    }

    // Remove deleted note from session storage if it exists
    if (typeof window !== 'undefined') {
      try {
        const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionData) {
          const notes = JSON.parse(sessionData);
          const filteredNotes = notes.filter((note: any) => note.id !== noteId);
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filteredNotes));
          console.log(`Removed note ${noteId} from session storage`);
        }
      } catch (e) {
        console.error('Error updating session storage after deletion:', e);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return { success: false };
  }
}

/**
 * Toggle the favorite status of a note
 */
export async function toggleFavorite(noteId: string): Promise<Note> {
  try {
    console.log(`Toggling favorite status for note ${noteId}`);
    const response = await fetch(`/api/notes/${noteId}/favorite`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update favorite status');
    }

    const result = await response.json();
    
    // If successful, sync with session storage
    syncNoteWithSessionStorage(result.note);
    
    return result.note;
  } catch (error: any) {
    console.error('Error toggling favorite status:', error);
    
    // Attempt to get the note from session storage 
    if (typeof window !== 'undefined') {
      try {
        const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionData) {
          const sessionNotes = JSON.parse(sessionData);
          const noteIndex = sessionNotes.findIndex((n: Note) => n.id === noteId);
          
          if (noteIndex >= 0) {
            // Toggle the favorite status locally
            const updatedNote = {
              ...sessionNotes[noteIndex],
              favorite: !sessionNotes[noteIndex].favorite
            };
            
            // Update the note in session storage
            sessionNotes[noteIndex] = updatedNote;
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionNotes));
            
            console.log(`Used session storage fallback to toggle favorite status for note ${noteId}`);
            return {
              ...updatedNote,
              _sessionOnly: true
            };
          }
        }
      } catch (sessionError) {
        console.error('Error processing session storage for favorite toggle:', sessionError);
      }
    }
    
    throw error;
  }
}

/**
 * Import a note from a file or text
 */
export async function importNote(options: ImportNoteOptions): Promise<Note> {
  try {
    // If file is provided and we want to save the original file
    if (options.file && options.saveOriginalFile) {
      // Extract text for text-based files, or create a description for binary files
      let content = '';
      
      if (options.file.type.includes('text') || options.file.name.endsWith('.md')) {
        content = await readFileAsText(options.file);
      } else {
        content = `[Document Import] ${options.file.name}\n\nFile type: ${options.file.type}\nSize: ${(options.file.size / 1024).toFixed(2)} KB\n\nThis document is stored in its original format and can be opened or downloaded.`;
      }
      
      // Create note with the file as an attachment
      return createNote({
        title: options.title,
        content,
        attachment: options.file
      });
    }
    
    // If file is provided but we only want to extract text
    if (options.file && !options.saveOriginalFile) {
      if (options.file.type.includes('text') || options.file.name.endsWith('.md')) {
        const text = await readFileAsText(options.file);
        
        return createNote({
          title: options.title,
          content: text
        });
      } else {
        const fileInfo = `[Imported from ${options.file.name}]\n\nFile type: ${options.file.type}\nSize: ${(options.file.size / 1024).toFixed(2)} KB\n\nNOTE: This file format cannot be displayed directly. The original content is preserved for export functionality.`;
        
        return createNote({
          title: options.title,
          content: fileInfo
        });
      }
    }
    
    // If text is provided
    if (options.text) {
      return createNote({
        title: options.title,
        content: options.text
      });
    }
    
    throw new Error('No content provided for import');
  } catch (error: any) {
    console.error('Error importing note:', error);
    throw error;
  }
}

/**
 * Read a file as text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
} 