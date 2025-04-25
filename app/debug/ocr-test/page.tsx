"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { createWorker } from 'tesseract.js';

export default function OcrTestPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWorkerLoading, setIsWorkerLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setExtractedText(null);
    setProcessingTime(null);
    setProgressStatus('');
    
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        // Check file extension if MIME type is not detected
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const hasImageExtension = imageExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        
        if (!hasImageExtension) {
          setError('Please select an image file (JPEG, PNG, etc.)');
          setSelectedFile(null);
          setPreviewUrl(null);
          return;
        }
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };
  
  const processImage = async () => {
    if (!selectedFile) {
      setError('Please select an image file first');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setExtractedText(null);
    setProcessingTime(null);
    setProgressStatus('Initializing...');
    
    try {
      // Convert file to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('FileReader did not produce a string result'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      
      // Process directly in the browser using Tesseract.js
      setProgressStatus('Creating worker...');
      setIsWorkerLoading(true);
      
      const startTime = Date.now();
      
      // Create and initialize worker
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          console.log(m);
          if (m.status === 'recognizing text') {
            setProgressStatus(`Recognizing text: ${Math.floor(m.progress * 100)}%`);
          } else {
            setProgressStatus(m.status);
          }
        }
      });
      
      setIsWorkerLoading(false);
      setProgressStatus('Processing image...');
      
      // Recognize text
      const result = await worker.recognize(dataUrl);
      const duration = Date.now() - startTime;
      
      // Set results
      setExtractedText(result.data.text);
      setProcessingTime(duration);
      setProgressStatus('Complete');
      
      // Terminate worker
      await worker.terminate();
      
      toast.success('OCR processing complete');
    } catch (error) {
      console.error('OCR test error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during OCR processing');
      toast.error('OCR processing failed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">OCR Testing Tool</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Image Input</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6">
                {previewUrl ? (
                  <div className="relative w-full">
                    <img
                      src={previewUrl}
                      alt="Selected image"
                      className="max-h-64 max-w-full mx-auto rounded"
                    />
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          setExtractedText(null);
                          setProcessingTime(null);
                          setProgressStatus('');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Select an image to extract text
                    </p>
                    <div className="relative">
                      <Button>Select Image</Button>
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileSelect}
                        accept="image/*"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {selectedFile && (
                <div className="text-sm text-gray-500">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
              
              {error && (
                <div className="text-sm text-red-500 mt-2">
                  {error}
                </div>
              )}
              
              <Button 
                className="w-full"
                onClick={processImage}
                disabled={!selectedFile || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isWorkerLoading ? 'Loading OCR engine...' : 'Processing...'}
                  </>
                ) : "Extract Text from Image"}
              </Button>
              
              {progressStatus && (
                <div className="text-xs text-gray-500 text-center mt-2">
                  {progressStatus}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Extracted Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-gray-500">
                    {isWorkerLoading 
                      ? 'Loading OCR engine (this may take a moment)...' 
                      : 'Processing image with OCR...'}
                  </p>
                </div>
              ) : extractedText ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    Processing time: {processingTime} ms
                  </div>
                  <Separator />
                  <div className="whitespace-pre-wrap p-4 border rounded bg-gray-50 min-h-[200px]">
                    {extractedText}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No text extracted yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 