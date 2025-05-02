"use client";

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Search, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { fetchNotes } from '@/lib/services/notes-service';
import { Note, NoteWithMetadata } from '@/types/note';
import { useToast } from '@/hooks/use-toast';
import NoteItem from '@/components/notes/NoteItem';
import { CreateNoteDialog } from '@/components/notes/CreateNoteDialog';
import { ImportNotesDialog } from '@/components/notes/ImportNotesDialog';
import Link from 'next/link';
import { useRealtimeNotes } from '@/hooks/useRealtimeNotes';

// Function to extract tags from the content
const extractTags = (content: string): string[] => {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = content.match(hashtagRegex);
  
  if (!matches) return [];
  
  return matches.map(match => match.substring(1)); // Remove the # character
};

// Function to process notes to add metadata
const processNotes = (notes: Note[]): NoteWithMetadata[] => {
  return notes.map(note => ({
    ...note,
    tags: extractTags(note.content),
  }));
};

const StudentNotes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<NoteWithMetadata[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  
  const { toast } = useToast();
  
  // Authentication check
  const { isAuthenticated, userRole } = useAuth();
  const router = useRouter();

  // Use real-time notes hook instead of manual fetch
  const { notes: rawNotes, loading: isLoading, error, refresh } = useRealtimeNotes();
  
  // Process notes when they change
  const [notes, setNotes] = useState<NoteWithMetadata[]>([]);
  
  useEffect(() => {
    if (rawNotes && Array.isArray(rawNotes)) {
      const processed = processNotes(rawNotes);
      setNotes(processed);
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [rawNotes]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (userRole !== 'student') {
      router.push(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, router]);

  // Show error toast if there was an error fetching notes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load notes. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Filter notes based on search query and active tab
  useEffect(() => {
    if (notes.length === 0) {
      setFilteredNotes([]);
      return;
    }
    
    let filtered = notes;
    
    // Apply search filter if query exists
    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }
    
    // Apply tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'recent') {
        // Sort by date and take the 5 most recent
        filtered = [...filtered].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5);
      } else if (activeTab === 'favorites') {
        // Filter notes with favorite=true
        filtered = filtered.filter(note => note.favorite);
      }
    }
    
    setFilteredNotes(filtered);
  }, [notes, searchQuery, activeTab]);

  // Handle note creation - no longer needed to manually update the state as it will be handled by the real-time subscription
  const handleNoteCreated = (newNote: Note) => {
    // The new note will be automatically added by the subscription
    // Just update the last sync time
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // Handle note deletion - no longer needed to manually update the state
  const handleNoteDeleted = (deletedNoteId: string) => {
    // The note will be automatically removed by the subscription
    // Just update the last sync time
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (updatedNote: NoteWithMetadata) => {
    // Still need to handle this locally as it might not trigger a DB change
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === updatedNote.id 
          ? { ...note, favorite: updatedNote.favorite } 
          : note
      )
    );
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // Don't render until authenticated
  if (!isAuthenticated || userRole !== 'student') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="My Notes" 
        description="Search and browse through all your uploaded notes."
      />
      
      <div className="space-y-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, content, or tags"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Notes</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note, index) => (
                  <NoteItem 
                    key={note.id}
                    note={note} 
                    index={index} 
                    onDelete={handleNoteDeleted}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center rounded-full bg-muted/30 p-6 mb-4">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg">No notes found</h3>
                  <p className="text-muted-foreground mt-1">
                    {notes.length === 0 
                      ? "You haven't created any notes yet. Create your first note to get started."
                      : activeTab === 'favorites'
                        ? "You don't have any favorite notes yet. Click the star icon on a note to add it to favorites."
                        : "Try adjusting your search or filters"}
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last synchronized: {lastSyncTime ? `Today at ${lastSyncTime}` : 'Never'}
          </div>
          <div className="flex gap-3">
            <ImportNotesDialog onNoteImported={handleNoteCreated} />
            <CreateNoteDialog onNoteCreated={handleNoteCreated} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNotes;
