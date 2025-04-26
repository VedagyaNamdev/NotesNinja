"use client";

import React, { useState, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { importNote } from '@/lib/services/notes-service';
import { Note } from '@/types/note';
import { Upload, FileText, File, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface ImportNotesDialogProps {
  onNoteImported: (note: Note) => void;
}

export function ImportNotesDialog({ onNoteImported }: ImportNotesDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importTab, setImportTab] = useState('file');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saveOriginalFile, setSaveOriginalFile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resetForm = () => {
    setTitle('');
    setContent('');
    setFile(null);
    setSaveOriginalFile(true);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleClose = () => {
    resetForm();
    setOpen(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check file type
      if (!/\.(txt|md|doc|docx|pdf)$/i.test(selectedFile.name)) {
        setError('Unsupported file type. Please upload a text, markdown, or document file.');
        return;
      }
      
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File is too large. Maximum size is 10MB.');
        return;
      }
      
      setFile(selectedFile);
      
      // Auto-fill title from filename
      if (!title) {
        const fileName = selectedFile.name.split('.')[0];
        setTitle(fileName.replace(/[_-]/g, ' '));
      }
      
      // Read text files directly
      if (/\.(txt|md)$/i.test(selectedFile.name)) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setContent(event.target.result as string);
          }
        };
        reader.readAsText(selectedFile);
      }
    }
  };
  
  const handleImport = async () => {
    if (!title.trim()) {
      setError('Please provide a title for your note');
      return;
    }
    
    if (importTab === 'file' && !file) {
      setError('Please select a file to import');
      return;
    }
    
    if (importTab === 'paste' && !content.trim()) {
      setError('Please paste some content');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newNote = await importNote({
        title,
        file: importTab === 'file' ? file! : undefined,
        text: importTab === 'paste' ? content : undefined,
        saveOriginalFile: importTab === 'file' ? saveOriginalFile : false
      });
      
      toast({
        title: "Note imported",
        description: "Your note has been successfully imported.",
      });
      
      resetForm();
      setOpen(false);
      
      // Notify parent
      onNoteImported(newNote);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "An error occurred while importing your note.",
        variant: "destructive",
      });
      setError(error.message || "Import failed");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import Notes</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Notes</DialogTitle>
          <DialogDescription>
            Import your notes from different sources
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="file" value={importTab} onValueChange={setImportTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">
              <FileText className="mr-2 h-4 w-4" />
              From File
            </TabsTrigger>
            <TabsTrigger value="paste">
              <File className="mr-2 h-4 w-4" />
              Paste Text
            </TabsTrigger>
          </TabsList>
          
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
            
            <TabsContent value="file">
              <div className="space-y-4">
                <Label htmlFor="file-upload">Upload File</Label>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    id="file-upload"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt,.md,.doc,.docx,.pdf"
                  />
                </div>
                {file && (
                  <div className="text-sm text-muted-foreground">
                    Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Supported file types: .txt, .md, .doc, .docx, .pdf (max 10MB)
                </p>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="save-original" 
                    checked={saveOriginalFile}
                    onCheckedChange={(checked) => setSaveOriginalFile(checked as boolean)}
                  />
                  <Label htmlFor="save-original" className="text-sm font-normal">
                    Store original file (allows viewing and downloading the complete document)
                  </Label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="paste">
              <div className="space-y-4">
                <Label htmlFor="content">Paste Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your note content here"
                  className="min-h-[200px]"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Importing...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 