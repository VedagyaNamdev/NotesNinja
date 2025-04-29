import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight, ChevronLeft, Award, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// Interface for quiz questions
export interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct: string;
}

interface QuizComponentProps {
  content: string;
  onComplete?: (score: number, total: number) => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export default function QuizComponent({ content, onComplete, difficulty = 'medium' }: QuizComponentProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Parse the quiz questions when content changes
  useEffect(() => {
    if (!content) return;
    
    // Enhanced regex pattern to handle various formats with more flexible spacing and line breaks
    // This improves compatibility with different API response formats
    const quizPattern = /Q(?:uestion)?:\s*(.*?)(?:\r?\n|\r|\n)\s*A(?:\.|:)\s*(.*?)(?:\r?\n|\r|\n)\s*B(?:\.|:)\s*(.*?)(?:\r?\n|\r|\n)\s*C(?:\.|:)\s*(.*?)(?:\r?\n|\r|\n)\s*D(?:\.|:)\s*(.*?)(?:\r?\n|\r|\n)\s*(?:Correct(?:\ Answer)?|Answer):\s*([A-D])/gs;
    
    let parsedQuestions: QuizQuestion[] = [];
    
    let match;
    while ((match = quizPattern.exec(content)) !== null) {
      if (match[1] && match[2] && match[3] && match[4] && match[5] && match[6]) {
        parsedQuestions.push({
          question: match[1].trim(),
          options: {
            A: match[2].trim(),
            B: match[3].trim(),
            C: match[4].trim(),
            D: match[5].trim()
          },
          correct: match[6].trim()
        });
      }
    }
    
    // If no questions were found, try a more lenient approach
    if (parsedQuestions.length === 0) {
      // Try alternative format: Question followed by options A-D and then Correct answer
      const questions = content.split(/\n\s*(?=Q(?:uestion)?:)/g);
      
      parsedQuestions = questions
        .filter(q => q.trim())
        .map(q => {
          // Extract question - more flexible to handle different line breaks
          const questionMatch = q.match(/Q(?:uestion)?:\s*(.*?)(?:\r?\n|\r|\n|$)/);
          
          // Extract options with more flexible pattern matching
          const optionA = q.match(/A(?:\.|:)\s*(.*?)(?:\r?\n|\r|\n|$)/);
          const optionB = q.match(/B(?:\.|:)\s*(.*?)(?:\r?\n|\r|\n|$)/);
          const optionC = q.match(/C(?:\.|:)\s*(.*?)(?:\r?\n|\r|\n|$)/);
          const optionD = q.match(/D(?:\.|:)\s*(.*?)(?:\r?\n|\r|\n|$)/);
          
          // Extract correct answer - more flexible pattern
          const correctMatch = q.match(/(?:Correct(?:\ Answer)?|Answer):\s*([A-D])/i);
          
          if (questionMatch && optionA && optionB && optionC && optionD && correctMatch) {
            return {
              question: questionMatch[1].trim(),
              options: {
                A: optionA[1].trim(),
                B: optionB[1].trim(),
                C: optionC[1].trim(),
                D: optionD[1].trim()
              },
              correct: correctMatch[1].trim()
            };
          }
          return null;
        })
        .filter((q): q is QuizQuestion => q !== null);
    }

    // If we still don't have questions, try to extract them manually line by line
    if (parsedQuestions.length === 0) {
      try {
        const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line);
        let currentQuestion: Partial<QuizQuestion> = {};
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.startsWith('Q:') || line.startsWith('Question:') || line.match(/^[0-9]+[\.\)]\s*[^A-D]/)) {
            // If we already have a partial question, save it before starting a new one
            if (currentQuestion.question && 
                currentQuestion.options?.A && 
                currentQuestion.options?.B && 
                currentQuestion.options?.C && 
                currentQuestion.options?.D && 
                currentQuestion.correct) {
              parsedQuestions.push(currentQuestion as QuizQuestion);
            }
            
            // Start a new question - handle numbered questions too
            currentQuestion = {
              question: line.replace(/^(?:Q(?:uestion)?:|\d+[\.\)])\s*/, '').trim(),
              options: { A: '', B: '', C: '', D: '' },
              correct: ''
            };
          } else if (line.startsWith('A:') || line.startsWith('A.') || line.match(/^A\)\s/)) {
            if (currentQuestion.options) {
              currentQuestion.options.A = line.replace(/^A(?:\.|:|\))\s*/, '').trim();
            }
          } else if (line.startsWith('B:') || line.startsWith('B.') || line.match(/^B\)\s/)) {
            if (currentQuestion.options) {
              currentQuestion.options.B = line.replace(/^B(?:\.|:|\))\s*/, '').trim();
            }
          } else if (line.startsWith('C:') || line.startsWith('C.') || line.match(/^C\)\s/)) {
            if (currentQuestion.options) {
              currentQuestion.options.C = line.replace(/^C(?:\.|:|\))\s*/, '').trim();
            }
          } else if (line.startsWith('D:') || line.startsWith('D.') || line.match(/^D\)\s/)) {
            if (currentQuestion.options) {
              currentQuestion.options.D = line.replace(/^D(?:\.|:|\))\s*/, '').trim();
            }
          } else if (line.startsWith('Correct:') || line.startsWith('Answer:') || line.startsWith('Correct Answer:') || line.match(/^(?:Answer|Correct):?\s*([A-D])$/i)) {
            const correctMatch = line.match(/(?:Correct(?:\ Answer)?|Answer):?\s*([A-D])/i);
            if (correctMatch && ['A', 'B', 'C', 'D'].includes(correctMatch[1].toUpperCase())) {
              currentQuestion.correct = correctMatch[1].toUpperCase();
            }
            
            // We've reached the end of a question set, add it to our array if it's complete
            if (currentQuestion.question && 
                currentQuestion.options?.A && 
                currentQuestion.options?.B && 
                currentQuestion.options?.C && 
                currentQuestion.options?.D && 
                currentQuestion.correct) {
              parsedQuestions.push(currentQuestion as QuizQuestion);
              currentQuestion = {};
            }
          }
        }
        
        // Add the last question if it's complete
        if (currentQuestion.question && 
            currentQuestion.options?.A && 
            currentQuestion.options?.B && 
            currentQuestion.options?.C && 
            currentQuestion.options?.D && 
            currentQuestion.correct) {
          parsedQuestions.push(currentQuestion as QuizQuestion);
        }
      } catch (error) {
        // Silent error handling to prevent crashes
      }
    }
    
    // If we have questions, set them
    setQuestions(parsedQuestions);
  }, [content]);
  
  const handleSelectAnswer = (key: string) => {
    if (quizCompleted || selectedAnswers[currentQuestionIndex]) return;
    
    // Update selected answers
    const newAnswers = {
      ...selectedAnswers,
      [currentQuestionIndex]: key
    };
    setSelectedAnswers(newAnswers);
    
    // Show feedback animation for a short delay
    setTimeout(() => {
      // Move to next question after a short delay
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // For the last question, finish the quiz with the updated answers
        finishQuiz(newAnswers);
      }
    }, key === questions[currentQuestionIndex]?.correct ? 750 : 500);
  };
  
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };
  
  const moveToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const finishQuiz = (finalAnswers = selectedAnswers) => {
    // Calculate score - count all correct answers
    const quizScore = Object.entries(finalAnswers).reduce((acc, [index, answer]) => {
      const questionIndex = parseInt(index);
      const question = questions[questionIndex];
      return acc + (question && answer === question.correct ? 1 : 0);
    }, 0);
    
    setScore(quizScore);
    setShowResults(true);
    setQuizCompleted(true);
    
    // Call onComplete callback if provided, with score and total questions count
    if (onComplete && questions.length > 0) {
      try {
        onComplete(quizScore, questions.length);
      } catch (error) {
        toast.error('Error saving quiz result', {
          description: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Show confetti for scores above 70%
      if ((quizScore / questions.length) >= 0.7) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // Silent error handling
        }
      }
    }
  };
  
  const resetQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setQuizCompleted(false);
    setIsReviewing(false);
  };
  
  const startReview = () => {
    setIsReviewing(true);
    setReviewIndex(0);
  };
  
  const nextReviewQuestion = () => {
    if (reviewIndex < questions.length - 1) {
      setReviewIndex(prev => prev + 1);
    }
  };
  
  const prevReviewQuestion = () => {
    if (reviewIndex > 0) {
      setReviewIndex(prev => prev - 1);
    }
  };
  
  // If no questions were parsed successfully, return an error message
  if (questions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quiz</CardTitle>
          <CardDescription>No quiz questions could be parsed from the provided content.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-auto max-h-96">{content}</pre>
        </CardContent>
      </Card>
    );
  }
  
  // Show results screen
  if (showResults && !isReviewing) {
    const percentage = Math.round((score / questions.length) * 100);
    let resultMessage = "Try again!";
    let resultDescription = "Review the questions and try again to improve your score.";
    
    if (percentage >= 90) {
      resultMessage = "Excellent!";
      resultDescription = "Outstanding performance! You've mastered this topic.";
    } else if (percentage >= 70) {
      resultMessage = "Great job!";
      resultDescription = "You have a good understanding of the material.";
    } else if (percentage >= 50) {
      resultMessage = "Good effort!";
      resultDescription = "Keep studying to improve your knowledge.";
    }
    
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{resultMessage}</CardTitle>
            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium uppercase">
              {difficulty} difficulty
            </div>
          </div>
          <CardDescription>{resultDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="text-4xl font-bold">{percentage}%</div>
            <p className="text-muted-foreground text-sm">
              You got {score} out of {questions.length} questions correct.
            </p>
            <Progress value={percentage} className="h-2 w-full max-w-md mt-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={startReview}
            >
              <RefreshCw className="h-4 w-4" />
              Review Questions
            </Button>
            <Button 
              className="w-full flex items-center justify-center gap-2"
              onClick={resetQuiz}
            >
              <Award className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show review mode
  if (isReviewing) {
    const currentQuestion = questions[reviewIndex];
    const userAnswer = selectedAnswers[reviewIndex];
    const isCorrect = userAnswer === currentQuestion.correct;
    
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Question Review</CardTitle>
            <span className="text-sm text-muted-foreground">{reviewIndex + 1} / {questions.length}</span>
          </div>
          <Progress value={(reviewIndex + 1) / questions.length * 100} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="font-medium text-lg">{currentQuestion.question}</div>
          
          <div className="space-y-2">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <div
                key={key}
                className={`p-4 rounded-md border flex items-center ${
                  key === currentQuestion.correct 
                    ? 'border-green-500 bg-green-50/50' 
                    : key === userAnswer && key !== currentQuestion.correct 
                      ? 'border-red-500 bg-red-50/50' 
                      : 'border-muted'
                }`}
              >
                <div className="mr-2 font-medium min-w-8">{key}.</div>
                <div className="flex-1">{value}</div>
                {key === currentQuestion.correct && (
                  <div className="ml-2 bg-green-100 text-green-800 rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                {key === userAnswer && key !== currentQuestion.correct && (
                  <div className="ml-2 bg-red-100 text-red-800 rounded-full p-1">
                    <X className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="pt-4 text-sm text-muted-foreground">
            {isCorrect 
              ? 'You answered this question correctly!' 
              : `You selected "${userAnswer}" but the correct answer is "${currentQuestion.correct}".`
            }
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevReviewQuestion} 
            disabled={reviewIndex === 0}
            size="icon"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setIsReviewing(false)}>
            Back to Results
          </Button>
          <Button 
            variant="outline" 
            onClick={nextReviewQuestion}
            disabled={reviewIndex === questions.length - 1}
            size="icon"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Show quiz questions
  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = selectedAnswers[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Quiz</CardTitle>
          <span className="text-sm text-muted-foreground">{currentQuestionIndex + 1} / {questions.length}</span>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="font-medium text-lg">{currentQuestion.question}</div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <motion.div
                key={key}
                whileHover={{ scale: userAnswer ? 1 : 1.01 }}
                whileTap={{ scale: userAnswer ? 1 : 0.99 }}
                onClick={() => handleSelectAnswer(key)}
                className={`p-4 rounded-md border flex items-center cursor-pointer transition-all ${
                  userAnswer === key 
                    ? userAnswer === currentQuestion.correct 
                      ? 'border-green-500 bg-green-50/50 ring-2 ring-green-500 ring-offset-2' 
                      : 'border-red-500 bg-red-50/50 ring-2 ring-red-500 ring-offset-2'
                    : userAnswer && key === currentQuestion.correct
                      ? 'border-green-500 bg-green-50/50'
                      : userAnswer
                        ? 'border-muted opacity-70'
                        : 'border-muted hover:border-primary hover:bg-primary/5'
                }`}
              >
                <div className="mr-2 font-medium min-w-8">{key}.</div>
                <div className="flex-1">{value}</div>
                {userAnswer && key === currentQuestion.correct && (
                  <div className="ml-2 bg-green-100 text-green-800 rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                {userAnswer === key && key !== currentQuestion.correct && (
                  <div className="ml-2 bg-red-100 text-red-800 rounded-full p-1">
                    <X className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={moveToPreviousQuestion}
          disabled={currentQuestionIndex === 0 || !userAnswer}
        >
          Previous
        </Button>
        
        {userAnswer ? (
          <Button 
            onClick={moveToNextQuestion}
            disabled={!userAnswer}
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            disabled={answeredCount === 0}
            onClick={finishQuiz}
          >
            Skip to Results
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 