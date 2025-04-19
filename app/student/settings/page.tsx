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
import { motion } from 'framer-motion';
import { User, Bell, ShieldCheck, PanelLeft, Monitor, MoonStar, Languages } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


const StudentSettings = () => {
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
        description="Manage your account settings and preferences."
      />
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full sm:w-auto grid sm:inline-flex grid-cols-3 sm:grid-cols-none h-auto p-1 mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-2 h-10">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 h-10">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 h-10">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
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
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src="https://ui.shadcn.com/avatars/01.png" alt="Student" />
                        <AvatarFallback>S</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">Change Avatar</Button>
                    </div>
                    
                    <div className="grid flex-1 gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name</Label>
                          <Input id="firstName" defaultValue="Alex" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <Input id="lastName" defaultValue="Johnson" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input id="email" defaultValue="alex.johnson@example.com" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school">School/University</Label>
                      <Input id="school" defaultValue="State University" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="major">Major/Subject</Label>
                      <Input id="major" defaultValue="Computer Science" />
                    </div>
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
                      <Switch id="twoFactor" />
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
                        <Label htmlFor="emailRevision" className="flex-1">Revision reminders</Label>
                        <Switch id="emailRevision" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailNewQuiz" className="flex-1">New quiz notifications</Label>
                        <Switch id="emailNewQuiz" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailNewMaterial" className="flex-1">New study material</Label>
                        <Switch id="emailNewMaterial" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailSummary" className="flex-1">Weekly progress summary</Label>
                        <Switch id="emailSummary" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Push Notifications</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushRevision" className="flex-1">Revision reminders</Label>
                        <Switch id="pushRevision" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushNewQuiz" className="flex-1">New quiz notifications</Label>
                        <Switch id="pushNewQuiz" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushNewMaterial" className="flex-1">New study material</Label>
                        <Switch id="pushNewMaterial" />
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
        
        <TabsContent value="appearance">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            <motion.div variants={item}>
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize how Smart Note Companion looks for you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Theme</h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="cursor-pointer border rounded-md p-4 flex flex-col items-center gap-2 ring-2 ring-primary">
                        <Monitor className="h-5 w-5" />
                        <span className="text-sm">Light</span>
                      </div>
                      <div className="cursor-pointer border rounded-md p-4 flex flex-col items-center gap-2">
                        <MoonStar className="h-5 w-5" />
                        <span className="text-sm">Dark</span>
                      </div>
                      <div className="cursor-pointer border rounded-md p-4 flex flex-col items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        <span className="text-sm">System</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Layout</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sidebarCollapsed" className="flex items-center gap-2">
                          <PanelLeft className="h-4 w-4" />
                          Collapsed sidebar by default
                        </Label>
                        <Switch id="sidebarCollapsed" />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Language</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="language" className="flex items-center gap-2">
                          <Languages className="h-4 w-4" />
                          Interface language
                        </Label>
                        <select 
                          id="language" 
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="zh">Chinese</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Appearance Settings</Button>
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

export default StudentSettings;
