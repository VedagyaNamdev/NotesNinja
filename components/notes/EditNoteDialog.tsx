"use client";

import React, { useState, useEffect } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { updateNote } from '@/lib/services/notes-service';
import { Note } from '@/types/note';
import { Edit, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EditNoteDialogProps {
  note: Note;
  onNoteUpdated: (updatedNote: Note) => void;
  trigger?: React.ReactNode;
}

export function EditNoteDialog({ note, onNoteUpdated, trigger }: EditNoteDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [error, setError] = useState<string | null>(null);
  
  // Update title when note changes
  useEffect(() => {
    setTitle(note.title);
  }, [note]);
  
  const handleClose = () => {
    setTitle(note.title);
    setError(null);
    setOpen(false);
  };
  
  const handleUpdate = async () => {
    if (!title.trim()) {
      setError('Please provide a title for your note');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updatedNote = await updateNote(note.id, {
        title
      });
      
      toast({
        title: "Note updated",
        description: "Your note has been successfully updated.",
      });
      
      setOpen(false);
      
      // Notify parent
      onNoteUpdated(updatedNote);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "An error occurred while updating your note.",
        variant: "destructive",
      });
      setError(error.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Update the details of your note
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-4">
            <Label htmlFor="title">Note Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your note"
              className="mt-1"
            />
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 