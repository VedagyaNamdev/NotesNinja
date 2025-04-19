"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import MetricCard from '@/components/ui/card-metrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Calendar, Brain, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentDashboard() {
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
            value="24"
            icon={<FileText className="h-4 w-4" />}
            description="4 new this week"
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Tests Completed"
            value="12"
            icon={<ListChecks className="h-4 w-4" />}
            trend={{ value: 15, isPositive: true }}
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Flashcards Created"
            value="156"
            icon={<Brain className="h-4 w-4" />}
            description="32 reviewed today"
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Next Review Due"
            value="Today"
            icon={<Calendar className="h-4 w-4" />}
            description="5 topics to review"
          />
        </motion.div>
      </motion.div>
      
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Tabs defaultValue="recent" className="col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold mb-2">Your Materials</h2>
            <TabsList>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="recent" className="space-y-4">
            {[
              { title: "Physics Lecture Notes", date: "Added 2 days ago", progress: 75 },
              { title: "Biology Cell Structure", date: "Added 5 days ago", progress: 90 },
              { title: "History: World War II", date: "Added 1 week ago", progress: 60 },
              { title: "Chemistry: Organic Compounds", date: "Added 2 weeks ago", progress: 45 },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="hover-scale">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <span className="text-sm font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
          
          <TabsContent value="favorites" className="space-y-4">
            {[
              { title: "Math Formulas", date: "Added 1 month ago", progress: 95 },
              { title: "Programming Concepts", date: "Added 3 weeks ago", progress: 80 },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="hover-scale">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <span className="text-sm font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Physics Formulas", date: "Today", time: "4:00 PM" },
                { title: "Biology Terms", date: "Tomorrow", time: "9:00 AM" },
                { title: "Chemistry Elements", date: "May 20", time: "11:00 AM" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.date} at {item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
