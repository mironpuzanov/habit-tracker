"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddHabitDialog } from "./AddHabitDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Habit {
  id: string;
  name: string;
  category: string;
  habit_type: string;
  default_duration: number | null;
  default_rating: number | null;
  active: boolean;
}

export function ManageHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [habitToPermanentlyDelete, setHabitToPermanentlyDelete] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const supabase = createClient();

  // Fetch all habits
  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Ensure the active column exists before querying
      try {
        // Try to run raw SQL to add the column if it doesn't exist
        // This is a fallback in case RPC isn't available
        await supabase.rpc('exec_sql', { 
          sql: "ALTER TABLE habits ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE" 
        });
      } catch (error) {
        // Ignore errors if the RPC doesn't exist or if you don't have permission
        console.log("Couldn't ensure column exists, continuing with query");
      }
      
      // Check if active column exists
      let hasActiveColumn = true;
      try {
        // Try a simple query filtering by active to see if column exists
        const { data: testData, error: testError } = await supabase
          .from('habits')
          .select('id')
          .eq('active', true)
          .limit(1);
          
        if (testError && testError.message.includes("column")) {
          hasActiveColumn = false;
        }
      } catch (error) {
        hasActiveColumn = false;
      }
      
      // Fetch active habits
      let query = supabase
        .from('habits')
        .select('id, name, category, habit_type, default_duration, default_rating, active')
        .eq('user_id', user.id);
        
      if (hasActiveColumn) {
        query = query.eq('active', true);
      }
      
      // Execute the query with .order() added at the end
      const { data: activeData, error } = await query.order('category');
      
      if (error) throw error;
      
      // Set default active value if column doesn't exist 
      const habitsWithActive = (activeData || []).map(habit => ({
        ...habit,
        active: habit.active !== undefined ? habit.active : true,
        default_rating: habit.default_rating || null
      }));
      
      setHabits(habitsWithActive);
      
      // Fetch archived habits
      if (hasActiveColumn) {
        const { data: archivedData, error: archivedError } = await supabase
          .from('habits')
          .select('id, name, category, habit_type, default_duration, default_rating, active')
          .eq('user_id', user.id)
          .eq('active', false)
          .order('category');
          
        if (!archivedError) {
          const formattedArchivedHabits = (archivedData || []).map(habit => ({
            ...habit,
            default_rating: habit.default_rating || null
          }));
          
          setArchivedHabits(formattedArchivedHabits);
        } else {
          console.error("Error fetching archived habits:", archivedError);
        }
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
      toast.error("Failed to load habits");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Archive a habit
  const archiveHabit = async (habitId: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      console.log("Attempting to archive habit:", habitId);
      
      // Get the habit name for the error message
      const habitToArchive = habits.find(h => h.id === habitId);
      if (!habitToArchive) {
        throw new Error("Habit not found");
      }
      
      // Attempt direct update first
      const { error: updateError } = await supabase
        .from('habits')
        .update({ active: false })
        .eq('id', habitId)
        .eq('user_id', user.id);
      
      if (updateError) {
        // If column doesn't exist, we need to create it first
        if (updateError.message.includes("column")) {
          console.log("Column doesn't exist, attempting to create it");
          
          // Try to execute a raw SQL query to add the column
          await fetch('/api/add-active-column', {
            method: 'POST',
          });
          
          // Try the update again
          const { error: secondUpdateError } = await supabase
            .from('habits')
            .update({ active: false })
            .eq('id', habitId)
            .eq('user_id', user.id);
          
          if (secondUpdateError) {
            throw secondUpdateError;
          }
        } else {
          throw updateError;
        }
      }
      
      // Update local state on success
      setHabits(habits.filter(habit => habit.id !== habitId));
      
      toast.success("Habit archived", {
        description: `"${habitToArchive.name}" has been archived and won't appear in your daily view.`
      });
    } catch (error) {
      console.error("Error archiving habit:", error);
      toast.error("Failed to archive habit", {
        description: "There was an error archiving the habit. Please try again."
      });
    } finally {
      setIsLoading(false);
      setHabitToDelete(null);
    }
  };
  
  // Permanently delete a habit
  const permanentlyDeleteHabit = async (habitId: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      console.log("Attempting to permanently delete habit:", habitId);
      
      // Get the habit name for the success message
      const habitToDelete = archivedHabits.find(h => h.id === habitId);
      if (!habitToDelete) {
        throw new Error("Habit not found");
      }
      
      // Delete the habit
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Also delete habit completions to prevent orphaned records
      const { error: completionsError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id);
        
      if (completionsError) {
        console.error("Error deleting habit completions:", completionsError);
        // Continue anyway since the habit was deleted
      }
      
      // Update local state on success
      setArchivedHabits(archivedHabits.filter(habit => habit.id !== habitId));
      
      toast.success("Habit permanently deleted", {
        description: `"${habitToDelete.name}" has been permanently deleted.`
      });
    } catch (error) {
      console.error("Error deleting habit:", error);
      toast.error("Failed to delete habit", {
        description: "There was an error deleting the habit. Please try again."
      });
    } finally {
      setIsLoading(false);
      setHabitToPermanentlyDelete(null);
    }
  };
  
  // Restore an archived habit
  const restoreHabit = async (habitId: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      console.log("Attempting to restore habit:", habitId);
      
      // Get the habit to restore
      const habitToRestore = archivedHabits.find(h => h.id === habitId);
      if (!habitToRestore) {
        throw new Error("Habit not found");
      }
      
      // Update the habit to active
      const { error } = await supabase
        .from('habits')
        .update({ active: true })
        .eq('id', habitId)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setArchivedHabits(prev => prev.filter(h => h.id !== habitId));
      setHabits(prev => [...prev, {...habitToRestore, active: true}]);
      
      toast.success("Habit restored", {
        description: `"${habitToRestore.name}" has been restored and will appear in your daily view.`
      });
    } catch (error) {
      console.error("Error restoring habit:", error);
      toast.error("Failed to restore habit", {
        description: "There was an error restoring the habit. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load habits on component mount
  useEffect(() => {
    const init = async () => {
      try {
        // Try to create the column if it doesn't exist
        await supabase.rpc('add_active_column_if_not_exists');
      } catch (error) {
        // If RPC fails (which is expected if function doesn't exist), 
        // we'll just continue - column might already exist from migrations
        console.log("Column might already exist, continuing to fetch habits");
      }
      
      // Then fetch habits
      fetchHabits();
    };
    
    init();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Manage Habits</h2>
        <AddHabitDialog onHabitAdded={fetchHabits} />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin h-6 w-6 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Active Habits */}
          {habits.filter(h => h.active).length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-md font-medium mb-2">Active Habits</h3>
              {habits
                .filter(h => h.active)
                .map((habit) => (
                  <div 
                    key={habit.id} 
                    className="flex justify-between items-center p-3 rounded-md border"
                  >
                    <div>
                      <div className="font-medium">{habit.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {habit.category} • {
                          habit.habit_type === "checkbox" ? "Checkbox" : 
                          habit.habit_type === "duration" ? "Duration" : 
                          habit.habit_type === "rating" ? "Rating" : 
                          "Unknown"
                        }
                      </div>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setHabitToDelete(habit.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Archive Habit</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will archive the habit "{habit.name}". It will no longer appear in your daily view, but all historical data will be preserved for statistics. This action can't be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setHabitToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => archiveHabit(habit.id)}
                          >
                            Archive
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border rounded-md border-dashed text-center">
              <p className="text-muted-foreground mb-4">No habits found. Create a new habit to get started.</p>
              <AddHabitDialog onHabitAdded={fetchHabits} />
            </div>
          )}
          
          {/* Archived Habits Toggle */}
          {archivedHabits.length > 0 && (
            <div className="mt-8">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowArchived(!showArchived)}
                className="w-full justify-center py-2"
              >
                {showArchived ? "Hide Archived Habits" : `Show Archived Habits (${archivedHabits.length})`}
              </Button>
            </div>
          )}
          
          {/* Archived Habits Section */}
          {showArchived && archivedHabits.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-md font-medium mb-2 text-muted-foreground">Archived Habits</h3>
              {archivedHabits.map((habit) => (
                <div 
                  key={habit.id} 
                  className="flex justify-between items-center p-3 rounded-md border border-dashed"
                >
                  <div>
                    <div className="font-medium text-muted-foreground">{habit.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {habit.category} • {
                        habit.habit_type === "checkbox" ? "Checkbox" : 
                        habit.habit_type === "duration" ? "Duration" : 
                        habit.habit_type === "rating" ? "Rating" : 
                        "Unknown"
                      }
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreHabit(habit.id)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Restore
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setHabitToPermanentlyDelete(habit.id)}
                        >
                          Delete Forever
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Permanently Delete Habit</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the habit "{habit.name}" and all its historical data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setHabitToPermanentlyDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => permanentlyDeleteHabit(habit.id)}
                          >
                            Delete Forever
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 