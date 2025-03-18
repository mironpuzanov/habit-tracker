import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get database connection (using a more direct approach)
    const { data, error } = await supabase.from('habits').select('*').limit(1);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Execute raw SQL to add the column
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE habits ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE; CREATE INDEX IF NOT EXISTS habits_active_idx ON habits(active);"
    });
    
    if (sqlError) {
      // Fallback: try a different approach using table updates
      const { error: fallbackError } = await supabase.from('_schema').select('*');
      
      if (fallbackError) {
        return NextResponse.json(
          { 
            error: "Failed to add column", 
            original: sqlError.message,
            fallback: fallbackError.message 
          }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { status: "incomplete", message: "Column addition attempted but may not have succeeded" },
        { status: 207 }
      );
    }
    
    return NextResponse.json({ status: "success", message: "Column added successfully" });
    
  } catch (error) {
    console.error("Error adding column:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 