// app/api/options/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sports: ['Badminton','Basketball','Bowling','Canoeing','Cricket','Floorball','Football','Golf','Hockey','Swimming','Netball','SepakTakraw','Softball','Table Tennis','Tennis','Volleyball','Water Polo','Rugby','Squash'],
    ccas: ['Astronomy','Chemistry Olympiad','Math Olympiad','Robotics','National STEM'],
    culture: ['Service/Care','Integrity/Moral Courage','Excellence','Compassion/Empathy','Leadership','Faith-based Character','People-centred Respect','Passion & Lifelong Learning','Responsibility/Accountability','Courage / Tenacity','Diversity & Inclusiveness','Innovation / Pioneering','Accountability / Stewardship','Holistic Development','Scholarship & Leadership Excellence'],
  });
}
