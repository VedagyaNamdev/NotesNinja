"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenText, ChevronLeft, ChevronRight, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function StudentFlashcards() {
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
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [markedCorrect, setMarkedCorrect] = useState<number[]>([]);

  const flashcards = [
    { front: "What is the law of conservation of energy?", back: "Energy cannot be created or destroyed, only transformed from one form to another." },
    { front: "Define Newton's First Law of Motion", back: "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force." },
    { front: "What is the formula for calculating kinetic energy?", back: "KE = 1/2 × m × v² where m is mass and v is velocity." },
    { front: "Explain the concept of cellular respiration", back: "The process by which cells convert nutrients into ATP (energy) through a series of chemical reactions, typically using oxygen." },
    { front: "What does DNA stand for?", back: "Deoxyribonucleic Acid" },
  ];

  const quizQuestions = [
    {
      question: "Which of the following is NOT a type of chemical bond?",
      options: ["Ionic bond", "Covalent bond", "Magnetic bond", "Hydrogen bond"],
      correctAnswer: 2,
    },
    {
      question: "What is the primary function of mitochondria in a cell?",
      options: ["Protein synthesis", "Energy production", "Cell division", "Waste removal"],
      correctAnswer: 1,
    },
    {
      question: "Which planet has the most moons in our solar system?",
      options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
      correctAnswer: 1,
    },
  ];

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 300);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
      }, 300);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const resetDeck = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex(0);
      setMarkedCorrect([]);
    }, 300);
  };

  const markCorrect = () => {
    if (!markedCorrect.includes(currentCardIndex)) {
      setMarkedCorrect([...markedCorrect, currentCardIndex]);
    }
    nextCard();
  };

  // Don't render until authenticated
  if (!isAuthenticated || userRole !== 'student') {
    return null;
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader 
        title="Flashcards & Quizzes" 
        description="Review your notes with interactive flashcards and test your knowledge with quizzes."
        className="px-2 sm:px-0"
      />
      
      <Tabs defaultValue="flashcards" className="w-full">
        <TabsList className="mb-4 sm:mb-6 w-full justify-start overflow-auto">
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="flashcards" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            <motion.div 
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base sm:text-lg font-medium flex items-center">
                      <BookOpenText className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Physics Concepts
                    </h3>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Card {currentCardIndex + 1} of {flashcards.length}
                    </div>
                  </div>
                  
                  <div className="relative h-[200px] sm:h-[300px] w-full perspective-1000">
                    <AnimatePresence initial={false} mode="wait">
                      <motion.div
                        key={`card-${currentCardIndex}-${isFlipped ? 'back' : 'front'}`}
                        initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 w-full h-full"
                      >
                        <div 
                          onClick={flipCard}
                          className={`cursor-pointer w-full h-full border rounded-xl flex items-center justify-center p-4 sm:p-8 text-center bg-card transition-shadow hover:shadow-md ${markedCorrect.includes(currentCardIndex) ? 'border-green-500 border-2' : ''}`}
                        >
                          <div>
                            {!isFlipped ? (
                              <div className="text-base sm:text-xl font-medium overflow-auto max-h-[160px] sm:max-h-[240px]">{flashcards[currentCardIndex].front}</div>
                            ) : (
                              <div className="text-base sm:text-xl overflow-auto max-h-[160px] sm:max-h-[240px]">{flashcards[currentCardIndex].back}</div>
                            )}
                            <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
                              {isFlipped ? "Click to see question" : "Click to see answer"}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-3 sm:justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={prevCard}
                      disabled={currentCardIndex === 0}
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    
                    <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetDeck}
                        className="flex-1 sm:flex-none"
                      >
                        <RotateCcw className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Reset</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={markCorrect}
                        className="flex-1 sm:flex-none text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle2 className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Correct</span>
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={nextCard}
                      disabled={currentCardIndex === flashcards.length - 1}
                      className="w-full sm:w-auto"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Study Progress</h3>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-xs sm:text-sm font-medium">Current Deck</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {markedCorrect.length} of {flashcards.length} cards
                        </div>
                      </div>
                      <Progress value={(markedCorrect.length / flashcards.length) * 100} className="h-2" />
                    </div>
                    
                    <div className="pt-2 sm:pt-4">
                      <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Recently Studied Decks</h4>
                      <div className="space-y-2 sm:space-y-3">
                        {[
                          { name: "Biology Terms", progress: 85 },
                          { name: "Chemistry Elements", progress: 70 },
                          { name: "Math Formulas", progress: 95 },
                        ].map((deck, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span>{deck.name}</span>
                              <span className="text-muted-foreground">{deck.progress}%</span>
                            </div>
                            <Progress value={deck.progress} className="h-1 sm:h-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-2 sm:pt-4">
                      <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Suggested Decks</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {["History: World War II", "Geography: Continents", "Literature: Shakespeare"].map((deck, i) => (
                          <Button key={i} variant="outline" className="w-full justify-start text-left text-xs sm:text-sm" size="sm">
                            {deck}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
        
        <TabsContent value="quizzes" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            <motion.div 
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium mb-4 sm:mb-6">Science Quiz</h3>
                  
                  <div className="space-y-6 sm:space-y-8">
                    {quizQuestions.map((q, qIndex) => (
                      <div key={qIndex} className="space-y-2 sm:space-y-3">
                        <h4 className="text-sm sm:text-base font-medium">Question {qIndex + 1}: {q.question}</h4>
                        <div className="space-y-2">
                          {q.options.map((option, oIndex) => (
                            <div 
                              key={oIndex}
                              className="flex items-center space-x-3 p-2 sm:p-3 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                            >
                              <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border flex items-center justify-center">
                                <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-transparent"></div>
                              </div>
                              <span className="text-xs sm:text-sm">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 sm:mt-8 flex justify-end">
                    <Button>Submit Answers</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Quiz History</h3>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-2 sm:space-y-3">
                      {[
                        { name: "Biology Basics", score: "8/10", date: "2 days ago" },
                        { name: "Physics Laws", score: "7/10", date: "1 week ago" },
                        { name: "Chemistry Elements", score: "9/10", date: "2 weeks ago" },
                      ].map((quiz, i) => (
                        <div key={i} className="flex items-center justify-between p-2 sm:p-3 border rounded-md">
                          <div>
                            <div className="text-xs sm:text-sm font-medium">{quiz.name}</div>
                            <div className="text-xs text-muted-foreground">{quiz.date}</div>
                          </div>
                          <div className="text-xs sm:text-sm font-medium">Score: {quiz.score}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-2 sm:pt-4">
                      <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Available Quizzes</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {["History: Ancient Civilizations", "Mathematics: Calculus", "Computer Science: Algorithms"].map((quiz, i) => (
                          <Button key={i} variant="outline" className="w-full justify-start text-left text-xs sm:text-sm" size="sm">
                            {quiz}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
