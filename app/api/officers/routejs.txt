import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get('department');
  
  try {
    let query = supabase.from('officers').select('*');
    
    if (department) {
      query = query.eq('department', department);
    }
    
    const { data, error } = await query.order('full_name');
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, officers: data });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}