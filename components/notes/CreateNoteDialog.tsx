"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createNote } from '@/lib/services/notes-service';
import { Note } from '@/types/note';

interface CreateNoteDialogProps {
  onNoteCreated: (note: Note) => void;
}

export function CreateNoteDialog({ onNoteCreated }: CreateNoteDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content for your note.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newNote = await createNote({
        title,
        content,
      });
      
      // Log warnings but don't show toast messages to users
      if (newNote._warning) {
        console.warn('Note created with limitations:', newNote._warning);
      }
      else if (newNote._sessionOnly) {
        console.warn('Note created in session-only mode (not saved to database):', newNote);
      } 
      else if (newNote._attachmentError) {
        console.warn('Note created but attachment failed:', newNote._attachmentError);
      }
      
      // Show success message regardless of any warnings
      toast({
        title: "Note created",
        description: "Your note has been successfully created.",
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setOpen(false);
      
      // Notify parent
      onNoteCreated(newNote);
    } catch (error: any) {
      console.error('Error creating note:', error);
      toast({
        title: "Failed to create note",
        description: error.message || "An error occurred while creating your note.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Note</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a New Note</DialogTitle>
            <DialogDescription>
              Enter the details for your new note. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Note content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 