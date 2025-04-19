"use client";

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import MetricCard from '@/components/ui/card-metrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Users, Clipboard, GraduationCap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeacherDashboard() {
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
  if (!isAuthenticated || userRole !== 'teacher') {
    return null;
  }

  return (
    <>
      <PageHeader 
        title="Teacher Dashboard" 
        description="Welcome back! Here's an overview of your materials and student engagement."
      />
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <MetricCard
            title="Total Materials"
            value="32"
            icon={<FileText className="h-4 w-4" />}
            description="5 new this month"
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Tests Created"
            value="18"
            icon={<Clipboard className="h-4 w-4" />}
            trend={{ value: 20, isPositive: true }}
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Active Students"
            value="87"
            icon={<GraduationCap className="h-4 w-4" />}
            description="12 new this week"
          />
        </motion.div>
        
        <motion.div variants={item}>
          <MetricCard
            title="Average Engagement"
            value="76%"
            icon={<Users className="h-4 w-4" />}
            trend={{ value: 5, isPositive: true }}
          />
        </motion.div>
      </motion.div>
      
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Tabs defaultValue="recent" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Materials</h2>
            <TabsList>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="recent" className="space-y-4 mt-0">
            {[
              { title: "Physics: Electromagnetic Waves", date: "Added 3 days ago", students: 24, engagement: 85 },
              { title: "Chemistry: Organic Compounds", date: "Added 1 week ago", students: 32, engagement: 78 },
              { title: "Mathematics: Differential Equations", date: "Added 2 weeks ago", students: 18, engagement: 65 },
              { title: "Biology: Ecosystem Dynamics", date: "Added 3 weeks ago", students: 29, engagement: 72 },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="hover-scale">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Students: </span>
                          <span className="font-medium">{item.students}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{item.engagement}%</div>
                          <Progress value={item.engagement} className="h-2 w-24" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
          
          <TabsContent value="popular" className="space-y-4 mt-0">
            {[
              { title: "Biology: Cell Structure", date: "Added 2 months ago", students: 45, engagement: 92 },
              { title: "Physics: Laws of Motion", date: "Added 3 months ago", students: 38, engagement: 88 },
              { title: "Chemistry: Periodic Table", date: "Added 2 months ago", students: 42, engagement: 85 },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="hover-scale">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Students: </span>
                          <span className="font-medium">{item.students}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{item.engagement}%</div>
                          <Progress value={item.engagement} className="h-2 w-24" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                { title: "Physics Midterm Review", questions: 15, difficulty: "Medium", shared: 28 },
                { title: "Chemistry Chapter 5 Quiz", questions: 10, difficulty: "Easy", shared: 32 },
                { title: "Advanced Calculus Test", questions: 20, difficulty: "Hard", shared: 18 },
              ].map((test, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-medium">{test.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                            {test.questions} questions
                          </div>
                          <div className={`text-xs px-2 py-0.5 rounded-full ${
                            test.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                            test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {test.difficulty}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 sm:mt-0">
                        <div className="text-xs flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {test.shared} students
                        </div>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 text-center">
                <Button>View All Tests</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-muted-foreground flex items-center">
          <Clock className="h-4 w-4 mr-1" />
          Last updated: Today at 2:45 PM
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Import Materials</Button>
          <Button>Create New Test</Button>
        </div>
      </div>
    </>
  );
}
