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
import DataMigrationDialog from '@/components/DataMigrationDialog';
import { 
  fetchFlashcardDecks, 
  fetchQuizResults
} from '@/lib/data-service';
import { useNotesCount } from '@/hooks/useNotesCount';
import { toast } from 'sonner';

export default function StudentDashboard() {
  // Authentication check
  const { isAuthenticated, userRole, user } = useAuth();
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
  
  // Get notes count from hook instead of state
  const { count: totalNotes, newThisWeek: newNotesThisWeek, loading: notesLoading } = useNotesCount();
  
  // State for upcoming reviews
  const [upcomingReviews, setUpcomingReviews] = useState<any[]>([]);
  
  // State for data loading
  const [isLoading, setIsLoading] = useState(true);
  const [dataMigrated, setDataMigrated] = useState(false);
  
  // Handle data migration complete
  const handleMigrationComplete = () => {
    setDataMigrated(true);
    loadDashboardData();
  };
  
  // Load all data from database
  const loadDashboardData = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Load data from database - no need to fetch notes now, we're using the hook
      const [decksData, quizData] = await Promise.all([
        fetchFlashcardDecks().catch(err => {
          console.error('Error fetching flashcard decks:', err);
          return { decks: [] }; // Return empty decks on error
        }),
        fetchQuizResults().catch(err => {
          console.error('Error fetching quiz results:', err);
          return { results: [] }; // Return empty results on error
        })
      ]);
      
      // Calculate stats
      const today = new Date().toDateString();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Process flashcard stats
      let reviewedToday = 0;
      let totalCards = 0;
      const progress: Record<string, number> = {};
      
      // Ensure decks exists and has expected structure
      const decks = Array.isArray(decksData) 
        ? decksData.map((deck: any) => ({
            ...deck,
            cards: deck.flashcards?.map((card: any) => ({
              id: card.id,
              question: card.question,
              answer: card.answer,
              mastered: card.mastered
            })) || []
          }))
        : decksData.decks?.map((deck: any) => ({
            ...deck,
            cards: deck.flashcards?.map((card: any) => ({
              id: card.id,
              question: card.question,
              answer: card.answer,
              mastered: card.mastered
            })) || []
          })) || [];
      
      // Parse decks for stats
      decks.forEach((deck: any) => {
        // Add to total cards
        totalCards += (deck.flashcards?.length || deck.cards?.length || 0);
        
        // Check if studied today
        if (deck.lastStudied && new Date(deck.lastStudied).toDateString() === today) {
          reviewedToday += 1;
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
      
      // Process quiz stats
      let completedThisWeek = 0;
      let latestScore = 0;
      
      // Ensure quizData has expected structure
      const quizResults = quizData.results || [];
      
      if (quizResults.length > 0) {
        // Find the latest score
        const latestQuiz = quizResults[0]; // They should be ordered by date desc
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
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
    } else if (userRole !== 'student') {
      router.push(`/${userRole}/dashboard`);
    }
  }, [isAuthenticated, userRole, router]);
  
  // Load data on initial load
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadDashboardData();
    }
  }, [isAuthenticated, user?.id]);

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

  // Don't render anything until authenticated
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
        description="Welcome back! Track your study progress and upcoming reviews."
      />
    
      {/* Show data migration dialog if user is authenticated */}
      {isAuthenticated && user?.id && (
        <DataMigrationDialog 
          userId={user.id} 
          onMigrationComplete={handleMigrationComplete} 
        />
      )}
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <MetricCard
            title="Total Notes"
            value={totalNotes.toString()}
            icon={<FileText className="h-4 w-4" />}
            description={`${newNotesThisWeek} new this week`}
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
