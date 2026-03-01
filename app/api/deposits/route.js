import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data, error } = await supabase
    .from('deposit_report')
    .select('*')
    .order('requested_date', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await req.json()
  
  const { data, error } = await supabase
    .from('deposit_report')
    .insert(body)
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}