"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


const StudentRevision = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
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

  // Simulated revision data
  const revisionDates = [
    new Date(2025, 3, 15),
    new Date(2025, 3, 18),
    new Date(2025, 3, 20),
    new Date(2025, 3, 25),
    new Date(2025, 3, 27),
    new Date(2025, 3, 29),
    new Date(2025, 4, 2),
    new Date(2025, 4, 5),
    new Date(2025, 4, 10),
  ];

  const upcomingRevisions = [
    {
      topic: "Physics: Motion Laws",
      date: "Today",
      time: "4:00 PM",
      progress: 60,
      revision: 2,
    },
    {
      topic: "Biology: Cell Structure",
      date: "Tomorrow",
      time: "9:00 AM",
      progress: 75,
      revision: 3,
    },
    {
      topic: "Chemistry: Periodic Table",
      date: "Apr 20",
      time: "11:00 AM",
      progress: 85,
      revision: 4,
    },
    {
      topic: "Math: Calculus Basics",
      date: "Apr 22",
      time: "2:00 PM",
      progress: 40,
      revision: 1,
    },
  ];

  const completedRevisions = [
    {
      topic: "History: Ancient Rome",
      date: "Apr 15",
      retention: 85,
      revision: 3,
    },
    {
      topic: "Geography: European Countries",
      date: "Apr 12",
      retention: 90,
      revision: 4,
    },
    {
      topic: "Literature: Shakespeare",
      date: "Apr 8",
      retention: 70,
      revision: 2,
    },
  ];

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader 
        title="Revision Tracker" 
        description="Track your study progress and follow spaced repetition schedules for optimal learning."
        className="px-2 sm:px-0"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Mobile view: Calendar first for better UX on small screens */}
        <motion.div
          className="lg:order-last lg:col-span-1 block lg:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Revision Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-4 sm:pt-4">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border w-full max-w-[300px]"
                  classNames={{
                    root: "w-full",
                    month: "space-y-2",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                    row: "flex w-full mt-1",
                    cell: "h-8 w-8 text-center text-sm sm:text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md text-xs sm:text-sm",
                    day_range_end: "day-range-end",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md text-xs sm:text-sm",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_hidden: "invisible",
                  }}
                  modifiers={{
                    revision: revisionDates,
                  }}
                  modifiersClassNames={{
                    revision: "bg-primary text-primary-foreground font-bold",
                  }}
                />
              </div>
              
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-base font-medium">Spaced Repetition Schedule</h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { day: "First review", time: "1 day after learning" },
                    { day: "Second review", time: "3 days after first review" },
                    { day: "Third review", time: "7 days after second review" },
                    { day: "Fourth review", time: "21 days after third review" },
                    { day: "Final review", time: "30 days after fourth review" },
                  ].map((schedule, i) => (
                    <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                      <span>{schedule.day}</span>
                      <span className="text-muted-foreground">{schedule.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6">
                <Button className="w-full text-sm" size="sm">Schedule New Revision</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div 
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-semibold">Revision Schedule</h2>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="upcoming" className="flex-1 sm:flex-initial text-xs sm:text-sm">Upcoming</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 sm:flex-initial text-xs sm:text-sm">Completed</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="upcoming" className="mt-0 space-y-3 sm:space-y-4">
              {upcomingRevisions.map((revision, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover-scale">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        <div className="bg-primary/10 rounded-full p-2 sm:p-3 text-primary inline-flex justify-center">
                          <Brain className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-0">
                            <div>
                              <h3 className="text-sm sm:text-base font-medium">{revision.topic}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {revision.date} at {revision.time} • Revision {revision.revision}
                              </p>
                            </div>
                            <Button size="sm" className="text-xs sm:text-sm w-full sm:w-auto">Review Now</Button>
                          </div>
                          <div className="mt-2 sm:mt-3">
                            <div className="flex justify-between items-center text-xs sm:text-sm mb-1">
                              <span>Current retention</span>
                              <span>{revision.progress}%</span>
                            </div>
                            <Progress value={revision.progress} className="h-1.5 sm:h-2" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0 space-y-3 sm:space-y-4">
              {completedRevisions.map((revision, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover-scale">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        <div className="bg-green-100 rounded-full p-2 sm:p-3 text-green-600 inline-flex justify-center">
                          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-0">
                            <div>
                              <h3 className="text-sm sm:text-base font-medium">{revision.topic}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Completed on {revision.date} • Revision {revision.revision}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-600 hover:bg-green-200 text-xs w-fit">
                              {revision.retention}% Retention
                            </Badge>
                          </div>
                          <div className="mt-2 sm:mt-3 flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none">Review Again</Button>
                            <Button variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-none">View Notes</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
          
          <Card className="mt-4 sm:mt-6">
            <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-3">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <BarChart3 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Retention Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-4">
              <div className="h-[150px] sm:h-[200px] flex items-center justify-center border rounded-md">
                <p className="text-xs sm:text-sm text-muted-foreground">Retention graph visualization would appear here</p>
              </div>
              <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold">78%</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Average Retention</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold">12</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Topics Reviewed</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold">3.2</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Avg. Revisions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Desktop view: Calendar on right side */}
        <motion.div
          className="hidden lg:block lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="p-6 pb-0">
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Revision Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                modifiers={{
                  revision: revisionDates,
                }}
                modifiersClassNames={{
                  revision: "bg-primary text-primary-foreground font-bold",
                }}
              />
              
              <div className="mt-6 space-y-4">
                <h3 className="font-medium">Spaced Repetition Schedule</h3>
                <div className="space-y-3">
                  {[
                    { day: "First review", time: "1 day after learning" },
                    { day: "Second review", time: "3 days after first review" },
                    { day: "Third review", time: "7 days after second review" },
                    { day: "Fourth review", time: "21 days after third review" },
                    { day: "Final review", time: "30 days after fourth review" },
                  ].map((schedule, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span>{schedule.day}</span>
                      <span className="text-muted-foreground">{schedule.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <Button className="w-full">Schedule New Revision</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentRevision;
