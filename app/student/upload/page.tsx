"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Upload, FileType, FileText, Image, File, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { extractTextFromFile } from '@/lib/file-processing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Define content types
type ContentType = 'bullets' | 'summary' | 'keyTerms';

// Define generated content structure
interface GeneratedContent {
  bullets: string | null;
  summary: string | null;
  keyTerms: string | null;
}

const StudentUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({
    bullets: null,
    summary: null,
    keyTerms: null
  });
  
  // Authentication check
  const { isAuthenticated, userRole } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (userRole !== 'student') {
      router.push(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, router]);

  // Don't render until authenticated
  if (!isAuthenticated || userRole !== 'student') {
    return null;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        setError(null);
      setUploadedFile(files[0]);
        setIsUploading(true);
        
        // Extract text from the uploaded file
        const text = await extractTextFromFile(files[0]);
        setExtractedText(text);
        
        // Set preview (use first 1000 characters for preview)
        setPreviewText(text.length > 1000 ? text.substring(0, 1000) + '...' : text);
        
        setIsUploading(false);
      } catch (error) {
        setIsUploading(false);
        setError(error instanceof Error ? error.message : 'An error occurred while processing the file');
        toast.error('File processing failed', {
          description: error instanceof Error ? error.message : 'Failed to extract text from the file'
        });
      }
    }
  };

  // More robust implementation that processes content types sequentially
  const handleProcessing = async () => {
    if (!extractedText) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Content types to generate
      const contentTypes: ContentType[] = ['bullets', 'summary', 'keyTerms'];
      
      // Initialize with empty content
      const newContent: GeneratedContent = {
        bullets: null,
        summary: null,
        keyTerms: null
      };
      
      // Process one type at a time to avoid overwhelming the API
      for (const type of contentTypes) {
        try {
          const response = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: extractedText, type })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            console.error(`Error generating ${type}:`, errorData);
            // Continue with other types instead of failing completely
            continue;
          }
          
          const data = await response.json();
          newContent[type] = data.content;
        } catch (typeError) {
          console.error(`Error processing ${type}:`, typeError);
          // Continue with other types
          continue;
        }
      }
      
      // Update state with whatever content we were able to generate
      setGeneratedContent(newContent);
      
      // If all failed, show error
      if (!newContent.bullets && !newContent.summary && !newContent.keyTerms) {
        setError('Failed to generate any content. Please try again with a different document.');
        toast.error('AI processing failed', {
          description: 'Could not generate any content. Try a different document or try again later.'
        });
      }
      
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
      setError(errorMessage);
      
      toast.error('AI processing failed', {
        description: errorMessage
      });
    }
  };

  // Helper function to render bullet points
  const renderBulletPoints = (content: string) => {
    if (!content) return null;
    
    // Check if content is already in bullet points format (starts with -)
    if (content.trim().startsWith('- ')) {
      return (
        <ul className="space-y-2 list-disc pl-5">
          {content.split('\n').filter(line => line.trim()).map((line, i) => (
            <li key={i}>{line.replace(/^-\s*/, '')}</li>
          ))}
        </ul>
      );
    }
    
    // Otherwise, just split by newlines
    return (
      <ul className="space-y-2 list-disc pl-5">
        {content.split('\n').filter(line => line.trim()).map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    );
  };

  // Helper function to render key terms and formulas
  const renderKeyTerms = () => {
    if (!generatedContent.keyTerms) return null;
    
    try {
      // Check for "Formulas" section separate from terms
      const hasFormulasSection = generatedContent.keyTerms.includes("Formulas:") || 
                                 generatedContent.keyTerms.includes("FORMULAS") ||
                                 generatedContent.keyTerms.includes("Formulas");
      
      let termsContent = generatedContent.keyTerms;
      let formulasContent = "";
      
      // Extract formulas section if it exists
      if (hasFormulasSection) {
        const parts = generatedContent.keyTerms.split(/formulas:?/i);
        if (parts.length > 1) {
          termsContent = parts[0].trim();
          formulasContent = parts[1].trim();
        }
      }
      
      // First try standard "Term:" "Definition:" format
      const termPattern = /Term:\s*(.*?)\s*\n\s*Definition:\s*(.*?)(?=\n\s*Term:|$)/gs;
      let match;
      const terms = [];
      
      while ((match = termPattern.exec(termsContent)) !== null) {
        terms.push({
          term: match[1].trim(),
          definition: match[2].trim()
        });
      }
      
      // If we found terms in the expected format, render them
      if (terms.length > 0) {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Key Terms</h2>
              <div className="space-y-4">
                {terms.map((item, index) => (
                  <div key={index} className="border-b pb-2">
                    <p className="font-bold">{item.term}</p>
                    <p>{item.definition}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {formulasContent && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Formulas</h2>
                <div className="whitespace-pre-wrap">{formulasContent}</div>
              </div>
            )}
          </div>
        );
      }
      
      // Try to detect key terms from repeated patterns in the text
      // Look for "key: value" or "key - value" patterns
      const lines = termsContent.split('\n').map(line => line.trim()).filter(Boolean);
      const alternativeTerms = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for terms followed by definitions separated by a hyphen or colon
        const dashSeparated = line.match(/^([^-]+)\s*-\s*(.+)$/);
        const colonSeparated = line.match(/^([^:]+):\s*(.+)$/);
        
        if (dashSeparated) {
          alternativeTerms.push({
            term: dashSeparated[1].trim(),
            definition: dashSeparated[2].trim()
          });
        } else if (colonSeparated) {
          alternativeTerms.push({
            term: colonSeparated[1].trim(),
            definition: colonSeparated[2].trim()
          });
        } 
        // Check if this might be a term followed by a definition on the next line
        else if (i + 1 < lines.length && !lines[i+1].includes('-') && !lines[i+1].includes(':')) {
          // If the current line is short and the next line is longer, treat as term-definition
          if (line.length < 50 && lines[i+1].length > line.length) {
            alternativeTerms.push({
              term: line,
              definition: lines[i+1]
            });
            i++; // Skip the next line since we've used it
          }
        }
      }
      
      // If we found terms in an alternative format, render them
      if (alternativeTerms.length > 0) {
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Key Terms</h2>
              <div className="space-y-4">
                {alternativeTerms.map((item, index) => (
                  <div key={index} className="border-b pb-2">
                    <p className="font-bold">{item.term}</p>
                    <p>{item.definition}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {formulasContent && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Formulas</h2>
                <div className="whitespace-pre-wrap">{formulasContent}</div>
              </div>
            )}
          </div>
        );
      }
      
      // Last resort: if AI is returning "Definition" "Term" format (inverted format)
      // This handles the case mentioned in the conversation
      const invertedPattern = /Definition:\s*(.*?)\s*\n\s*Term:\s*(.*?)(?=\n\s*Definition:|$)/gs;
      const invertedTerms = [];
      
      while ((match = invertedPattern.exec(termsContent)) !== null) {
        invertedTerms.push({
          definition: match[1].trim(),
          term: match[2].trim()
        });
      }
      
      if (invertedTerms.length > 0) {
        return (
          <div>
            <h2 className="text-xl font-semibold mb-3">Key Terms</h2>
            <div className="space-y-4">
              {invertedTerms.map((item, index) => (
                <div key={index} className="border-b pb-2">
                  <p className="font-bold">{item.term}</p>
                  <p>{item.definition}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      // Fallback to displaying the raw content with proper line breaks
      return (
        <div>
          <h2 className="text-xl font-semibold mb-2">Key Terms and Formulas</h2>
          <div className="whitespace-pre-wrap">{generatedContent.keyTerms}</div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering key terms:", error);
      // Fallback in case of error
      return (
        <div>
          <h2 className="text-xl font-semibold mb-2">Key Terms and Formulas</h2>
          <div className="whitespace-pre-wrap">{generatedContent.keyTerms}</div>
        </div>
      );
    }
  };

  const handleSubmit = async () => {
    if (!uploadedFile || !extractedText || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Create FormData for API processing
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process note');
      }
      
      const data = await response.json();
      
      // Extract notes, keyTerms, quizzes, formulas from response
      const { notes, keyTerms, quizzes, formulas } = data;
      
      // Save note statistics to localStorage
      const noteId = generateId();
      saveNoteStatistics(uploadedFile.name || 'Untitled Note', noteId);
      
      // Store processed note
      const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
      const newNote = {
        id: noteId,
        title: uploadedFile.name || 'Untitled Note',
        content: extractedText,
        keyTerms: generatedContent.keyTerms || "",
        summary: generatedContent.summary || "",
        bullets: generatedContent.bullets || "",
        quizzes: quizzes || [],
        formulas: formulas || [],
        date: new Date().toISOString()
      };
      
      localStorage.setItem('savedNotes', JSON.stringify([...savedNotes, newNote]));
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error processing note:', error);
      toast.error('Error processing note. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to save note statistics to localStorage
  const saveNoteStatistics = (noteTitle: string, noteId: string) => {
    const notesStats = JSON.parse(localStorage.getItem('notesStatistics') || '[]');
    const newNoteStat = {
      id: noteId,
      title: noteTitle,
      date: new Date().toISOString()
    };
    localStorage.setItem('notesStatistics', JSON.stringify([...notesStats, newNoteStat]));
  };

  // Generate a random ID for notes
  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  return (
    <>
      <PageHeader 
        title="Upload Notes" 
        description="Upload your notes for AI-powered summarization and flashcard generation."
      />
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">
            <h2 className="text-lg font-medium">1. Upload Your Document</h2>
            
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-10 px-6">
                  <div className="mb-4 bg-primary/10 p-4 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  
                  {!uploadedFile ? (
                    <>
                      <h3 className="text-lg font-medium mb-2">Drag & drop your files here</h3>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Supports PDF, images, and text files up to 10MB
                      </p>
                      <div className="relative">
                        <Button>Select File</Button>
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                          accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-2">File uploaded successfully</h3>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        {uploadedFile.name} • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUploadedFile(null);
                            setPreviewText('');
                            setExtractedText('');
                            setGeneratedContent({
                              bullets: null,
                              summary: null,
                              keyTerms: null
                            });
                          }}
                        >
                          Remove
                        </Button>
                        <div className="relative">
                          <Button>Change File</Button>
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center space-x-4 pt-2">
              <div className="grid grid-cols-3 gap-2 flex-1">
                <div className="flex items-center space-x-2">
                  <FileType className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">PDF</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Image className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Images</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Text</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">2. Preview & Process</h2>
              <Button 
                variant="default" 
                onClick={handleProcessing}
                disabled={!previewText || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Processing...
                  </>
                ) : "Process with AI"}
              </Button>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {previewText ? (
                  <div className="min-h-[300px] max-h-[400px] overflow-y-auto prose prose-sm">
                    {previewText.split('\n\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> 
                          Processing upload...
                        </>
                      ) : "Upload a document to see preview"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
      
      {(isProcessing || generatedContent.summary || generatedContent.bullets || generatedContent.keyTerms) ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-8"
        >
          <Separator className="my-6" />
          
          <h2 className="text-lg font-medium mb-4">3. AI-Generated Summaries</h2>
          
          <Tabs defaultValue="bullets">
            <TabsList className="mb-4">
              <TabsTrigger value="bullets">Bullet Points</TabsTrigger>
              <TabsTrigger value="summary">Full Summary</TabsTrigger>
              <TabsTrigger value="formulas">Formulas & Key Terms</TabsTrigger>
            </TabsList>
            
            <Card>
              <CardContent className="pt-6">
                <TabsContent value="bullets" className="m-0">
                  {isProcessing ? (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Generating bullet points...
                      </p>
                    </div>
                  ) : generatedContent.bullets ? (
                    renderBulletPoints(generatedContent.bullets)
                  ) : (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No bullet points generated yet
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="summary" className="m-0">
                  {isProcessing ? (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Generating summary...
                      </p>
                    </div>
                  ) : generatedContent.summary ? (
                    <div className="prose prose-sm">
                      {generatedContent.summary.split('\n\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No summary generated yet
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="formulas" className="m-0">
                  {isProcessing ? (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Extracting formulas and key terms...
                      </p>
                    </div>
                  ) : generatedContent.keyTerms ? (
                    renderKeyTerms()
                  ) : (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No formulas or key terms extracted yet
                      </p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="outline"
              disabled={!generatedContent.summary}
              onClick={handleSubmit}
            >
              Save Note
            </Button>
            <Button
              onClick={() => {
                // Save the extracted text and redirect to flashcards page
                if (extractedText) {
                  localStorage.setItem('notesPendingForFlashcards', extractedText);
                  localStorage.setItem('notesPendingFileName', uploadedFile?.name || 'Untitled Notes');
                  
                  toast.success('Notes ready!', {
                    description: 'Redirecting to flashcards & quizzes page...'
                  });
                  
                  setTimeout(() => {
                    router.push('/student/flashcards');
                  }, 1000);
                }
              }}
            >
              Create Flashcards & Quizzes
            </Button>
          </div>
        </motion.div>
      ) : null}
    </>
  );
};

export default StudentUpload;
