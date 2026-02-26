import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ 
    success: true, 
    message: 'API sync berfungsi!',
    timestamp: new Date().toISOString()
  });
}