"use client";

import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <CalendarClock className="h-8 w-8 text-[#E31937]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="text-gray-500 mt-1">
            {description || "This feature is currently under development and will be available soon."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-2 pb-6">
          <p className="text-gray-600 mb-4">
            We're working hard to bring you this feature. Check back later for updates.
          </p>
          <div className="flex justify-center">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
              Coming Soon
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}