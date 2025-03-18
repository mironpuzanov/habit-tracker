"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col pt-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Habit Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Dashboard content will be added soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 