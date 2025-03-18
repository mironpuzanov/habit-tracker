"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfMonth, endOfMonth, format, subMonths, addMonths } from "date-fns";
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

interface MonthlyHabitData {
  name: string;
  type: "checkbox" | "duration" | "rating";
  data: number[];
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [monthLabels, setMonthLabels] = useState<string[]>([]);
  const [habitSeries, setHabitSeries] = useState<MonthlyHabitData[]>([]);
  
  const supabase = createClient();
  
  // Function to load habits and aggregate data
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
      
      // Generate labels for last 6 months
      const labels: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        labels.push(format(monthDate, 'MMM yyyy'));
      }
      setMonthLabels(labels);
      
      // Get habit data for each month
      const seriesData: MonthlyHabitData[] = [];
      
      for (const habit of habits) {
        const monthlyValues: number[] = [];
        
        for (let i = 5; i >= 0; i--) {
          const monthDate = subMonths(new Date(), i);
          const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
          const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');
          
          const { data: monthCompletions, error: monthError } = await supabase
            .from('habit_completions')
            .select('id, completed_date, duration, rating')
            .eq('user_id', user.id)
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
          
          monthlyValues.push(value);
        }
        
        seriesData.push({
          name: habit.name,
          type: habit.habit_type,
          data: monthlyValues
        });
      }
      
      setHabitSeries(seriesData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);
  
  // Define chart colors based on habit type
  const getSeriesColors = () => {
    return habitSeries.map(series => {
      switch (series.type) {
        case 'checkbox':
          return 'hsl(var(--primary))';
        case 'duration':
          return 'hsl(var(--success))';
        case 'rating':
          return 'hsl(var(--warning))';
        default:
          return 'hsl(var(--muted-foreground))';
      }
    });
  };

  // Get formatted tooltip value based on habit type
  const formatTooltipValue = (value: number, seriesIndex: number) => {
    const series = habitSeries[seriesIndex];
    if (!series) return value.toString();
    
    switch (series.type) {
      case 'checkbox':
        return `${value} times`;
      case 'duration':
        return `${value} minutes`;
      case 'rating':
        return `${value}/5`;
      default:
        return value.toString();
    }
  };
  
  // Chart options
  const chartOptions = {
    chart: {
      background: 'transparent',
      toolbar: {
        show: false
      },
      stacked: false,
      fontFamily: 'inherit',
      height: 500,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: [3, 3, 3],
      curve: 'smooth' as const,
    },
    xaxis: {
      categories: monthLabels,
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
        text: 'Value',
        style: {
          color: 'hsl(var(--muted-foreground))',
          fontFamily: 'inherit'
        }
      },
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
      shared: false,
      intersect: true,
      y: {
        formatter: (value: number, { seriesIndex }: { seriesIndex: number }) => {
          return formatTooltipValue(value, seriesIndex);
        }
      }
    },
    legend: {
      position: 'top' as const,
      horizontalAlign: 'left' as const,
      fontSize: '14px',
      fontFamily: 'inherit',
      labels: {
        colors: 'hsl(var(--foreground))'
      },
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        fillColors: undefined,
        radius: 12,
        customHTML: undefined,
        onClick: undefined,
        offsetX: 0,
        offsetY: 0
      }
    },
    grid: {
      show: true,
      borderColor: 'hsl(var(--border) / 0.2)',
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    }
  };
  
  return (
    <div className="h-screen flex flex-col pt-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Habit Summary</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center flex-1">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Card className="w-full h-full">
            <CardHeader className="pb-2">
              <CardTitle>Monthly Habit Summary</CardTitle>
              <CardDescription>All habits performance over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-90px)] pt-4">
              {habitSeries.length > 0 ? (
                <ApexChart
                  type="line"
                  series={habitSeries.map(series => ({
                    name: series.name,
                    data: series.data,
                    type: 'bar'
                  }))}
                  options={{
                    ...chartOptions,
                    colors: getSeriesColors()
                  }}
                  height="100%"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No habit data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 