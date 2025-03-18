"use client"

import { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HabitItem } from "./HabitItem";
import { Box } from "lucide-react";

interface HabitType {
  id: string;
  name: string;
  completed?: boolean;
  habit_type?: "checkbox" | "duration" | "rating";
  default_duration?: number | null;
  default_rating?: number | null;
  duration?: number | null;
  rating?: number | null;
}

interface HabitCategoryProps {
  title: string;
  habits: HabitType[];
  onCompletionChange?: (habitId: string, completed: boolean, duration?: number, rating?: number) => void;
  isReadOnly?: boolean;
}

export function HabitCategory({ title, habits, onCompletionChange, isReadOnly = false }: HabitCategoryProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-3 gap-2">
        <Box className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-medium">{title}</h2>
      </div>
      <div className="pl-7 border-t pt-2 space-y-0">
        {habits.map((habit) => (
          <HabitItem
            key={habit.id}
            id={habit.id}
            name={habit.name}
            type={habit.habit_type ?? "checkbox"}
            defaultDuration={habit.default_duration ?? null}
            defaultRating={habit.default_rating ?? null}
            completed={Boolean(habit.completed)}
            duration={habit.duration ?? null}
            rating={habit.rating ?? null}
            onCompletionChange={onCompletionChange}
            readOnly={isReadOnly}
          />
        ))}
      </div>
    </div>
  );
} 