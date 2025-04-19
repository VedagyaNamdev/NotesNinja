"use client";

import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { User, Book, Clipboard, Bell, Shield, Monitor, Lock, School } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


const TeacherSettings = () => {
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

  return (
    <>
      <PageHeader 
        title="Settings" 
        description="Manage your account settings and teaching preferences."
      />
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full sm:w-auto grid sm:inline-flex grid-cols-4 sm:grid-cols-none h-auto p-1 mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-2 h-10">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="teaching" className="flex items-center gap-2 h-10">
            <Book className="h-4 w-4" />
            <span className="hidden sm:inline">Teaching</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2 h-10">
            <Clipboard className="h-4 w-4" />
            <span className="hidden sm:inline">Tests</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 h-10">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Profile</CardTitle>
                  <CardDescription>Update your personal information and credentials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src="https://ui.shadcn.com/avatars/03.png" alt="Teacher" />
                        <AvatarFallback>T</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                    </div>
                    
                    <div className="grid flex-1 gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name</Label>
                          <Input id="firstName" defaultValue="Sarah" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <Input id="lastName" defaultValue="Wilson" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" defaultValue="sarah.wilson@example.edu" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="institution">Institution</Label>
                      <Input id="institution" defaultValue="Westfield High School" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" defaultValue="Science" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Input id="bio" defaultValue="Physics and Chemistry teacher with 8 years of experience" />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Password & Security</CardTitle>
                  <CardDescription>Update your password and security settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Security Options</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="twoFactor">Two-factor authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch id="twoFactor" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sessionTimeout">Session timeout</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically log out after inactivity
                        </p>
                      </div>
                      <Switch id="sessionTimeout" defaultChecked />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Update Security Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="teaching">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Preferences</CardTitle>
                  <CardDescription>Customize your teaching and material settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Subject Areas</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primarySubject">Primary Subject</Label>
                        <Select defaultValue="physics">
                          <SelectTrigger id="primarySubject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="physics">Physics</SelectItem>
                            <SelectItem value="chemistry">Chemistry</SelectItem>
                            <SelectItem value="biology">Biology</SelectItem>
                            <SelectItem value="mathematics">Mathematics</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="history">History</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="secondarySubjects">Secondary Subjects</Label>
                        <Select defaultValue="chemistry">
                          <SelectTrigger id="secondarySubjects">
                            <SelectValue placeholder="Select subjects" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="physics">Physics</SelectItem>
                            <SelectItem value="chemistry">Chemistry</SelectItem>
                            <SelectItem value="biology">Biology</SelectItem>
                            <SelectItem value="mathematics">Mathematics</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="history">History</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Classes</h3>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="className">Class Name</Label>
                          <Input id="className" defaultValue="Physics 101" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="classYear">Academic Year</Label>
                          <Select defaultValue="2025">
                            <SelectTrigger id="classYear">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="className2">Class Name</Label>
                          <Input id="className2" defaultValue="Advanced Physics" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="classYear2">Academic Year</Label>
                          <Select defaultValue="2025">
                            <SelectTrigger id="classYear2">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="mt-2">
                        Add Another Class
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Teaching Style</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language">Preferred Language Style</Label>
                        <Select defaultValue="standard">
                          <SelectTrigger id="language">
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">Simple & Clear</SelectItem>
                            <SelectItem value="standard">Standard Academic</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive & Detailed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="examples">Example Preferences</Label>
                        <Select defaultValue="applied">
                          <SelectTrigger id="examples">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimal">Minimal Examples</SelectItem>
                            <SelectItem value="balanced">Balanced</SelectItem>
                            <SelectItem value="applied">Applied/Real-World</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Teaching Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="tests">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Test & Assessment Settings</CardTitle>
                  <CardDescription>Configure default settings for tests and assessments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Default Test Settings</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="timeLimit">Default Time Limit</Label>
                        <Select defaultValue="60">
                          <SelectTrigger id="timeLimit">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="questionFormat">Default Question Format</Label>
                        <Select defaultValue="mixed">
                          <SelectTrigger id="questionFormat">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="short">Short Answer</SelectItem>
                            <SelectItem value="long">Long Answer</SelectItem>
                            <SelectItem value="mixed">Mixed Format</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="difficultyMix">Default Difficulty Mix</Label>
                        <Select defaultValue="balanced">
                          <SelectTrigger id="difficultyMix">
                            <SelectValue placeholder="Select mix" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Mostly Easy</SelectItem>
                            <SelectItem value="balanced">Balanced</SelectItem>
                            <SelectItem value="challenging">Challenging</SelectItem>
                            <SelectItem value="mixed">Progressive (Easy to Hard)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="questionCount">Default Question Count</Label>
                        <Select defaultValue="20">
                          <SelectTrigger id="questionCount">
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 questions</SelectItem>
                            <SelectItem value="15">15 questions</SelectItem>
                            <SelectItem value="20">20 questions</SelectItem>
                            <SelectItem value="25">25 questions</SelectItem>
                            <SelectItem value="30">30 questions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Access Settings</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowRetakes">Allow test retakes</Label>
                        <p className="text-sm text-muted-foreground">
                          Students can retake tests to improve their scores
                        </p>
                      </div>
                      <Switch id="allowRetakes" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="showAnswers">Show correct answers after submission</Label>
                        <p className="text-sm text-muted-foreground">
                          Students can see correct answers after submitting their test
                        </p>
                      </div>
                      <Switch id="showAnswers" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="timeConstraints">Enforce time constraints</Label>
                        <p className="text-sm text-muted-foreground">
                          Tests will automatically submit when time runs out
                        </p>
                      </div>
                      <Switch id="timeConstraints" defaultChecked />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Test Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose when and how you want to be notified.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Email Notifications</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailNewStudent" className="flex-1">New student enrollments</Label>
                        <Switch id="emailNewStudent" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailTestCompleted" className="flex-1">Test completion notifications</Label>
                        <Switch id="emailTestCompleted" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailMaterialEngagement" className="flex-1">Material engagement reports</Label>
                        <Switch id="emailMaterialEngagement" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailWeeklySummary" className="flex-1">Weekly summary reports</Label>
                        <Switch id="emailWeeklySummary" defaultChecked />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Push Notifications</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushNewStudent" className="flex-1">New student enrollments</Label>
                        <Switch id="pushNewStudent" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushTestCompleted" className="flex-1">Test completion notifications</Label>
                        <Switch id="pushTestCompleted" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushMaterialEngagement" className="flex-1">Material engagement alerts</Label>
                        <Switch id="pushMaterialEngagement" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Notification Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default TeacherSettings;
