"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Trash2, Star } from 'lucide-react';
import { NoteWithMetadata } from '@/types/note';
import { format } from 'date-fns';
import Link from 'next/link';
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
import { useToast } from '@/hooks/use-toast';
import { deleteNote, toggleFavorite } from '@/lib/services/notes-service';

interface NoteItemProps {
  note: NoteWithMetadata;
  index: number;
  onDelete: (noteId: string) => void;
  onFavoriteToggle?: (note: NoteWithMetadata) => void;
}

export default function NoteItem({ note, index, onDelete, onFavoriteToggle }: NoteItemProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isFavorite, setIsFavorite] = React.useState(note.favorite);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNote(note.id);
      onDelete(note.id);
      toast({
        title: "Note deleted",
        description: "Your note has been successfully deleted.",
      });
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

  const handleToggleFavorite = async () => {
    try {
      // Optimistically update the UI first
      const newFavoriteStatus = !isFavorite;
      setIsFavorite(newFavoriteStatus);
      
      // Then make the API call
      const updatedNote = await toggleFavorite(note.id);
      
      if (onFavoriteToggle) {
        onFavoriteToggle({ ...note, favorite: updatedNote.favorite });
      }
      
      toast({
        title: updatedNote.favorite ? "Added to favorites" : "Removed from favorites",
        description: updatedNote.favorite 
          ? "Note added to your favorites." 
          : "Note removed from your favorites.",
      });
    } catch (error) {
      // Revert the optimistic UI update on error
      setIsFavorite(isFavorite);
      
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date to readable format
  const formattedDate = note.createdAt ? 
    format(new Date(note.createdAt), 'MMM d, yyyy') : 
    'Unknown date';

  // Extract a preview from the content (first 150 chars)
  const preview = note.content ? 
    (note.content.length > 150 ? 
      note.content.substring(0, 150) + '...' : 
      note.content) : 
    'No content';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-0">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div className="rounded-full p-3 bg-blue-100 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-lg">{note.title}</h3>
                  <p className="text-muted-foreground">{preview}</p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {note.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-muted/40">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 mt-3 sm:mt-0">
                <div className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formattedDate}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={`h-8 px-2 ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={handleToggleFavorite}
                  >
                    <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
                  </Button>
                
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 px-2 text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
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
                  
                  <Link href={`/student/notes/${note.id}`} passHref>
                    <Button size="sm" variant="default" className="h-8">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 