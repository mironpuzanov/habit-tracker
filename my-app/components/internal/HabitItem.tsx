"use client"

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Clock, Star } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface HabitItemProps {
  id: string;
  name: string;
  type: "checkbox" | "duration" | "rating";
  defaultDuration?: number | null;
  defaultRating?: number | null;
  completed: boolean;
  duration?: number | null;
  rating?: number | null;
  onCompletionChange?: (id: string, completed: boolean, duration?: number, rating?: number) => void;
  readOnly?: boolean;
}

export function HabitItem({ 
  id, 
  name, 
  type = "checkbox",
  defaultDuration = null,
  defaultRating = null,
  completed = false, 
  duration = null,
  rating = null,
  onCompletionChange,
  readOnly = false
}: HabitItemProps) {
  const [isChecked, setIsChecked] = useState(completed);
  const [durationValue, setDurationValue] = useState<number | null>(
    duration !== null ? duration : 
    defaultDuration !== null ? defaultDuration : 
    0
  );
  const [ratingValue, setRatingValue] = useState<number | null>(
    rating !== null ? rating : 
    defaultRating !== null ? defaultRating : 
    0
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const supabase = createClient();

  // Update local state when props change
  useEffect(() => {
    setIsChecked(completed);
    setDurationValue(duration !== null ? duration : defaultDuration !== null ? defaultDuration : 0);
    setRatingValue(rating !== null ? rating : defaultRating !== null ? defaultRating : 0);
  }, [completed, defaultDuration, duration, defaultRating, rating]);

  const handleCheckedChange = async (checked: boolean) => {
    // Don't allow changes in read-only mode
    if (readOnly) {
      return;
    }
    
    if (type === "checkbox") {
      await saveHabitCompletion(checked);
    } else if (type === "duration" && !isEditing) {
      setIsEditing(true);
      // Clear initial value when entering edit mode to prevent 0 from showing up first
      setDurationValue(null);
    } else if (type === "rating" && !isEditing) {
      setIsEditing(true);
    }
  };

  const saveHabitCompletion = async (checked: boolean, completedDuration?: number, completedRating?: number) => {
    try {
      setIsUpdating(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Get today's date in ISO format, but only the date part (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      // Get the duration value to save - for duration habits, we always want a value
      const finalDuration = completedDuration ?? durationValue ?? 0;
      const durationToSave = type === "duration" ? finalDuration : null;
      
      // Get the rating value to save
      const finalRating = completedRating ?? ratingValue ?? 0;
      const ratingToSave = type === "rating" ? finalRating : null;
      
      console.log(`Saving habit completion: ID=${id}, duration=${durationToSave}, rating=${ratingToSave}`);
      
      // For duration or rating habits, always use the upsert approach to ensure we have the latest value
      if ((type === "duration" || type === "rating") && checked) {
        // First delete any existing completion for today
        await supabase
          .from('habit_completions')
          .delete()
          .match({ 
            habit_id: id, 
            user_id: user.id,
            completed_date: today 
          });
          
        // Then insert a new one with the current values
        const { error: insertError } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: id,
            user_id: user.id,
            completed_date: today,
            duration: durationToSave,
            rating: ratingToSave
          });
          
        if (insertError) throw insertError;
        
        // Update the local state with the saved values
        if (type === "duration") {
          setDurationValue(finalDuration);
        } else if (type === "rating") {
          setRatingValue(finalRating);
        }
        
        console.log(`Successfully saved: ${type === "duration" ? `duration: ${durationToSave}` : `rating: ${ratingToSave}`}`);
      } else if (checked) {
        // For checkbox habits or initial save
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: id,
            user_id: user.id,
            completed_date: today,
            duration: durationToSave,
            rating: ratingToSave
          });
          
        if (error) {
          // If the error is a unique constraint violation, the habit was already completed today
          if (error.code === '23505') {
            // For duration or rating habits, update the existing record
            if (type === "duration" || type === "rating") {
              const updateData = type === "duration" 
                ? { duration: durationToSave }
                : { rating: ratingToSave };
                
              const { error: updateError } = await supabase
                .from('habit_completions')
                .update(updateData)
                .match({ 
                  habit_id: id, 
                  user_id: user.id,
                  completed_date: today 
                });
                
              if (updateError) throw updateError;
            } else {
              // This is fine for checkboxes, it means the habit was already marked complete today
              console.log("Habit already completed today");
            }
          } else {
            throw error;
          }
        }
      } else {
        // Remove completion record
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .match({ 
            habit_id: id, 
            user_id: user.id,
            completed_date: today 
          });
          
        if (error) throw error;
      }
      
      // Update local state
      setIsChecked(checked);
      
      // For duration habits, update the durationValue
      if (type === "duration" && checked && completedDuration !== undefined) {
        setDurationValue(completedDuration);
      }
      
      // For rating habits, update the ratingValue
      if (type === "rating" && checked && completedRating !== undefined) {
        setRatingValue(completedRating);
      }
      
      // Notify parent component
      if (onCompletionChange) {
        onCompletionChange(
          id, 
          checked, 
          type === "duration" ? (durationToSave ?? 0) : undefined,
          type === "rating" ? (ratingToSave ?? 0) : undefined
        );
      }
    } catch (error) {
      console.error("Error updating habit completion:", error);
      toast.error("Failed to update habit", {
        description: "There was an error saving your progress"
      });
      
      // Revert checkbox to previous state
      setIsChecked(!checked);
    } finally {
      setIsUpdating(false);
      setIsEditing(false);
    }
  };

  const handleDurationSubmit = () => {
    // Use 0 as default when duration is null
    saveHabitCompletion(true, durationValue ?? 0);
    
    // Force the page to refresh after saving
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDurationCancel = () => {
    setIsEditing(false);
    // Restore the original value or use 0 as fallback
    setDurationValue(duration !== null ? duration : defaultDuration !== null ? defaultDuration : 0);
  };

  const handleRatingSubmit = () => {
    console.log("Submitting rating:", ratingValue);
    saveHabitCompletion(true, undefined, ratingValue || 0);
    
    // Force the page to refresh after saving
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleRatingCancel = () => {
    setIsEditing(false);
    setRatingValue(rating || defaultRating || 0);
  };

  // Format rating to display with one decimal place if needed
  const displayRating = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return "0";
    return val % 1 === 0 ? val.toString() : val.toFixed(1);
  };

  // Generate stars based on the rating
  const renderStars = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={16} className="text-primary fill-primary" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star size={16} className="text-primary" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star size={16} className="text-primary fill-primary" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={16} className="text-muted-foreground" />
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-gray-100 last:border-0 min-h-[44px]">
      <label
        htmlFor={type === "checkbox" && !readOnly ? id : undefined}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {name}
      </label>
      
      <div className="flex items-center min-w-[100px] justify-end">
        {type === "checkbox" ? (
          <Checkbox 
            id={id} 
            checked={isChecked}
            onCheckedChange={readOnly ? undefined : handleCheckedChange}
            className={`h-5 w-5 border-2 rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${
              isUpdating ? 'opacity-50 cursor-wait' : 
              readOnly ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isUpdating || readOnly}
          />
        ) : type === "duration" ? (
          <div className="flex items-center min-h-[28px]">
            {isEditing && !readOnly ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={durationValue === null ? "" : durationValue}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setDurationValue(null);
                    } else {
                      const parsedValue = parseInt(e.target.value);
                      setDurationValue(isNaN(parsedValue) ? 0 : parsedValue);
                    }
                  }}
                  className="w-16 h-7 text-sm"
                  disabled={isUpdating}
                />
                <span className="text-xs text-muted-foreground w-8">mins</span>
                <div className="flex space-x-1">
                  <Button 
                    type="button" 
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 p-0" 
                    disabled={isUpdating}
                    onClick={handleDurationSubmit}
                  >
                    <Check size={14} className="text-primary" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 p-0" 
                    disabled={isUpdating}
                    onClick={handleDurationCancel}
                  >
                    <span className="text-xs text-muted-foreground">✕</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className={`flex items-center gap-1 min-h-[28px] ${
                  readOnly ? 'cursor-default' : 'cursor-pointer'
                } ${isChecked ? 'opacity-70' : ''}`}
                onClick={readOnly ? undefined : () => handleCheckedChange(!isChecked)}
              >
                <Clock size={18} className={`${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                {isChecked && (
                  <span className="text-sm text-primary font-medium">
                    {(duration !== null ? duration : durationValue !== null ? durationValue : 0)} mins
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center min-h-[28px]">
            {isEditing && !readOnly ? (
              <div className="flex items-center gap-2">
                <Slider
                  defaultValue={[ratingValue || 0]}
                  max={5}
                  step={0.5}
                  onValueChange={(values) => setRatingValue(values[0])}
                  disabled={isUpdating}
                  className="w-24"
                />
                <span className="text-sm font-medium w-6">{displayRating(ratingValue)}</span>
                <div className="flex space-x-1">
                  <Button 
                    type="button" 
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 p-0" 
                    disabled={isUpdating}
                    onClick={handleRatingSubmit}
                  >
                    <Check size={14} className="text-primary" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 p-0" 
                    disabled={isUpdating}
                    onClick={handleRatingCancel}
                  >
                    <span className="text-xs text-muted-foreground">✕</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className={`flex items-center gap-1 min-h-[28px] ${
                  readOnly ? 'cursor-default' : 'cursor-pointer'
                } ${isChecked ? 'opacity-100' : 'opacity-70'}`}
                onClick={readOnly ? undefined : () => handleCheckedChange(!isChecked)}
              >
                {isChecked ? (
                  renderStars(rating !== null ? rating : ratingValue)
                ) : (
                  <Star 
                    size={18} 
                    className="text-muted-foreground" 
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 