"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { Search, Filter, FileText, BookText, Clock, Calendar, Download } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const StudentNotes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Sample notes data
  const notesData = [
    {
      id: 1,
      title: 'Physics: Laws of Motion',
      preview: 'Newton\'s First Law: An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.',
      date: 'Apr 16, 2025',
      tags: ['Physics', 'Motion', 'Forces'],
      type: 'text',
    },
    {
      id: 2,
      title: 'Biology: Cell Structure',
      preview: 'Cells are the basic building blocks of all living organisms. The cell structure consists of the cell membrane, cytoplasm, nucleus, and organelles.',
      date: 'Apr 12, 2025',
      tags: ['Biology', 'Cells'],
      type: 'image',
    },
    {
      id: 3,
      title: 'Chemistry: Periodic Table',
      preview: 'The periodic table is organized based on atomic number. Elements in the same group have similar chemical properties.',
      date: 'Apr 8, 2025',
      tags: ['Chemistry', 'Elements'],
      type: 'pdf',
    },
    {
      id: 4,
      title: 'Math: Calculus Basics',
      preview: 'Derivatives measure the rate of change of a function with respect to a variable. The power rule states: d/dx(x^n) = n*x^(n-1).',
      date: 'Apr 5, 2025',
      tags: ['Math', 'Calculus'],
      type: 'text',
    },
    {
      id: 5,
      title: 'History: World War II',
      preview: 'World War II was a global conflict that lasted from 1939 to 1945. It involved many of the world\'s nations organized into two opposing military alliances.',
      date: 'Mar 28, 2025',
      tags: ['History', 'WWII'],
      type: 'pdf',
    },
  ];

  const filteredNotes = notesData.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-5 w-5" />;
      case 'image':
        return <BookText className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <>
      <PageHeader 
        title="My Notes" 
        description="Search and browse through all your uploaded notes."
      />
      
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes by title, content, or tags"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Notes</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="pdfs">PDFs</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover-scale">
                      <CardContent className="p-0">
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex gap-4 items-start">
                              <div className={`rounded-full p-3 ${
                                note.type === 'text' ? 'bg-blue-100 text-blue-600' :
                                note.type === 'image' ? 'bg-green-100 text-green-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {getTypeIcon(note.type)}
                              </div>
                              <div className="space-y-2">
                                <h3 className="font-medium text-lg">{note.title}</h3>
                                <p className="text-muted-foreground">{note.preview}</p>
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {note.tags.map((tag, i) => (
                                    <Badge key={i} variant="outline" className="bg-muted/40">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 mt-3 sm:mt-0">
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {note.date}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-8 px-2">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="default" className="h-8">
                                  View
                                </Button>
                              </div>
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
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg">No notes found</h3>
                  <p className="text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Last synchronized: Today at 2:45 PM
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Import Notes</Button>
            <Button>Create New Note</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentNotes;
