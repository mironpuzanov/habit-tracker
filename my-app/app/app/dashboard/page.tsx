"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface Habit {
  id: string;
  name: string;
  category: string;
  habit_type: "checkbox" | "duration" | "rating";
  active: boolean;
}

interface HabitStat {
  id: string;
  name: string;
  type: "checkbox" | "duration" | "rating";
  value: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [habitStats, setHabitStats] = useState<HabitStat[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>(format(new Date(), 'MMMM yyyy'));
  
  const supabase = createClient();
  
  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        // Get start and end of current month
        const now = new Date();
        const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
        
        // Get all active habits
        const { data: habits, error: habitsError } = await supabase
          .from('habits')
          .select('id, name, category, habit_type, active')
          .eq('user_id', user.id)
          .eq('active', true);
        
        if (habitsError) throw habitsError;
        
        // Get all completions for the current month
        const { data: completions, error: completionsError } = await supabase
          .from('habit_completions')
          .select('id, habit_id, completed_date, duration, rating')
          .eq('user_id', user.id)
          .gte('completed_date', monthStart)
          .lte('completed_date', monthEnd);
        
        if (completionsError) throw completionsError;
        
        // Calculate stats for each habit
        const stats = habits.map(habit => {
          const habitCompletions = completions.filter(c => c.habit_id === habit.id);
          
          let value = 0;
          if (habit.habit_type === 'checkbox') {
            value = habitCompletions.length;
          } else if (habit.habit_type === 'duration') {
            value = habitCompletions.reduce((sum, c) => sum + (c.duration || 0), 0);
          } else if (habit.habit_type === 'rating') {
            const validRatings = habitCompletions.filter(c => c.rating !== null);
            const avgRating = validRatings.length > 0
              ? validRatings.reduce((sum, c) => sum + (c.rating || 0), 0) / validRatings.length
              : 0;
            value = parseFloat(avgRating.toFixed(1));
          }
          
          return {
            id: habit.id,
            name: habit.name,
            type: habit.habit_type,
            value
          };
        });
        
        setHabitStats(stats);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStats();
  }, []);
  
  const formatValue = (stat: HabitStat) => {
    switch (stat.type) {
      case 'checkbox':
        return `${stat.value} times`;
      case 'duration':
        return `${stat.value} minutes`;
      case 'rating':
        return `${stat.value.toFixed(1)}/5`;
      default:
        return stat.value.toString();
    }
  };
  
  return (
    <div className="h-screen flex flex-col pt-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Monthly Statistics: {currentMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            </div>
          ) : habitStats.length > 0 ? (
            <div className="space-y-4">
              {habitStats.map(stat => (
                <div 
                  key={stat.id} 
                  className="flex justify-between items-center p-4 bg-card rounded-lg border"
                >
                  <div className="font-medium">{stat.name}</div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    stat.type === 'checkbox' ? 'bg-primary/10 text-primary' :
                    stat.type === 'duration' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500'
                  }`}>
                    {formatValue(stat)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No habits data available for this month</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 