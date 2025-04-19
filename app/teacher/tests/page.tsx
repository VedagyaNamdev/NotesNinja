"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { ClipboardList, Search, Filter, Download, Share2, Edit, Calendar, Users, Timer, Eye, Pencil, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


const TeacherTests = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [shareCode, setShareCode] = useState('TEST-2438-ABCD');
  const [shareUrl, setShareUrl] = useState('https://smartnote.companion/test/2438abcd');

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

  // Sample tests data
  const testsData = [
    {
      id: 1,
      title: 'Physics Midterm Exam',
      subject: 'Physics',
      questions: 20,
      difficulty: 'Medium',
      created: 'Apr 15, 2025',
      timeLimit: '60 min',
      shared: 42,
      status: 'active'
    },
    {
      id: 2,
      title: 'Chemistry: Periodic Table Quiz',
      subject: 'Chemistry',
      questions: 15,
      difficulty: 'Easy',
      created: 'Apr 12, 2025',
      timeLimit: '30 min',
      shared: 35,
      status: 'active'
    },
    {
      id: 3,
      title: 'Advanced Calculus Exam',
      subject: 'Mathematics',
      questions: 25,
      difficulty: 'Hard',
      created: 'Apr 8, 2025',
      timeLimit: '90 min',
      shared: 18,
      status: 'draft'
    },
    {
      id: 4,
      title: 'Biology: Cell Structure',
      subject: 'Biology',
      questions: 12,
      difficulty: 'Medium',
      created: 'Apr 5, 2025',
      timeLimit: '45 min',
      shared: 0,
      status: 'draft'
    },
    {
      id: 5,
      title: 'English Literature Quiz',
      subject: 'English',
      questions: 10,
      difficulty: 'Medium',
      created: 'Apr 1, 2025',
      timeLimit: '20 min',
      shared: 27,
      status: 'archived'
    },
  ];

  const filteredTests = testsData
    .filter(test => test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    test.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(test => activeTab === 'all' || test.status === activeTab);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <PageHeader 
        title="My Tests" 
        description="View, manage, and share your generated tests."
      >
        <Button>
          <ClipboardList className="h-4 w-4 mr-2" />
          Create New Test
        </Button>
      </PageHeader>
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests by title or subject"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="newest">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="shared">Most Shared</SelectItem>
                <SelectItem value="questions">Most Questions</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="all">All Tests</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredTests.length > 0 ? (
                filteredTests.map((test, index) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover-scale">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex gap-4 items-start">
                              <div className={`rounded-full p-3 ${
                                test.subject === 'Physics' ? 'bg-blue-100 text-blue-600' :
                                test.subject === 'Chemistry' ? 'bg-green-100 text-green-600' :
                                test.subject === 'Mathematics' ? 'bg-purple-100 text-purple-600' :
                                test.subject === 'Biology' ? 'bg-orange-100 text-orange-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                <ClipboardList className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-lg">{test.title}</h3>
                                  {test.status === 'draft' && (
                                    <Badge variant="outline" className="bg-muted/40">Draft</Badge>
                                  )}
                                  {test.status === 'archived' && (
                                    <Badge variant="outline" className="bg-muted/40">Archived</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center">
                                    <Calendar className="h-3.5 w-3.5 mr-1" />
                                    Created {test.created}
                                  </div>
                                  <div className="flex items-center">
                                    <Timer className="h-3.5 w-3.5 mr-1" />
                                    {test.timeLimit}
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="h-3.5 w-3.5 mr-1" />
                                    Shared with {test.shared} students
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <Badge variant="outline" className="bg-muted/40">
                                    {test.subject}
                                  </Badge>
                                  <Badge variant="outline" className="bg-muted/40">
                                    {test.questions} questions
                                  </Badge>
                                  <Badge variant="outline" className={`
                                    ${test.difficulty === 'Easy' ? 'bg-green-100 text-green-800 border-green-200' : 
                                      test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                                      'bg-red-100 text-red-800 border-red-200'}
                                  `}>
                                    {test.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3 lg:mt-0">
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">Preview</span>
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" className="gap-1">
                                    <Share2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Share</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Share Test</DialogTitle>
                                    <DialogDescription>
                                      Share this test with your students using a link or code.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="share-link">Shareable Link</Label>
                                      <div className="flex">
                                        <Input id="share-link" value={shareUrl} readOnly className="rounded-r-none" />
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          className="rounded-l-none"
                                          onClick={() => copyToClipboard(shareUrl)}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="share-code">Access Code</Label>
                                      <div className="flex">
                                        <Input id="share-code" value={shareCode} readOnly className="rounded-r-none" />
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          className="rounded-l-none"
                                          onClick={() => copyToClipboard(shareCode)}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Students can enter this code to access the test.
                                      </p>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="outline">Copy All</Button>
                                    <Button>Done</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center rounded-full bg-muted/30 p-6 mb-4">
                    <ClipboardList className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg">No tests found</h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredTests.length} of {testsData.length} tests
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Tests
            </Button>
            <Button className="gap-2">
              <Pencil className="h-4 w-4" />
              Create New Test
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherTests;
