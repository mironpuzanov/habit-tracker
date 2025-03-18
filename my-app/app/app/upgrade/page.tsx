"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Shield, Zap, Clock, BarChart, Users } from "lucide-react"

export default function UpgradeProPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Upgrade to Pro</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Take your habit tracking to the next level with advanced features and insights
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Free Plan */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">Free</CardTitle>
            <CardDescription className="text-lg">For casual habit trackers</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Track up to 5 daily habits</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Basic habit analytics</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>7-day habit history</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Daily reminders</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Current Plan</Button>
          </CardFooter>
        </Card>
        
        {/* Pro Plan */}
        <Card className="border-2 border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-md">
            POPULAR
          </div>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              Pro
              <Sparkles className="h-5 w-5 text-yellow-500 ml-2" />
            </CardTitle>
            <CardDescription className="text-lg">For serious habit builders</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Unlimited habits</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Advanced analytics and insights</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Unlimited habit history</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Custom reminders and notifications</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Habit streaks and challenges</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Data export and integrations</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
              <Shield className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Features */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-10">Pro features to boost your habits</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Unlimited Habits</h3>
            <p className="text-muted-foreground">Track as many habits as you want, with no limitations</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Habit Streaks</h3>
            <p className="text-muted-foreground">Keep track of your consistency with visual streak counters</p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Advanced Analytics</h3>
            <p className="text-muted-foreground">Get detailed insights into your habit performance</p>
          </div>
        </div>
      </div>
      
      {/* FAQ */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Can I cancel my subscription anytime?</h3>
            <p className="text-muted-foreground">Yes, you can cancel your Pro subscription at any time. Your benefits will continue until the end of your billing period.</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Will I lose my data if I downgrade?</h3>
            <p className="text-muted-foreground">You won't lose any data, but you'll only be able to access the most recent data within the limits of the Free plan.</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Is there a team or family plan?</h3>
            <p className="text-muted-foreground">We're currently working on team plans. Stay tuned for updates!</p>
          </div>
        </div>
      </div>
    </div>
  )
} 