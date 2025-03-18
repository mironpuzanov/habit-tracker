"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const applyDatabaseUpdates = async () => {
  try {
    const supabase = await createClient();
    
    const { error: alterTableError } = await supabase.rpc('add_active_column_to_habits');
    if (alterTableError) {
      console.error("Error adding active column:", alterTableError);
      return { success: false, error: alterTableError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Database update error:", error);
    return { success: false, error: String(error) };
  }
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return redirect(`/external/sign-up?error=${encodeURIComponent("Email and password are required")}`);
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return redirect(`/external/sign-up?error=${encodeURIComponent(error.message)}`);
  } else {
    return redirect(`/external/sign-up?success=${encodeURIComponent("Thanks for signing up! Please check your email for a verification link.")}`);
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/external/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  return redirect("/app/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return redirect(`/external/forgot-password?error=${encodeURIComponent("Email is required")}`);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/app/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return redirect(`/external/forgot-password?error=${encodeURIComponent("Could not reset password")}`);
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return redirect(`/external/forgot-password?success=${encodeURIComponent("Check your email for a link to reset your password.")}`);
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return redirect(`/app/reset-password?error=${encodeURIComponent("Password and confirm password are required")}`);
  }

  if (password !== confirmPassword) {
    return redirect(`/app/reset-password?error=${encodeURIComponent("Passwords do not match")}`);
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return redirect(`/app/reset-password?error=${encodeURIComponent("Password update failed")}`);
  }

  return redirect(`/app/reset-password?success=${encodeURIComponent("Password updated")}`);
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};

export const updateProfilePictureAction = async (formData: FormData) => {
  const supabase = await createClient();
  
  // Get the file from the form data
  const avatarFile = formData.get("avatar") as File;
  
  if (!avatarFile || avatarFile.size === 0) {
    return { error: "No file uploaded" };
  }
  
  // Validate file size (5MB limit)
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (avatarFile.size > maxSizeInBytes) {
    return { error: `File size exceeds 5MB limit (${(avatarFile.size / (1024 * 1024)).toFixed(2)}MB)` };
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  try {
    // Create a unique file name
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    console.log("Uploading file:", filePath);
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });
    
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: uploadError.message };
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    
    console.log("File uploaded successfully. Public URL:", publicUrl);
    
    // Check if profiles table exists for this user
    const { data: profileExists, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking profile:", checkError);
    }
    
    let updateResult;
    
    // If profile doesn't exist, create it
    if (!profileExists) {
      updateResult = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || null,
          avatar_url: publicUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } else {
      // Just update the avatar URL
      updateResult = await supabase
        .from("profiles")
        .update({ 
          avatar_url: publicUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", user.id);
    }
    
    if (updateResult.error) {
      console.error("Profile update error:", updateResult.error);
      return { error: updateResult.error.message };
    }
    
    // Fetch the updated profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
      
    console.log("Updated profile:", profile);
    
    if (profileError) {
      console.error("Error fetching updated profile:", profileError);
    }
    
    return { success: true, avatarUrl: publicUrl };
    
  } catch (error) {
    console.error("Unexpected error during avatar update:", error);
    return { error: "Failed to update avatar: " + String(error) };
  }
};

export const updateProfileAction = async (formData: FormData) => {
  const supabase = await createClient();
  
  // Get values from form
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  
  if (!name || !email) {
    return { error: "Name and email are required" };
  }
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: "Not authenticated" };
    }
    
    // Update email in auth if it changed
    if (email !== user.email) {
      const { error: emailUpdateError } = await supabase.auth.updateUser({
        email: email,
      });
      
      if (emailUpdateError) {
        return { error: `Failed to update email: ${emailUpdateError.message}` };
      }
    }
    
    // Update name in profiles table
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ 
        name: name,
        updated_at: new Date().toISOString() 
      })
      .eq("id", user.id);
    
    if (profileUpdateError) {
      return { error: `Failed to update profile: ${profileUpdateError.message}` };
    }
    
    return { 
      success: true, 
      message: email !== user.email 
        ? "Profile updated. Check your email to confirm your new email address." 
        : "Profile updated successfully" 
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile: " + String(error) };
  }
};
