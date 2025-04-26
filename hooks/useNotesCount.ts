import { useEffect, useState } from 'react';
import { useRealtimeNotes } from './useRealtimeNotes';

// This hook provides a real-time count of notes for use across the application
export function useNotesCount() {
  const [count, setCount] = useState(0);
  const [newThisWeek, setNewThisWeek] = useState(0);
  const { notes, loading, error } = useRealtimeNotes();
  
  useEffect(() => {
    if (!notes || !Array.isArray(notes)) {
      setCount(0);
      setNewThisWeek(0);
      return;
    }
    
    // Update the total count
    setCount(notes.length);
    
    // Calculate notes created in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentNotes = notes.filter((note: any) => {
      const createdAt = note.createdAt ? new Date(note.createdAt) : null;
      return createdAt && createdAt > oneWeekAgo;
    }).length;
    
    setNewThisWeek(recentNotes);
  }, [notes]);
  
  return {
    count,
    newThisWeek,
    loading,
    error
  };
} 