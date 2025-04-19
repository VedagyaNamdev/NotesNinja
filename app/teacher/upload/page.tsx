"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Upload, FileType, FileText, Image, BookText, PlusCircle, Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


const TeacherUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialType, setMaterialType] = useState('notes');
  const [materialSubject, setMaterialSubject] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Authentication check
  const { isAuthenticated, userRole } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (userRole !== 'teacher') {
      router.push(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, router]);

  // Don't render until authenticated
  if (!isAuthenticated || userRole !== 'teacher') {
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
      }, 1500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    // Reset form after a delay
    setTimeout(() => {
      setIsSubmitted(false);
      setUploadedFile(null);
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialType('notes');
      setMaterialSubject('');
    }, 3000);
  };

  return (
    <>
      <PageHeader 
        title="Upload Material" 
        description="Share educational content with your students."
      />
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4">
              <h2 className="text-lg font-medium">1. Upload Document</h2>
              
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
                          Supports PDF, images, and document files up to 20MB
                        </p>
                        <div className="relative">
                          <Button>Select File</Button>
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.ppt,.pptx"
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
                            type="button"
                            variant="outline"
                            onClick={() => setUploadedFile(null)}
                          >
                            Remove
                          </Button>
                          <div className="relative">
                            <Button type="button">Change File</Button>
                            <input 
                              type="file" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={handleFileUpload}
                              accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.ppt,.pptx"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex items-center space-x-4 pt-2">
                <div className="grid grid-cols-4 gap-2 flex-1">
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
                    <span className="text-sm">Documents</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookText className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Slides</span>
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
              <h2 className="text-lg font-medium">2. Material Details</h2>
              
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g., Physics: Laws of Motion"
                      value={materialTitle}
                      onChange={(e) => setMaterialTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Material Type</Label>
                      <Select 
                        value={materialType} 
                        onValueChange={setMaterialType}
                        required
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notes">Lecture Notes</SelectItem>
                          <SelectItem value="slides">Presentation Slides</SelectItem>
                          <SelectItem value="handout">Handout</SelectItem>
                          <SelectItem value="worksheet">Worksheet</SelectItem>
                          <SelectItem value="resource">Additional Resource</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select 
                        value={materialSubject} 
                        onValueChange={setMaterialSubject}
                        required
                      >
                        <SelectTrigger id="subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="physics">Physics</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="biology">Biology</SelectItem>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="history">History</SelectItem>
                          <SelectItem value="geography">Geography</SelectItem>
                          <SelectItem value="computer_science">Computer Science</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Briefly describe what this material covers..."
                      rows={4}
                      value={materialDescription}
                      onChange={(e) => setMaterialDescription(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (optional)</Label>
                    <Input id="tags" placeholder="e.g., kinematics, forces, energy (comma-separated)" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Separator className="my-6" />
          
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium mb-2">3. Sharing Options</h2>
              <p className="text-sm text-muted-foreground">
                Choose how you want to share this material with your students.
              </p>
            </div>
            
            <Card className="w-full sm:w-1/2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id="share-all"
                      name="sharing"
                      className="mt-1"
                      defaultChecked
                    />
                    <div>
                      <Label htmlFor="share-all" className="font-medium">Share with all students</Label>
                      <p className="text-sm text-muted-foreground">
                        All students in your classes will have access to this material.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id="share-specific"
                      name="sharing"
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="share-specific" className="font-medium">Share with specific classes</Label>
                      <p className="text-sm text-muted-foreground">
                        Select specific classes that will have access to this material.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      id="share-link"
                      name="sharing"
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor="share-link" className="font-medium">Share via link only</Label>
                      <p className="text-sm text-muted-foreground">
                        Only students with the link will have access to this material.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline">Save as Draft</Button>
            <Button 
              type="submit" 
              disabled={!uploadedFile || !materialTitle || !materialDescription || !materialSubject || isSubmitted}
              className="gap-2"
            >
              {isSubmitted ? (
                <>
                  <Check className="h-4 w-4" />
                  Material Uploaded
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Upload Material
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </form>
    </>
  );
};

export default TeacherUpload;
