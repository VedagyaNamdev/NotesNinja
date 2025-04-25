"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Database, CloudUpload } from 'lucide-react';
import { toast } from 'sonner';
import { migrateDataFromLocalStorage } from '@/lib/data-service';

interface DataMigrationDialogProps {
  userId: string;
  onMigrationComplete: () => void;
}

export default function DataMigrationDialog({
  userId,
  onMigrationComplete
}: DataMigrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [dataToMigrate, setDataToMigrate] = useState({
    hasNotes: false,
    hasFlashcards: false,
    hasQuizResults: false,
    total: 0
  });

  // Check for localStorage data when component mounts
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    
    try {
      const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
      const flashcardDecks = JSON.parse(localStorage.getItem('flashcardDecks') || '[]');
      const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
      
      const hasData = {
        hasNotes: savedNotes.length > 0,
        hasFlashcards: flashcardDecks.length > 0,
        hasQuizResults: quizResults.length > 0,
        total: savedNotes.length + flashcardDecks.length + quizResults.length
      };
      
      setDataToMigrate(hasData);
      
      // Show dialog if there's data to migrate
      if (hasData.total > 0) {
        // Check if we've already shown this dialog
        const migrationShown = localStorage.getItem('dataMigrationShown');
        if (!migrationShown) {
          setOpen(true);
        }
      }
    } catch (error) {
      console.error('Error checking for localStorage data:', error);
    }
  }, [userId]);

  const handleMigrateData = async () => {
    setIsMigrating(true);
    
    try {
      const result = await migrateDataFromLocalStorage();
      
      if (result.migrated) {
        toast.success('Data migrated successfully', {
          description: `Migrated ${result.results.notes} notes, ${result.results.decks} flashcard decks, and ${result.results.quizResults} quiz results.`
        });
        
        // Mark migration as completed
        localStorage.setItem('dataMigrationShown', 'true');
        
        // Close dialog
        setOpen(false);
        
        // Call callback
        onMigrationComplete();
      } else {
        toast.info('No data to migrate');
        setOpen(false);
      }
    } catch (error) {
      console.error('Error migrating data:', error);
      toast.error('Failed to migrate data', {
        description: 'Please try again later'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('dataMigrationShown', 'true');
    setOpen(false);
  };

  if (!open || dataToMigrate.total === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migrate Your Data
          </DialogTitle>
          <DialogDescription>
            We found data saved on this device. Would you like to migrate it to your account?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm">
            We found the following data that can be migrated to your account:
          </p>
          
          <ul className="space-y-2">
            {dataToMigrate.hasNotes && (
              <li className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Notes and summaries
              </li>
            )}
            {dataToMigrate.hasFlashcards && (
              <li className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Flashcard decks
              </li>
            )}
            {dataToMigrate.hasQuizResults && (
              <li className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Quiz results
              </li>
            )}
          </ul>
          
          <p className="text-sm text-muted-foreground">
            Migrating this data will save it to your account so you can access it from any device.
          </p>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleMigrateData}
            disabled={isMigrating}
            className="mt-2 sm:mt-0"
          >
            {isMigrating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <CloudUpload className="mr-2 h-4 w-4" />
                Migrate Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 