"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

// Dynamically import ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Habit {
  id: string;
  name: string;
  category: string;
  habit_type: "checkbox" | "duration" | "rating";
  active: boolean;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  duration: number | null;
  rating: number | null;
}

interface MonthlyComparisonData {
  month: string;
  value: number;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeHabits, setActiveHabits] = useState<Habit[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [monthlyComparisons, setMonthlyComparisons] = useState<Record<string, MonthlyComparisonData[]>>({});
  
  const supabase = createClient();
  
  // Function to load habits and stats
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Get all active habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, category, habit_type, active')
        .eq('user_id', user.id)
        .eq('active', true);
      
      if (habitsError) throw habitsError;
      
      setActiveHabits(habits);
      
      // Fetch data for month-to-month comparisons (last 12 months)
      await loadMonthlyComparisons(habits, user.id);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load month-to-month comparison data for all habits
  const loadMonthlyComparisons = async (habits: Habit[], userId: string) => {
    try {
      // Get data for last 12 months for all habits
      const comparisons: Record<string, MonthlyComparisonData[]> = {};
      
      for (const habit of habits) {
        comparisons[habit.id] = [];
        
        for (let i = 11; i >= 0; i--) {
          const monthDate = subMonths(new Date(), i);
          const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
          const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
          const monthLabel = format(monthDate, 'MMM');
          
          const { data: monthCompletions, error: monthError } = await supabase
            .from('habit_completions')
            .select('id, completed_date, duration, rating')
            .eq('user_id', userId)
            .eq('habit_id', habit.id)
            .gte('completed_date', monthStart)
            .lte('completed_date', monthEnd);
          
          if (monthError) throw monthError;
          
          let value = 0;
          if (habit.habit_type === 'checkbox') {
            value = monthCompletions.length;
          } else if (habit.habit_type === 'duration') {
            value = monthCompletions.reduce((sum, c) => sum + (c.duration || 0), 0);
          } else if (habit.habit_type === 'rating') {
            const validRatings = monthCompletions.filter(c => c.rating !== null);
            const avgRating = validRatings.length > 0
              ? validRatings.reduce((sum, c) => sum + (c.rating || 0), 0) / validRatings.length
              : 0;
            value = parseFloat(avgRating.toFixed(1));
          }
          
          comparisons[habit.id].push({
            month: monthLabel,
            value
          });
        }
      }
      
      setMonthlyComparisons(comparisons);
    } catch (error) {
      console.error("Error loading monthly comparisons:", error);
    }
  };
  
  // Load data when component mounts or month changes
  useEffect(() => {
    loadData();
  }, [currentMonth]);
  
  // Function to go to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  // Function to go to next month (but not beyond current)
  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= new Date()) {
      setCurrentMonth(nextMonth);
    }
  };
  
  // Define chart colors that match shadcn theme
  const chartColors = {
    checkbox: 'hsl(var(--primary))',
    duration: 'hsl(var(--success))',
    rating: 'hsl(var(--warning))',
    default: 'hsl(var(--muted-foreground))'
  };
  
  // Line chart options for monthly comparisons
  const getMonthlyComparisonOptions = (title: string, valueType: string, habitType: string) => ({
    chart: {
      background: 'transparent',
      toolbar: {
        show: false
      },
      fontFamily: 'inherit',
      height: 350,
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3,
      lineCap: 'round' as const,
    },
    markers: {
      size: 5,
      hover: {
        size: 7
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: {
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontSize: '12px',
          fontFamily: 'inherit'
        }
      }
    },
    yaxis: {
      title: {
        text: valueType,
        style: {
          color: 'hsl(var(--muted-foreground))',
          fontFamily: 'inherit'
        }
      },
      min: habitType === 'rating' ? 0 : undefined,
      max: habitType === 'rating' ? 5 : undefined,
      labels: {
        style: {
          colors: 'hsl(var(--muted-foreground))',
          fontSize: '12px',
          fontFamily: 'inherit'
        }
      }
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (value: number) => {
          switch (habitType) {
            case 'checkbox':
              return `${value} times`;
            case 'duration':
              return `${value} minutes`;
            case 'rating':
              return `${value}/5`;
            default:
              return value.toString();
          }
        }
      }
    },
    title: {
      text: title,
      align: 'left' as const,
      style: {
        fontSize: '16px',
        fontWeight: 600,
        fontFamily: 'inherit',
        color: 'hsl(var(--foreground))'
      }
    },
    grid: {
      show: true,
      borderColor: 'hsl(var(--border) / 0.2)',
      row: {
        colors: ['transparent', 'transparent'],
        opacity: 0.1
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        gradientToColors: [
          habitType === 'checkbox' 
            ? 'hsl(var(--primary) / 0.2)' 
            : habitType === 'duration' 
              ? 'hsl(var(--success) / 0.2)'
              : 'hsl(var(--warning) / 0.2)'
        ],
        shadeIntensity: 1,
        type: 'horizontal',
        opacityFrom: 0.7,
        opacityTo: 0.9,
      }
    }
  });
  
  // Group habits by type
  const habitsByType = activeHabits.reduce((acc: Record<string, Habit[]>, habit) => {
    const type = habit.habit_type || 'checkbox';
    if (!acc[type]) acc[type] = [];
    acc[type].push(habit);
    return acc;
  }, {});
  
  return (
    <div className="h-screen flex flex-col pt-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Monthly Progress</h1>
        <div className="flex gap-2 items-center">
          <button 
            onClick={goToPreviousMonth}
            className="text-sm bg-background hover:bg-accent px-3 py-1 rounded-md"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium px-3 py-1 bg-primary/10 rounded-md">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button 
            onClick={goToNextMonth}
            className="text-sm bg-background hover:bg-accent px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={format(addMonths(currentMonth, 1), 'yyyy-MM') > format(new Date(), 'yyyy-MM')}
          >
            Next →
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center flex-1">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Card className="w-full h-full">
            <CardHeader className="pb-2">
              <CardTitle>Monthly Habit Progress</CardTitle>
              <CardDescription>12-month view of your habits' performance</CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-90px)] overflow-auto">
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Habits</TabsTrigger>
                  <TabsTrigger value="checkbox">Checkbox</TabsTrigger>
                  <TabsTrigger value="duration">Duration</TabsTrigger>
                  <TabsTrigger value="rating">Rating</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                    {activeHabits.map(habit => {
                      const valueType = habit.habit_type === 'checkbox' 
                        ? 'Completions' 
                        : habit.habit_type === 'duration' 
                          ? 'Minutes' 
                          : 'Rating';
                      
                      return (
                        <div key={habit.id} className="h-[300px]">
                          {monthlyComparisons[habit.id]?.length > 0 ? (
                            <ApexChart
                              type="line"
                              series={[
                                {
                                  name: valueType,
                                  data: monthlyComparisons[habit.id].map(m => m.value)
                                }
                              ]}
                              options={{
                                ...getMonthlyComparisonOptions(habit.name, valueType, habit.habit_type),
                                colors: [
                                  habit.habit_type === 'checkbox' 
                                    ? chartColors.checkbox 
                                    : habit.habit_type === 'duration' 
                                      ? chartColors.duration
                                      : chartColors.rating
                                ],
                                xaxis: {
                                  categories: monthlyComparisons[habit.id].map(m => m.month)
                                }
                              }}
                              height="100%"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-muted-foreground">No data available for this habit</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                
                {['checkbox', 'duration', 'rating'].map(habitType => (
                  <TabsContent key={habitType} value={habitType} className="h-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                      {(habitsByType[habitType] || []).map(habit => {
                        const valueType = habitType === 'checkbox' 
                          ? 'Completions' 
                          : habitType === 'duration' 
                            ? 'Minutes' 
                            : 'Rating';
                        
                        return (
                          <div key={habit.id} className="h-[300px]">
                            {monthlyComparisons[habit.id]?.length > 0 ? (
                              <ApexChart
                                type="line"
                                series={[
                                  {
                                    name: valueType,
                                    data: monthlyComparisons[habit.id].map(m => m.value)
                                  }
                                ]}
                                options={{
                                  ...getMonthlyComparisonOptions(habit.name, valueType, habit.habit_type),
                                  colors: [
                                    habitType === 'checkbox' 
                                      ? chartColors.checkbox 
                                      : habitType === 'duration' 
                                        ? chartColors.duration
                                        : chartColors.rating
                                  ],
                                  xaxis: {
                                    categories: monthlyComparisons[habit.id].map(m => m.month)
                                  }
                                }}
                                height="100%"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">No data available for this habit</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {(habitsByType[habitType] || []).length === 0 && (
                        <div className="col-span-2 flex items-center justify-center h-64">
                          <p className="text-muted-foreground">No {habitType} habits available</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
                
                {activeHabits.length === 0 && (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No habits available</p>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 