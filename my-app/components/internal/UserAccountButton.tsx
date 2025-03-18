"use client"

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { LogOut, Settings, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface UserData {
  email: string | null
  name: string | null
  avatar_url: string | null
}

export default function UserAccountButton() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const getUserData = async () => {
    try {
      setLoading(true)
      
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', user.id)
            .single()
            
          if (error) {
            console.error("Error fetching profile in UserAccountButton:", error)
            throw error
          }
          
          console.log('UserAccountButton - Fetched profile data:', data)
            
          setUserData({
            email: user.email || null,
            name: data.name,
            avatar_url: data.avatar_url,
          })
        } catch (profileError) {
          // Profile doesn't exist, create one
          console.log("Creating new profile for user")
          
          const newProfile = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            
          if (insertError) {
            console.error("Error creating profile:", insertError)
          }
          
          // Set user data from user_metadata as fallback
          setUserData({
            email: user.email || null,
            name: user.user_metadata?.name || user.email?.split('@')[0] || null,
            avatar_url: user.user_metadata?.avatar_url || null,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
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

  // Show initials if no name is available
  const getInitials = () => {
    if (userData?.name) {
      return userData.name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
    }
    return userData?.email?.substring(0, 2).toUpperCase() || 'U'
  }

  const getAvatarUrl = (url: string | null) => {
    if (!url) return '';
    
    console.log("Raw avatar URL:", url);
    
    // If it's already a full URL, use it
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's just a filename, construct the URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/avatars/${url}`;
  };

  // User is still loading
  if (loading) {
    return (
      <div className="flex items-center p-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
        <div className="w-24 h-4 bg-muted animate-pulse ml-2"></div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 h-auto">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2 border border-background/5 shadow-sm" key={userData?.avatar_url}>
              <AvatarImage 
                src={getAvatarUrl(userData?.avatar_url || null)} 
                alt={userData?.name || 'User'} 
                className="object-cover"
              />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-left">
              <p className="text-sm font-medium">{userData?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground">{userData?.email}</p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/app/account">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/app/settings">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 