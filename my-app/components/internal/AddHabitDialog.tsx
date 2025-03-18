"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, "Habit name is required"),
  category: z.string().min(1, "Category is required"),
  habitType: z.enum(["checkbox", "duration", "rating"], {
    required_error: "Please select a habit type",
  }),
  defaultDuration: z.string().optional(),
  defaultRating: z.string().optional(),
}).refine(
  (data) => {
    // If habit type is duration and defaultDuration is provided, validate it's a valid number
    if (data.habitType === "duration" && data.defaultDuration && data.defaultDuration.trim() !== "") {
      const num = parseInt(data.defaultDuration);
      return !isNaN(num) && num >= 0;
    }
    // If habit type is rating and defaultRating is provided, validate it's a valid rating
    if (data.habitType === "rating" && data.defaultRating && data.defaultRating.trim() !== "") {
      const num = parseFloat(data.defaultRating);
      return !isNaN(num) && num >= 0 && num <= 5;
    }
    return true;
  },
  {
    message: "Please enter a valid value",
    path: ["defaultDuration"],
  }
);

type FormValues = z.infer<typeof formSchema>

interface AddHabitDialogProps {
  onHabitAdded?: () => void;
}

export function AddHabitDialog({ onHabitAdded }: AddHabitDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      habitType: "checkbox",
      defaultDuration: "",
      defaultRating: "",
    },
  })

  // Watch the habit type to conditionally show fields
  const habitType = form.watch("habitType");

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("You must be logged in to create habits")
      }
      
      // Prepare the habit data
      const habitData = {
        name: values.name,
        category: values.category,
        user_id: user.id,
        habit_type: values.habitType,
        default_duration: values.habitType === "duration" && values.defaultDuration && values.defaultDuration.trim() !== "" 
          ? parseInt(values.defaultDuration) 
          : null,
        default_rating: values.habitType === "rating" && values.defaultRating && values.defaultRating.trim() !== "" 
          ? parseFloat(values.defaultRating) 
          : null,
        created_at: new Date().toISOString(),
      };
      
      // Save the habit to Supabase
      const { error } = await supabase
        .from('habits')
        .insert(habitData);
      
      if (error) throw error
      
      toast.success("Habit created", {
        description: `"${values.name}" has been added to your habits.`,
      })
      
      // Close dialog and reset form
      setOpen(false)
      form.reset()
      
      // Notify parent component
      if (onHabitAdded) {
        onHabitAdded()
      }
    } catch (error) {
      console.error("Error creating habit:", error)
      toast.error("Error", {
        description: "Failed to create habit. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Habit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter habit name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="habitType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Habit Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="checkbox" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Checkbox (Mark as complete)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="duration" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Duration (Track time in minutes)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="rating" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Rating (0-5)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {habitType === "duration" && (
              <FormField
                control={form.control}
                name="defaultDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Duration (minutes - optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="Enter minutes or leave empty..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      How many minutes do you aim to spend on this habit? Leave empty for no default.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {habitType === "rating" && (
              <FormField
                control={form.control}
                name="defaultRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Rating (0-5)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="5" 
                        placeholder="Enter rating..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      What is your default rating for this habit?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Habit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 