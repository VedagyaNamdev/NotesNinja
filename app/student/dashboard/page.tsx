"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import MetricCard from '@/components/ui/card-metrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Calendar, Brain, ListChecks, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  // Authentication check
  const { isAuthenticated, userRole } = useAuth();
  const router = useRouter();
  
  // State for flashcard data
  const [flashcardStats, setFlashcardStats] = useState({
    totalDecks: 0,
    totalCards: 0,
    reviewedToday: 0,
    progress: {} as Record<string, number>,
    decks: [] as any[]
  });
  
  // State for quiz/test stats
  const [quizStats, setQuizStats] = useState({
    total: 0,
    completedThisWeek: 0,
    latestScore: 0
  });
  
  // State for notes statistics
  const [notesStats, setNotesStats] = useState({
    total: 0,
    newThisWeek: 0
  });
  
  // State for upcoming reviews
  const [upcomingReviews, setUpcomingReviews] = useState<any[]>([]);
  
  // Load all data on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Load flashcard decks
        const decks = JSON.parse(localStorage.getItem('flashcardDecks') || '[]');
        
        // Count today's and recent studied decks
        const today = new Date().toDateString();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        let reviewedToday = 0;
        let totalCards = 0;
        let newThisWeek = 0;
        const progress: Record<string, number> = {};
        
        // Parse decks for stats
        decks.forEach((deck: any) => {
          // Add to total cards
          totalCards += deck.cards?.length || 0;
          
          // Check if studied today
          if (deck.lastStudied && new Date(deck.lastStudied).toDateString() === today) {
            reviewedToday += 1;
          }
          
          // Check if created this week
          if (deck.createdAt && new Date(deck.createdAt) > oneWeekAgo) {
            newThisWeek += 1;
          }
          
          // Store progress
          if (deck.name && deck.progress !== undefined) {
            progress[deck.name] = deck.progress;
          }
        });
        
        // Set flashcard stats
        setFlashcardStats({
          totalDecks: decks.length,
          totalCards,
          reviewedToday,
          progress,
          decks
        });
        
        // Set notes stats based on decks (as a proxy for notes)
        setNotesStats({
          total: decks.length,
          newThisWeek
        });
        
        // Get quiz stats from localStorage
        const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        
        let completedThisWeek = 0;
        let latestScore = 0;
        
        if (quizResults.length > 0) {
          // Find the latest score
          const latestQuiz = quizResults[quizResults.length - 1];
          latestScore = latestQuiz.score || 0;
          
          // Count quizzes from past week
          completedThisWeek = quizResults.filter((quiz: any) => 
            quiz.date && new Date(quiz.date) > oneWeekAgo
          ).length;
        }
        
        setQuizStats({
          total: quizResults.length,
          completedThisWeek,
          latestScore
        });
        
        // Generate upcoming reviews based on least-reviewed decks
        const upcoming = [...decks]
          .sort((a, b) => {
            // Sort by: never studied first, then by oldest study date
            if (!a.lastStudied && !b.lastStudied) return 0;
            if (!a.lastStudied) return -1;
            if (!b.lastStudied) return 1;
            return new Date(a.lastStudied).getTime() - new Date(b.lastStudied).getTime();
          })
          .slice(0, 3) // Take top 3
          .map(deck => {
            // Generate a recommended date based on current progress
            const progress = deck.progress || 0;
            let reviewDate = 'Today';
            let reviewTime = '';
            
            if (!deck.lastStudied) {
              reviewTime = 'Not studied yet';
            } else {
              const now = new Date();
              const hours = now.getHours();
              reviewTime = `${hours > 12 ? (hours - 12) : hours}:00 ${hours >= 12 ? 'PM' : 'AM'}`;
              
              if (progress > 80) {
                // Well known - recommend in a week
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                reviewDate = nextWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else if (progress > 50) {
                // Medium known - recommend in 3 days
                const nextDays = new Date();
                nextDays.setDate(nextDays.getDate() + 3);
                reviewDate = nextDays.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              } else if (progress > 20) {
                // Just started - recommend tomorrow
                reviewDate = 'Tomorrow';
              }
            }
            
            return {
              title: deck.name,
              date: reviewDate,
              time: reviewTime,
              id: deck.id
            };
          });
        
        setUpcomingReviews(upcoming);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    }
  }, []);
  
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (userRole !== 'student') {
      router.push(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, router]);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Don't render until authenticated
  if (!isAuthenticated || userRole !== 'student') {
    return null;
  }
  
  // Function to handle starting a review session
  const startReview = (deckId: string) => {
    // Find the deck index
    const deckIndex = flashcardStats.decks.findIndex(deck => deck.id === deckId);
    if (deckIndex >= 0) {
      // Store the selected deck index in localStorage for the flashcards page to use
      localStorage.setItem('selectedDeckIndex', deckIndex.toString());
      router.push('/student/flashcards');
    }
  };

  return (
    <>
      <PageHeader 
        title="Student Dashboard" 
        description="Welcome back! Here's an overview of your study materials and progress."
      />
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <MetricCard
            title="Total Notes"
            value={notesStats.total.toString()}
            icon={<FileText className="h-4 w-4" />}
            description={`${notesStats.newThisWeek} new this week`}
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Tests Completed"
            value={quizStats.total.toString()}
            icon={<ListChecks className="h-4 w-4" />}
            description={`${quizStats.completedThisWeek} this week`}
            trend={quizStats.latestScore > 0 ? { value: quizStats.latestScore, isPositive: quizStats.latestScore >= 70 } : undefined}
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Flashcards Created"
            value={flashcardStats.totalCards.toString()}
            icon={<Brain className="h-4 w-4" />}
            description={`${flashcardStats.reviewedToday} deck${flashcardStats.reviewedToday !== 1 ? 's' : ''} reviewed today`}
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Flashcard Decks"
            value={flashcardStats.totalDecks.toString()}
            icon={<BookOpen className="h-4 w-4" />}
            description={upcomingReviews.length > 0 ? `${upcomingReviews.length} due for review` : "No decks to review"}
          />
        </motion.div>
      </motion.div>
      
      <div className="mt-8 grid gap-4 md:grid-cols-1">
        <Tabs defaultValue="recent">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold mb-2">Your Materials</h2>
            <TabsList>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="recent" className="space-y-4">
            {flashcardStats.decks.length > 0 ? (
              flashcardStats.decks
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                .slice(0, 4)
                .map((deck, i) => (
                  <motion.div 
                    key={deck.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="hover-scale cursor-pointer" onClick={() => router.push('/student/flashcards')}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{deck.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {deck.createdAt 
                                ? `Added ${new Date(deck.createdAt).toLocaleDateString()}`
                                : 'Recently added'}
                            </p>
                          </div>
                          <span className="text-sm font-medium">{deck.progress || 0}%</span>
                        </div>
                        <Progress value={deck.progress || 0} className="h-2" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
            ) : (
              <div className="min-h-[200px] flex items-center justify-center flex-col gap-4">
                <p className="text-muted-foreground">No flashcard decks yet</p>
                <Button onClick={() => router.push('/student/upload')}>
                  Create Your First Deck
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
