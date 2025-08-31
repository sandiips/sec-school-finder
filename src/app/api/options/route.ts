// app/api/options/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sports: ['Basketball','Football','Swimming','Tennis','Badminton','Volleyball','Track and Field','Table Tennis','Cross Country'],
    ccas: ['Robotics','Science Club','Drama','Choir','Art Club','Debate','Media Club','Computer Club'],
    culture: ['Discipline','Academic Rigor','Creativity','Service','Leadership','Sportsmanship','Inclusivity','Innovation'],
  });
}
