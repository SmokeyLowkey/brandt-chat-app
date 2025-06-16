"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const [temperature, setTemperature] = useState([0.7])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [historyEnabled, setHistoryEnabled] = useState(true)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Manage your AI assistant preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general settings for the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john.doe@brandt.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="cst">
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="est">Eastern Time (EST)</SelectItem>
                    <SelectItem value="cst">Central Time (CST)</SelectItem>
                    <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                    <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="chat-history">Save Chat History</Label>
                  <p className="text-sm text-gray-500">Store your conversation history for future reference</p>
                </div>
                <Switch id="chat-history" checked={historyEnabled} onCheckedChange={setHistoryEnabled} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-save">Auto Save Drafts</Label>
                  <p className="text-sm text-gray-500">Automatically save your message drafts</p>
                </div>
                <Switch id="auto-save" checked={autoSaveEnabled} onCheckedChange={setAutoSaveEnabled} />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#E31937] hover:bg-[#c01730]">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Settings</CardTitle>
              <CardDescription>Configure how the AI assistant responds to your queries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select defaultValue="gpt-4">
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Recommended)</SelectItem>
                    <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperature: {temperature[0].toFixed(1)}</Label>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={temperature}
                  onValueChange={setTemperature}
                />
                <p className="text-sm text-gray-500">
                  Lower values make responses more focused and deterministic. Higher values make responses more creative
                  and varied.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  rows={4}
                  defaultValue="You are a helpful assistant for Brandt Group of Companies. You have access to company data and can provide accurate information about products, services, and customer inquiries."
                />
                <p className="text-sm text-gray-500">This prompt guides how the AI assistant behaves and responds.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="knowledge-base">Knowledge Base Access</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="restricted">Restricted Documents</SelectItem>
                    <SelectItem value="public">Public Documents Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#E31937] hover:bg-[#c01730]">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Enable Notifications</Label>
                  <p className="text-sm text-gray-500">Receive notifications about important updates</p>
                </div>
                <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>

              <div className="space-y-2">
                <Label>Notification Types</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="new-documents" defaultChecked />
                    <Label htmlFor="new-documents">New document uploads</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="processing-complete" defaultChecked />
                    <Label htmlFor="processing-complete">Document processing complete</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="system-updates" defaultChecked />
                    <Label htmlFor="system-updates">System updates</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="mentions" defaultChecked />
                    <Label htmlFor="mentions">Mentions and replies</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-method">Notification Method</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">In-app and Email</SelectItem>
                    <SelectItem value="in-app">In-app Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#E31937] hover:bg-[#c01730]">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="border-2 border-[#E31937] rounded-md p-1">
                      <div className="h-20 w-full rounded bg-white"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="light-theme" defaultChecked />
                      <Label htmlFor="light-theme">Light</Label>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="border-2 border-transparent rounded-md p-1">
                      <div className="h-20 w-full rounded bg-gray-900"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="dark-theme" />
                      <Label htmlFor="dark-theme">Dark</Label>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="border-2 border-transparent rounded-md p-1">
                      <div className="h-20 w-full rounded bg-gradient-to-b from-white to-gray-900"></div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="system-theme" />
                      <Label htmlFor="system-theme">System</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="grid grid-cols-5 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-[#E31937] ring-2 ring-[#E31937] ring-offset-2"></div>
                    <span className="text-xs">Red</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-black"></div>
                    <span className="text-xs">Black</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-blue-600"></div>
                    <span className="text-xs">Blue</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-green-600"></div>
                    <span className="text-xs">Green</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-purple-600"></div>
                    <span className="text-xs">Purple</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="layout">Layout Density</Label>
                <Select defaultValue="comfortable">
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout density" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-[#E31937] hover:bg-[#c01730]">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
