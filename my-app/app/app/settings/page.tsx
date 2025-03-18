"use client"

import { ManageHabits } from "@/components/internal/ManageHabits";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="mb-6">Manage your habits and app preferences.</p>
      
      <div className="space-y-4">
        <ManageHabits />
      </div>
    </div>
  );
} 