"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { FlaskConical, Plus, Minus, FileText, FileCheck, Download, AlarmCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


const TeacherTestGenerator = () => {
  const [testTitle, setTestTitle] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  
  const [questions, setQuestions] = useState([
    { type: 'mcq', quantity: 5, difficulty: 'medium' },
    { type: 'short', quantity: 3, difficulty: 'easy' },
    { type: 'long', quantity: 2, difficulty: 'hard' },
  ]);

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

  const handleAddQuestion = () => {
    setQuestions([...questions, { type: 'mcq', quantity: 1, difficulty: 'medium' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionTypeChange = (value: string, index: number) => {
    const newQuestions = [...questions];
    newQuestions[index].type = value;
    setQuestions(newQuestions);
  };

  const handleQuestionQuantityChange = (value: string, index: number) => {
    const newQuestions = [...questions];
    newQuestions[index].quantity = parseInt(value, 10);
    setQuestions(newQuestions);
  };

  const handleQuestionDifficultyChange = (value: string, index: number) => {
    const newQuestions = [...questions];
    newQuestions[index].difficulty = value;
    setQuestions(newQuestions);
  };

  const handleGenerateTest = () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 3000);
  };

  const getQuestionTotal = () => {
    return questions.reduce((total, question) => total + question.quantity, 0);
  };

  return (
    <>
      <PageHeader 
        title="Test Generator" 
        description="Create AI-generated tests and exams based on your uploaded materials."
      />
      
      <div className="grid md:grid-cols-5 gap-6">
        <motion.div 
          className="md:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Midterm Exam: Physics Mechanics"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select 
                      value={testSubject} 
                      onValueChange={setTestSubject}
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="source">Source Material</Label>
                    <Select defaultValue="material_1">
                      <SelectTrigger id="source">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material_1">Physics: Mechanics (All chapters)</SelectItem>
                        <SelectItem value="material_2">Physics: Laws of Motion</SelectItem>
                        <SelectItem value="material_3">Physics: Energy and Work</SelectItem>
                        <SelectItem value="material_4">Physics: Momentum</SelectItem>
                        <SelectItem value="custom">Use custom content</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Test Description or Instructions (Optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Add instructions for students taking this test..."
                    rows={3}
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-medium">Question Configuration</h3>
                  <div className="text-sm text-muted-foreground">
                    Total Questions: {getQuestionTotal()}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 border rounded-md">
                      <div className="grid flex-1 grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor={`type-${index}`} className="text-xs">Question Type</Label>
                          <Select 
                            value={question.type} 
                            onValueChange={(value) => handleQuestionTypeChange(value, index)}
                          >
                            <SelectTrigger id={`type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mcq">Multiple Choice</SelectItem>
                              <SelectItem value="short">Short Answer</SelectItem>
                              <SelectItem value="long">Long Answer</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="matching">Matching</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`quantity-${index}`} className="text-xs">Number of Questions</Label>
                          <Select 
                            value={question.quantity.toString()} 
                            onValueChange={(value) => handleQuestionQuantityChange(value, index)}
                          >
                            <SelectTrigger id={`quantity-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`difficulty-${index}`} className="text-xs">Difficulty Level</Label>
                          <Select 
                            value={question.difficulty} 
                            onValueChange={(value) => handleQuestionDifficultyChange(value, index)}
                          >
                            <SelectTrigger id={`difficulty-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveQuestion(index)}
                        disabled={questions.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleAddQuestion}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question Type
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-base font-medium">Advanced Options</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Time Limit (minutes)</Label>
                    <Select defaultValue="60">
                      <SelectTrigger id="time">
                        <SelectValue placeholder="Select time limit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="unlimited">No time limit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="questions-per-page">Questions Per Page</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="questions-per-page">
                        <SelectValue placeholder="Select display option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 question per page</SelectItem>
                        <SelectItem value="5">5 questions per page</SelectItem>
                        <SelectItem value="10">10 questions per page</SelectItem>
                        <SelectItem value="all">All questions on one page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  disabled={!testTitle || !testSubject || isGenerating}
                  onClick={handleGenerateTest}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>Generating Test...</>
                  ) : (
                    <>
                      <FlaskConical className="h-4 w-4" />
                      Generate Test
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div 
          className="md:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {!isGenerated ? (
                  <div className="h-96 flex flex-col items-center justify-center text-center p-4">
                    <div className="mb-4 bg-muted/50 p-4 rounded-full">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No test generated yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure your test settings and click the Generate button to create a new test.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 border rounded-md">
                      <h3 className="text-xl font-bold mb-2">{testTitle || "Physics Midterm Exam"}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {testDescription || "Complete all questions in the time allotted. Show all your work for partial credit."}
                      </p>
                      
                      <Separator className="my-4" />
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h4 className="font-medium">Multiple Choice Questions (5)</h4>
                          <p className="text-sm text-muted-foreground">Select the best answer for each question.</p>
                          
                          <div className="p-3 border rounded-md">
                            <div className="font-medium mb-2">1. What is Newton&apos;s First Law of Motion?</div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full border border-input flex-shrink-0"></div>
                                <span>A. Force equals mass times acceleration</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full border border-input flex-shrink-0"></div>
                                <span>B. An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an outside force</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full border border-input flex-shrink-0"></div>
                                <span>C. For every action, there is an equal and opposite reaction</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full border border-input flex-shrink-0"></div>
                                <span>D. Energy cannot be created or destroyed, only transformed</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Short Answer Questions (3)</h4>
                          <p className="text-sm text-muted-foreground">Answer each question in 2-3 sentences.</p>
                          
                          <div className="p-3 border rounded-md">
                            <div className="font-medium mb-2">6. Explain the principle of conservation of momentum and provide a real-world example.</div>
                            <div className="border-b border-dashed pt-8"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Long Answer Questions (2)</h4>
                          <p className="text-sm text-muted-foreground">Provide detailed explanations with examples.</p>
                          
                          <div className="p-3 border rounded-md">
                            <div className="font-medium mb-2">9. Describe the relationship between work, energy, and power. Include relevant equations and explain how they are interconnected.</div>
                            <div className="border-b border-dashed pt-8"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" className="gap-2">
                        <FileCheck className="h-4 w-4" />
                        Edit Test
                      </Button>
                      <Button className="gap-2">
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recently Generated Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: "Chemistry Final Exam", date: "Apr 15, 2025", questions: 25 },
                    { title: "Biology Midterm", date: "Apr 10, 2025", questions: 20 },
                    { title: "Physics Quiz: Forces", date: "Apr 5, 2025", questions: 15 },
                  ].map((test, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted/50 p-2 rounded-full">
                          <AlarmCheck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{test.title}</div>
                          <div className="text-xs text-muted-foreground">{test.date} • {test.questions} questions</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default TeacherTestGenerator;
