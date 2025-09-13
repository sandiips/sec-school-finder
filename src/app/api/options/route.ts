// app/api/options/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sports: ['Badminton','Basketball','Football','Hockey','Swimming','Netball','SepakTakraw','Softball','Table Tennis','Tennis','Volleyball','Water Polo','Rugby','Squash'],
    ccas: ['Robotics','Science Club','Drama','Choir','Art Club','Debate','Media Club','Computer Club'],
    culture: ['Service/Care','Integrity/Moral Courage','Excellence','Compassion/Empathy','Leadership','Faith-based Character','People-centred Respect','Passion & Lifelong Learning','Responsibility/Accountability','Courage / Tenacity','Diversity & Inclusiveness','Innovation / Pioneering','Accountability / Stewardship','Holistic Development','Scholarship & Leadership Excellence'],
  });
}
