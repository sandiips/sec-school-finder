import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to convert slug names to proper school names
function formatSchoolName(name: string): string {
  if (!name || typeof name !== 'string') return 'Unknown School';

  // If it's already a proper name (contains uppercase or special chars), return as is
  if (/[A-Z()]/.test(name)) {
    return name;
  }

  // Convert slug to proper name
  return name
    .split('-')
    .map(word => {
      // Handle special cases
      if (word.toLowerCase() === 'ip') return 'IP';
      if (word.toLowerCase() === 'sec') return 'Secondary';
      if (word.toLowerCase() === 'sch') return 'School';
      if (word.toLowerCase() === 'pri') return 'Primary';
      if (word.toLowerCase() === 'jc') return 'Junior College';
      if (word.toLowerCase() === 'inst') return 'Institution';
      if (word.toLowerCase() === 'st') return 'St';
      if (word.toLowerCase() === 'convent') return 'Convent';

      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch all secondary schools from the secondary_with_affiliations table
    const { data: schools, error } = await supabase
      .from('secondary_with_affiliations')
      .select('code, name')
      .order('name');

    if (error) {
      console.error('Error fetching schools:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schools' },
        { status: 500 }
      );
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json(
        { error: 'No schools found' },
        { status: 404 }
      );
    }

    // Transform data to include both code and formatted name
    const schoolsList = schools
      .filter(school => school.name) // Remove schools with null names
      .map(school => ({
        code: school.code,
        name: formatSchoolName(school.name),
        id: school.code // for compatibility
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort by formatted name

    return NextResponse.json(schoolsList);

  } catch (error) {
    console.error('Error in schools API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}