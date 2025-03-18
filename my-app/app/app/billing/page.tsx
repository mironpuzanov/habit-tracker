"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Calendar, DollarSign, Shield } from "lucide-react"

export default function BillingPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Billing</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Method
            </CardTitle>
            <CardDescription>Manage your payment details and billing address</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-muted/50 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-12 w-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded-md mr-4 flex items-center justify-center text-white font-bold">VISA</div>
                <div>
                  <p className="font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                </div>
              </div>
              <Button variant="outline">Update</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>You are currently on the Free plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-md flex items-center justify-between">
                <div>
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-muted-foreground">Basic features with limited usage</p>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>0</span>
                  <span className="text-xs ml-1">/month</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="default" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Shield className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>View your recent invoices and payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <p>No billing history available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 