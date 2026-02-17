import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Data schedule 2026 (January - February sample)
    const schedules = [
      // JANUARY 2026 (21-31)
      { monthRundown: "January", dateRundown: "2026-01-21", officers: { sulaeman: "P", goldie: "M", zakiy: "OFF", hakim: "P", vini: "M", ronaldo: "CUTI" } },
      { monthRundown: "January", dateRundown: "2026-01-22", officers: { sulaeman: "M", goldie: "P", zakiy: "P", hakim: "OFF", vini: "M", ronaldo: "SAKIT" } },
      { monthRundown: "January", dateRundown: "2026-01-23", officers: { sulaeman: "OFF", goldie: "M", zakiy: "M", hakim: "P", vini: "P", ronaldo: "P" } },
      { monthRundown: "January", dateRundown: "2026-01-24", officers: { sulaeman: "P", goldie: "OFF", zakiy: "P", hakim: "M", vini: "OFF", ronaldo: "M" } },
      { monthRundown: "January", dateRundown: "2026-01-25", officers: { sulaeman: "M", goldie: "P", zakiy: "OFF", hakim: "P", vini: "M", ronaldo: "P" } },
      { monthRundown: "January", dateRundown: "2026-01-26", officers: { sulaeman: "P", goldie: "M", zakiy: "P", hakim: "OFF", vini: "P", ronaldo: "OFF" } },
      { monthRundown: "January", dateRundown: "2026-01-27", officers: { sulaeman: "M", goldie: "P", zakiy: "M", hakim: "P", vini: "OFF", ronaldo: "M" } },
      { monthRundown: "January", dateRundown: "2026-01-28", officers: { sulaeman: "P", goldie: "OFF", zakiy: "P", hakim: "M", vini: "P", ronaldo: "P" } },
      { monthRundown: "January", dateRundown: "2026-01-29", officers: { sulaeman: "OFF", goldie: "P", zakiy: "M", hakim: "P", vini: "M", ronaldo: "OFF" } },
      { monthRundown: "January", dateRundown: "2026-01-30", officers: { sulaeman: "P", goldie: "M", zakiy: "P", hakim: "OFF", vini: "P", ronaldo: "M" } },
      { monthRundown: "January", dateRundown: "2026-01-31", officers: { sulaeman: "M", goldie: "P", zakiy: "OFF", hakim: "P", vini: "OFF", ronaldo: "P" } },
      
      // FEBRUARY 2026 (1-20)
      { monthRundown: "February", dateRundown: "2026-02-01", officers: { sulaeman: "P", goldie: "M", zakiy: "P", hakim: "M", vini: "P", ronaldo: "OFF" } },
      { monthRundown: "February", dateRundown: "2026-02-02", officers: { sulaeman: "M", goldie: "P", zakiy: "OFF", hakim: "P", vini: "M", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-03", officers: { sulaeman: "P", goldie: "OFF", zakiy: "M", hakim: "P", vini: "P", ronaldo: "M" } },
      { monthRundown: "February", dateRundown: "2026-02-04", officers: { sulaeman: "OFF", goldie: "P", zakiy: "P", hakim: "M", vini: "OFF", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-05", officers: { sulaeman: "P", goldie: "M", zakiy: "M", hakim: "P", vini: "P", ronaldo: "OFF" } },
      { monthRundown: "February", dateRundown: "2026-02-06", officers: { sulaeman: "M", goldie: "P", zakiy: "P", hakim: "OFF", vini: "M", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-07", officers: { sulaeman: "P", goldie: "OFF", zakiy: "P", hakim: "M", vini: "P", ronaldo: "M" } },
      { monthRundown: "February", dateRundown: "2026-02-08", officers: { sulaeman: "OFF", goldie: "P", zakiy: "M", hakim: "P", vini: "OFF", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-09", officers: { sulaeman: "P", goldie: "M", zakiy: "P", hakim: "M", vini: "P", ronaldo: "OFF" } },
      { monthRundown: "February", dateRundown: "2026-02-10", officers: { sulaeman: "M", goldie: "P", zakiy: "OFF", hakim: "P", vini: "M", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-11", officers: { sulaeman: "P", goldie: "OFF", zakiy: "P", hakim: "M", vini: "P", ronaldo: "M" } },
      { monthRundown: "February", dateRundown: "2026-02-12", officers: { sulaeman: "OFF", goldie: "P", zakiy: "M", hakim: "P", vini: "OFF", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-13", officers: { sulaeman: "P", goldie: "M", zakiy: "P", hakim: "M", vini: "P", ronaldo: "OFF" } },
      { monthRundown: "February", dateRundown: "2026-02-14", officers: { sulaeman: "M", goldie: "P", zakiy: "OFF", hakim: "P", vini: "M", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-15", officers: { sulaeman: "P", goldie: "OFF", zakiy: "P", hakim: "M", vini: "P", ronaldo: "M" } },
      { monthRundown: "February", dateRundown: "2026-02-16", officers: { sulaeman: "OFF", goldie: "P", zakiy: "M", hakim: "P", vini: "OFF", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-17", officers: { sulaeman: "P", goldie: "M", zakiy: "P", hakim: "M", vini: "P", ronaldo: "OFF" } },
      { monthRundown: "February", dateRundown: "2026-02-18", officers: { sulaeman: "M", goldie: "P", zakiy: "OFF", hakim: "P", vini: "M", ronaldo: "P" } },
      { monthRundown: "February", dateRundown: "2026-02-19", officers: { sulaeman: "P", goldie: "OFF", zakiy: "P", hakim: "M", vini: "P", ronaldo: "M" } },
      { monthRundown: "February", dateRundown: "2026-02-20", officers: { sulaeman: "OFF", goldie: "P", zakiy: "M", hakim: "P", vini: "OFF", ronaldo: "P" } }
    ];
    
    return NextResponse.json({ 
      success: true, 
      total: schedules.length,
      data: schedules 
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}