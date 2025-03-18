"use client"

import { useState, useEffect } from "react";
import { signOutAction, updateProfilePictureAction, updateProfileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Upload, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserProfile {
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export default function AccountPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: ''
  });
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          try {
            // Get profile data
            const { data, error } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", user.id)
              .single();
              
            if (error) {
              console.error("Error fetching profile in account page:", error);
              throw error;
            }
            
            console.log("Account page - Fetched profile data:", data);
            
            const profileData = {
              name: data.name,
              avatar_url: data.avatar_url,
              email: user.email || null
            };
            
            setUserProfile(profileData);
            
            // Initialize form state
            setFormState({
              name: data.name || '',
              email: user.email || ''
            });
          } catch (profileError) {
            // Profile doesn't exist, create one
            console.log("Profile not found, creating new profile for user");
            
            const newProfile = {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile);
              
            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast.error("Failed to create profile");
            } else {
              console.log("Created new profile for user");
            }
            
            // Set user data from user_metadata as fallback
            const profileData = {
              name: user.user_metadata?.name || user.email?.split('@')[0] || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              email: user.email || null
            };
            
            setUserProfile(profileData);
            
            // Initialize form state
            setFormState({
              name: profileData.name || '',
              email: profileData.email || ''
            });
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Add file size validation (5MB limit)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      toast.error(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      
      const result = await updateProfilePictureAction(formData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        console.log("Profile update result:", result);
        setUserProfile(prev => {
          const updated = prev ? { 
            ...prev, 
            avatar_url: result.avatarUrl as string | null
          } : null;
          console.log("Updated profile state:", updated);
          return updated;
        });
        toast.success("Profile picture updated successfully");
        
        window.location.reload();
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    
    try {
      const formData = new FormData();
      formData.append("name", formState.name);
      formData.append("email", formState.email);
      
      const result = await updateProfileAction(formData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        
        // Update the local state
        setUserProfile(prev => prev ? {
          ...prev,
          name: formState.name,
          email: formState.email
        } : null);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
    }
    return userProfile?.email?.substring(0, 2).toUpperCase() || 'U';
  };
  
  const getAvatarUrl = (url: string | null) => {
    if (!url) return '';
    
    console.log("Account page - Raw avatar URL:", url);
    
    // If it's already a full URL, use it
    if (url.startsWith('http')) {
      return url;
    }
    
    // If it's just a filename, construct the URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/avatars/${url}`;
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Account</h1>
      <p className="mb-6">Manage your account settings and preferences.</p>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Account Settings</h2>
          <div className="border rounded-lg p-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium mb-1">Profile Picture</h3>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative">
                  {loading ? (
                    <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Avatar className="h-24 w-24 border-2 border-border shadow-md" key={userProfile?.avatar_url}>
                      <AvatarImage 
                        src={getAvatarUrl(userProfile?.avatar_url || null)} 
                        alt="Profile" 
                        className="object-cover"
                      />
                      <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                    </Avatar>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Upload a new profile picture. Square images work best.
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="avatar-upload">
                      <div className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Profile Information</h3>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-10 bg-muted animate-pulse rounded"></div>
                  <div className="h-10 bg-muted animate-pulse rounded"></div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={formState.name} 
                      onChange={(e) => setFormState({...formState, name: e.target.value})}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={formState.email} 
                      onChange={(e) => setFormState({...formState, email: e.target.value})}
                      placeholder="your.email@example.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Changing your email will require confirmation via the new email address.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={updatingProfile || 
                      (formState.name === userProfile?.name && 
                      formState.email === userProfile?.email)}
                    className="flex items-center gap-2"
                  >
                    {updatingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Authentication</h2>
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium">Log out</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Sign out of your account on this device.
              </p>
              <form action={signOutAction} className="flex justify-start">
                <Button type="submit" variant="destructive">
                  Log out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 