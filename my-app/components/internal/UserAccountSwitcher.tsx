"use client"

import * as React from "react"
import { User, LogOut, Settings, CreditCard, Sparkles } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"

interface UserData {
  email: string | null
  name: string | null
  avatar_url: string | null
}

export function UserAccountSwitcher() {
  const [userData, setUserData] = useState<UserData>({
    email: null,
    name: null,
    avatar_url: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  async function getUserData() {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Try to get profile data from profiles table
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', user.id)
            .single();
            
          console.log('UserAccountSwitcher - Fetched profile data:', data);
          
          if (error) {
            console.error("Profile fetch error details:", error);
            throw error;
          }
          
          setUserData({
            email: user.email || null,
            name: data.name || user.user_metadata?.name || user.email?.split('@')[0] || "User",
            avatar_url: data.avatar_url || user.user_metadata?.avatar_url || null
          })
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
          // Fallback to user metadata if profile fetch fails
          setUserData({
            email: user.email || null,
            name: user.user_metadata?.name || user.email?.split('@')[0] || "User",
            avatar_url: user.user_metadata?.avatar_url || null
          })
          
          // Create a profile record for this user
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .single();
            
          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            console.log("Created new profile for user");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getUserData()
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUserData()
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }
  
  const getAvatarUrl = (url: string | null) => {
    if (!url) return '';
    
    console.log("UserAccountSwitcher - Raw avatar URL:", url);
    
    // If it's already a full URL, use it
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's just a filename, construct the URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/avatars/${url}`;
  };

  if (isLoading) {
    return <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground/80 backdrop-blur-xl">Loading...</div>
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-between w-full p-4 hover:bg-accent/30 transition-all duration-200 rounded-md cursor-pointer backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-background/10 shadow-sm ring-2 ring-background/5" key={userData.avatar_url}>
                <AvatarImage 
                  src={getAvatarUrl(userData.avatar_url)} 
                  alt={userData.name || ''} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/60 to-primary-foreground/10 text-primary-foreground">
                  {(userData.name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium leading-none drop-shadow-sm">{userData.name}</p>
                <p className="text-xs text-muted-foreground">{userData.email}</p>
              </div>
            </div>
            <User className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-background/50 border border-border/30 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
          <DropdownMenuLabel className="text-foreground/90">My Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/20" />
          <DropdownMenuItem asChild className="focus:bg-accent/40 focus:text-accent-foreground data-[highlighted]:bg-accent/40">
            <Link href="/app/account">
              <User className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-accent/40 focus:text-accent-foreground data-[highlighted]:bg-accent/40">
            <Link href="/app/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Habit Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="focus:bg-accent/40 focus:text-accent-foreground data-[highlighted]:bg-accent/40">
            <Link href="/app/billing">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/20" />
          <DropdownMenuItem asChild className="text-primary focus:bg-accent/40 focus:text-primary data-[highlighted]:bg-accent/40">
            <Link href="/app/upgrade" className="bg-gradient-to-r from-primary/5 to-transparent rounded-sm">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="font-medium">Upgrade to Pro</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/20" />
          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="focus:bg-accent/40 focus:text-accent-foreground data-[highlighted]:bg-accent/40"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 