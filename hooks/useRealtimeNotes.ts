import { useState, useEffect, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/data-service';
import { fetchNotes } from '@/lib/data-service';
import { useSession } from 'next-auth/react';

export function useRealtimeNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session } = useSession();
  
  // Create a memoized loadNotes function that we can reference consistently
  const loadNotes = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      console.log('Fetching notes due to real-time update or initial load');
      const response = await fetchNotes();
      
      // Check if the response has the expected format
      if (response && response.data) {
        setNotes(response.data);
        console.log(`Loaded ${response.data.length} notes`);
      } else {
        console.warn('Unexpected response format from fetchNotes:', response);
        setNotes([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);
  
  // Handle manual change notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !session?.user?.id) return;
    
    const handleManualChange = () => {
      console.log('Received manual note change notification');
      loadNotes();
    };
    
    // Listen for custom event
    window.addEventListener('notesninja:note-changed', handleManualChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('notesninja:note-changed', handleManualChange);
    };
  }, [session?.user?.id, loadNotes]);
  
  // Handle real-time updates
  useEffect(() => {
    if (!session?.user?.id) return;
    
    // Initial load of notes
    loadNotes();
    
    // Set up real-time subscription
    try {
      const supabase = createSupabaseClient();
      
      // Create the subscription
      const channel = supabase
        .channel('notes-changes')
        .on('postgres_changes', {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${session.user.id}`
        }, (payload) => {
          console.log('Realtime update received:', payload);
          
          // Different handling based on the event type
          switch (payload.eventType) {
            case 'INSERT':
              // For inserts, we could just add the new note, but fetching all notes
              // ensures we have consistent data with proper relationships
              loadNotes();
              break;
              
            case 'UPDATE':
              // For updates, we could just update the specific note
              loadNotes();
              break;
              
            case 'DELETE':
              // For deletes, we can filter out the deleted note by ID
              if (payload.old && payload.old.id) {
                console.log(`Removing deleted note with ID: ${payload.old.id}`);
                setNotes(prevNotes => 
                  prevNotes.filter(note => note.id !== payload.old.id)
                );
              } else {
                // If we can't get the ID for some reason, reload all notes
                loadNotes();
              }
              break;
              
            default:
              // For any other event, reload all notes
              loadNotes();
          }
        })
        .subscribe();
      
      console.log('Subscribed to notes changes for user:', session.user.id);
      
      // Cleanup subscription on unmount
      return () => {
        console.log('Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error('Failed to subscribe to notes changes:', err);
    }
  }, [session?.user?.id, loadNotes]);
  
  // Expose the refresh function and state
  return { 
    notes, 
    loading, 
    error, 
    refresh: loadNotes 
  };
} 