"use client";

import React, { useState, useEffect } from 'react';
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
import { saveNote } from '@/lib/data-service';

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

  // Helper function to render key terms and definitions
  const renderKeyTerms = (content: string) => {
    try {
      if (!content) {
        return <p>No key terms found.</p>;
      }

      // Extract formula data if present
      let formulaContent = '';
      if (content.includes('Formulas:')) {
        const formulaParts = content.split('Formulas:');
        content = formulaParts[0].trim();
        formulaContent = formulaParts[1].trim();
      }

      let terms: { term: string; definition: string }[] = [];

      // Improved regex pattern to better match the expected format from the API
      const cleanTermPattern = /Term:\s*(.*?)(?:\s*\n|\r\n|\r)\s*Definition:\s*(.*?)(?=(?:\s*\n|\r\n|\r)\s*Term:|\s*$)/gs;
      let match;
      let found = false;

      while ((match = cleanTermPattern.exec(content)) !== null) {
        found = true;
        const term = match[1].trim();
        const definition = match[2].trim();
        
        // Only add if not a duplicate and both term and definition are non-empty
        if (term && definition && !terms.some(t => t.term === term)) {
          terms.push({ term, definition });
        }
      }

      // If no structured content found with the expected pattern, try alternative approaches
      if (!found || terms.length === 0) {
        // Look for lines that start with "Term:" and "Definition:"
        const lines = content.split(/\n|\r\n|\r/).map(line => line.trim()).filter(line => line);
        let currentTerm = '';
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.startsWith('Term:')) {
            currentTerm = line.substring(5).trim();
          } else if (line.startsWith('Definition:') && currentTerm) {
            const definition = line.substring(11).trim();
            if (definition && !terms.some(t => t.term === currentTerm)) {
              terms.push({ term: currentTerm, definition });
              currentTerm = '';
            }
          }
        }
        
        found = terms.length > 0;
      }

      // If still no matches, try bullet format
      if (!found || terms.length === 0) {
        const bulletLines = content.split(/\n|\r\n|\r/).map(line => line.trim()).filter(line => line);
        
        for (let i = 0; i < bulletLines.length; i += 2) {
          if (i + 1 < bulletLines.length) {
            const term = bulletLines[i].replace(/^[•\-*]\s*/, '').trim();
            const definition = bulletLines[i + 1].replace(/^[•\-*]\s*/, '').trim();
            
            // Skip heading lines or empty entries
            if (term && definition && 
                !term.includes('Key Terms') && !term.includes('Formulas') && 
                !terms.some(t => t.term === term)) {
              terms.push({ term, definition });
            }
          }
        }
      }

      // If still no structured content found, display raw content as fallback
      if (terms.length === 0) {
        return (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap">{content}</div>
            {formulaContent && (
              <div>
                <h3 className="text-lg font-semibold mt-4 mb-2">Formulas</h3>
                <div className="whitespace-pre-wrap">{formulaContent}</div>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {terms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {terms.map((item, idx) => (
                <div key={idx} className="bg-white shadow rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-600">{item.term}</h3>
                  <p>{item.definition}</p>
                </div>
              ))}
            </div>
          )}
          {formulaContent && (
            <div>
              <h3 className="text-lg font-semibold mt-4 mb-2">Formulas</h3>
              <div className="whitespace-pre-wrap">{formulaContent}</div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering key terms:", error);
      return <div className="whitespace-pre-wrap">{content}</div>;
    }
  };

  // Handle submit/save note
  const handleSubmit = async () => {
    if (!uploadedFile || !extractedText) {
      toast.error('Please upload and process a file first');
      return;
    }
    
    try {
    setIsProcessing(true);
      
      // Prepare note data
      const noteData = {
        title: uploadedFile.name || 'Untitled Note',
        content: extractedText,
        summary: generatedContent.summary || "",
        keyTerms: generatedContent.keyTerms || "",
        bullets: generatedContent.bullets || ""
      };
      
      // Save note to database
      const savedNote = await saveNote(noteData);
      
      toast.success('Note saved successfully to your account');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Error saving note. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
      
      {(isProcessing || generatedContent.summary || generatedContent.bullets) ? (
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
              <TabsTrigger value="keyTerms">Key Terms</TabsTrigger>
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
                
                <TabsContent value="keyTerms" className="m-0">
                  {isProcessing ? (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Generating key terms...
                      </p>
                    </div>
                  ) : generatedContent.keyTerms ? (
                    renderKeyTerms(generatedContent.keyTerms)
                  ) : (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        No key terms generated yet
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
                    description: 'Redirecting to create flashcards & quizzes in your account...'
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
