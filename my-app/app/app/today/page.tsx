"use client"

import { useState, useEffect } from "react";
import { HabitCategory } from "@/components/internal";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addDays, subDays, isToday, isFuture } from "date-fns";

// Define the Habit type
interface Habit {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  habit_type?: "checkbox" | "duration" | "rating";
  default_duration?: number | null;
  duration?: number | null;
  default_rating?: number | null;
  rating?: number | null;
}

// Group habits by category and sort by type
function groupHabitsByCategory(habits: Habit[]) {
  const categories: Record<string, Habit[]> = {};
  
  habits.forEach(habit => {
    if (!categories[habit.category]) {
      categories[habit.category] = [];
    }
    categories[habit.category].push(habit);
  });
  
  // Define the type order for sorting (checkbox first, then duration, then rating)
  const typeOrder = {
    checkbox: 1,
    duration: 2,
    rating: 3
  };
  
  // Sort habits by type within each category
  return Object.entries(categories).map(([category, habitsInCategory]) => ({
    category,
    habits: habitsInCategory.sort((a, b) => {
      const typeA = a.habit_type || "checkbox";
      const typeB = b.habit_type || "checkbox";
      return (typeOrder[typeA as keyof typeof typeOrder] || 99) - (typeOrder[typeB as keyof typeof typeOrder] || 99);
    })
  }));
}

export default function TodayPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [groupedHabits, setGroupedHabits] = useState<{
    category: string;
    habits: Habit[];
  }[]>([]);
  
  const supabase = createClient();
  
  // Format the displayed date
  const formatDisplayDate = (date: Date) => {
    if (isToday(date)) {
      return `Today - ${format(date, "MMMM d, yyyy")}`;
    }
    return format(date, "EEEE, MMMM d, yyyy");
  };
  
  // Navigate to the previous day
  const goToPreviousDay = () => {
    // If we're on today, save default values for uncompleted duration habits
    if (isToday(selectedDate)) {
      saveDefaultValuesForUncompleted();
    }
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };
  
  // Navigate to the next day
  const goToNextDay = () => {
    // Don't allow navigating to future dates
    if (!isFuture(addDays(selectedDate, 1))) {
      setSelectedDate(prevDate => addDays(prevDate, 1));
    }
  };
  
  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Auto-save default values (0) for duration habits that weren't completed
  const saveDefaultValuesForUncompleted = async () => {
    try {
      // Only run if we're on today
      if (!isToday(selectedDate)) return;

      console.log("Saving default values for uncompleted duration habits");
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Process each habit
      for (const category of groupedHabits) {
        for (const habit of category.habits) {
          // Only process duration habits that aren't completed
          if (habit.habit_type === "duration" && !habit.completed) {
            // Insert a completion record with 0 duration
            const { error } = await supabase
              .from('habit_completions')
              .upsert({
                habit_id: habit.id,
                user_id: user.id,
                completed_date: today,
                duration: 0
              });
              
            if (error) {
              console.error(`Error auto-saving habit ${habit.name}:`, error);
            } else {
              console.log(`Auto-saved 0 duration for uncompleted habit: ${habit.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error auto-saving default values:", error);
    }
  };
  
  // Check for day change and save default values if needed
  useEffect(() => {
    // Only run this when viewing today
    if (!isToday(selectedDate)) return;
    
    let lastDate = new Date().toDateString();
    
    // Check every minute if the date has changed
    const interval = setInterval(() => {
      const currentDate = new Date().toDateString();
      
      // If the date has changed (midnight passed)
      if (currentDate !== lastDate) {
        console.log("Day changed, auto-saving uncompleted habits");
        saveDefaultValuesForUncompleted();
        lastDate = currentDate;
        
        // Refresh the page to show the new day
        window.location.reload();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [selectedDate]);
  
  // Function to fetch habits and their completion status from Supabase
  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Format the selected date to ISO (YYYY-MM-DD)
      const dateString = format(selectedDate, "yyyy-MM-dd");
      
      // Attempt to get habits 
      let { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .lte('created_at', dateString + 'T23:59:59'); // Only show habits created on or before the selected date
      
      // If we get a column error about active, we'll try to create it
      if (habitsError && habitsError.message.includes("column") && habitsError.message.includes("active")) {
        console.log("Active column missing, trying to add it...");
        try {
          // Try to add the column via API
          await fetch('/api/add-active-column', { method: 'POST' });
          
          // Try the query again without filtering by active
          const { data: retryData, error: retryError } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .eq('active', true)
            .lte('created_at', dateString + 'T23:59:59'); // Only show habits created on or before the selected date
            
          if (retryError) throw retryError;
          habitsData = retryData;
        } catch (addColumnError) {
          console.error("Error adding column:", addColumnError);
          // Just continue with what we have
        }
      } else if (habitsError) {
        throw habitsError;
      }
      
      // Debug the habit data structure
      console.log(`Habit data for ${dateString}:`, habitsData);
      
      // Default to empty array if habitsData is null
      habitsData = habitsData || [];
      
      // Fetch completions for the selected date
      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, duration, rating')
        .eq('user_id', user.id)
        .eq('completed_date', dateString);
      
      if (completionsError) throw completionsError;
      
      console.log(`Completions for ${dateString}:`, completionsData);
      
      // Create a Map of completed habit IDs for faster lookup
      const completionsMap = new Map();
      completionsData.forEach(completion => {
        completionsMap.set(completion.habit_id, {
          completed: true,
          duration: completion.duration,
          rating: completion.rating
        });
      });
      
      // Combine habit data with completion status
      const habits: Habit[] = habitsData.map(habit => {
        const completion = completionsMap.get(habit.id);
        
        // Log individual habit to debug the structure
        console.log("Processing habit:", habit);
        
        return {
          id: habit.id,
          name: habit.name,
          category: habit.category,
          // Use optional chaining to safely access properties that might not exist
          habit_type: habit.habit_type ?? "checkbox",
          default_duration: habit?.default_duration ?? null,
          default_rating: habit?.default_rating ?? null,
          completed: completion?.completed || false,
          duration: completion?.duration !== undefined ? completion.duration : null,
          rating: completion?.rating !== undefined ? completion.rating : null
        };
      });
      
      setGroupedHabits(groupHabitsByCategory(habits));
    } catch (error) {
      console.error("Error fetching habits:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      toast.error("Failed to load habits");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle habit completion changes
  const handleCompletionChange = async (habitId: string, completed: boolean, duration?: number, rating?: number) => {
    // Only allow modifying habits for today
    if (!isToday(selectedDate)) {
      toast.error("Cannot modify habits for past dates");
      return;
    }
    
    console.log("Completion change:", habitId, completed, duration, rating);
    
    // Update the UI immediately for better UX
    setGroupedHabits(prevGrouped => {
      return prevGrouped.map(category => ({
        ...category,
        habits: category.habits.map(habit => 
          habit.id === habitId 
            ? { 
                ...habit, 
                completed, 
                duration: duration !== undefined ? duration : habit.duration,
                rating: rating !== undefined ? rating : habit.rating 
              } 
            : habit
        )
      }));
    });
    
    // For duration or rating habits, fetch the latest data after a short delay
    // This ensures we have the most up-to-date values
    if (duration !== undefined || rating !== undefined) {
      // Wait a short time to allow the database to update
      console.log(`${duration !== undefined ? 'Duration' : 'Rating'} updated, will refresh data in 1 second`);
      setTimeout(() => {
        console.log("Refreshing data after value update");
        fetchHabits();
      }, 1000);
    }
  };
  
  // Fetch habits when the selected date changes
  useEffect(() => {
    fetchHabits();
  }, [selectedDate]);
  
  // When component unmounts, save default values
  useEffect(() => {
    return () => {
      if (isToday(selectedDate)) {
        saveDefaultValuesForUncompleted();
      }
    };
  }, [selectedDate]);
  
  // Add a beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isToday(selectedDate)) {
        // This has to be synchronous - we can't guarantee async operations will complete
        // But we'll call the function anyway to attempt to save
        saveDefaultValuesForUncompleted();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedDate]);
  
  return (
    <div className="p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Habits</h1>
        </div>
      </div>
      
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6 px-3 py-3 border rounded-lg bg-background shadow-sm">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={goToPreviousDay}
          aria-label="Previous day"
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col items-center flex-1 mx-2">
          <span className="text-sm font-medium">
            {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE")}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(selectedDate, "MMMM d, yyyy")}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={goToToday}
            aria-label="Go to today"
            disabled={isToday(selectedDate)}
            className="h-8 w-8"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={goToNextDay}
            aria-label="Next day"
            disabled={isToday(selectedDate)}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin h-6 w-6 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedHabits.length > 0 ? (
            groupedHabits.map((category, index) => (
              <HabitCategory
                key={index}
                title={category.category}
                habits={category.habits}
                onCompletionChange={handleCompletionChange}
                isReadOnly={!isToday(selectedDate)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>
                {isToday(selectedDate) 
                  ? "No habits yet. Go to Settings to add your first habit." 
                  : "No habits tracked for this date."}
              </p>
              {isToday(selectedDate) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = "/app/settings"}
                >
                  Go to Settings
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 