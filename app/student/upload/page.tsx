"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Upload, FileType, FileText, Image, File } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


const StudentUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewText, setPreviewText] = useState('');
  
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
      
      // Simulate file upload
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setPreviewText('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.');
      }, 1500);
    }
  };

  const handleProcessing = () => {
    if (!previewText) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <>
      <PageHeader 
        title="Upload Notes" 
        description="Upload your notes for AI-powered summarization and flashcard generation."
      />
      
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
                          onClick={() => setUploadedFile(null)}
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
                {isProcessing ? "Processing..." : "Process with AI"}
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
                      {isUploading ? "Processing upload..." : "Upload a document to see preview"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
      
      {isProcessing || previewText ? (
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
                      <p className="text-muted-foreground">Generating bullet points...</p>
                    </div>
                  ) : (
                    <ul className="space-y-2 list-disc pl-5">
                      <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                      <li>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</li>
                      <li>Ut enim ad minim veniam, quis nostrud exercitation.</li>
                      <li>Duis aute irure dolor in reprehenderit in voluptate velit.</li>
                      <li>Excepteur sint occaecat cupidatat non proident.</li>
                      <li>Sunt in culpa qui officia deserunt mollit anim id est laborum.</li>
                    </ul>
                  )}
                </TabsContent>
                
                <TabsContent value="summary" className="m-0">
                  {isProcessing ? (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground">Generating summary...</p>
                    </div>
                  ) : (
                    <div className="prose prose-sm">
                      <p>
                        The text discusses the fundamental principles of a topic, outlining several key concepts and their practical applications. It explores the relationship between theoretical foundations and real-world implementations, providing examples to illustrate complex ideas in an accessible manner.
                      </p>
                      <p>
                        The author emphasizes the importance of understanding core principles before moving to advanced applications. Several methodologies are compared, with their respective strengths and limitations evaluated in different contexts. The conclusion suggests further areas for exploration and potential future developments in the field.
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="formulas" className="m-0">
                  {isProcessing ? (
                    <div className="min-h-[200px] flex items-center justify-center">
                      <p className="text-muted-foreground">Extracting formulas and key terms...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Key Formulas:</h3>
                        <div className="grid gap-2">
                          <Card className="p-3 bg-muted/50">
                            <code>E = mc²</code>
                          </Card>
                          <Card className="p-3 bg-muted/50">
                            <code>F = ma</code>
                          </Card>
                          <Card className="p-3 bg-muted/50">
                            <code>PV = nRT</code>
                          </Card>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Key Terms:</h3>
                        <div className="flex flex-wrap gap-2">
                          {["Quantum", "Relativity", "Thermodynamics", "Conservation", "Entropy", "Momentum"].map((term, i) => (
                            <div key={i} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                              {term}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline">Download Summary</Button>
            <Button>Create Flashcards</Button>
          </div>
        </motion.div>
      ) : null}
    </>
  );
};

export default StudentUpload;
