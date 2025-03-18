"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
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
  category: string;
  value: number;
}

interface GroupedStats {
  [category: string]: HabitStat[];
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [groupedStats, setGroupedStats] = useState<GroupedStats>({});
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
            category: habit.category || "Uncategorized",
            value
          };
        });
        
        // Group stats by category
        const grouped: GroupedStats = {};
        stats.forEach(stat => {
          if (!grouped[stat.category]) {
            grouped[stat.category] = [];
          }
          grouped[stat.category].push(stat);
        });
        
        // Sort each category's habits by type first, then by name
        const typeOrder = { checkbox: 1, rating: 2, duration: 3 };
        Object.keys(grouped).forEach(category => {
          grouped[category].sort((a, b) => {
            // First sort by type
            const typeComparison = typeOrder[a.type] - typeOrder[b.type];
            if (typeComparison !== 0) return typeComparison;
            
            // Then sort by name
            return a.name.localeCompare(b.name);
          });
        });
        
        setGroupedStats(grouped);
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
  
  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedStats).sort();
  const hasStats = sortedCategories.length > 0;
  
  return (
    <div className="h-screen max-h-screen flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-2">
        <h1 className="text-lg font-bold">{currentMonth}</h1>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : hasStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-1 h-[calc(100%-40px)] overflow-hidden">
          {sortedCategories.map(category => (
            <Card key={category} className="flex flex-col overflow-hidden p-0 h-full">
              <div className="bg-muted/30 px-2 py-0.5 border-b">
                <h3 className="text-xs font-semibold">{category}</h3>
              </div>
              <CardContent className="p-1 space-y-1 overflow-auto flex-1">
                {groupedStats[category].map((stat, index, arr) => {
                  // Check if this is the first item of its type in the array
                  const isFirstOfType = index === 0 || arr[index-1].type !== stat.type;
                  
                  return (
                    <div key={stat.id}>
                      {isFirstOfType && (
                        <div className="text-xs text-muted-foreground mt-0.5 mb-0.5 font-semibold">
                          {stat.type === 'checkbox' ? 'Checkbox' : stat.type === 'rating' ? 'Rating' : 'Duration'}
                        </div>
                      )}
                      <div 
                        className="flex justify-between items-center p-1 bg-card rounded border"
                      >
                        <div className="font-medium text-xs">{stat.name}</div>
                        <div className={`px-1 py-0.5 rounded-full text-xs font-medium ${
                          stat.type === 'checkbox' ? 'bg-primary/10 text-primary' :
                          stat.type === 'duration' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500'
                        }`}>
                          {formatValue(stat)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No habits data available for this month</p>
        </div>
      )}
    </div>
  );
} 