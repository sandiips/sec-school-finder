// app/api/options/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    sports: ['Badminton','Basketball','Bowling','Canoeing','Cricket','Cross Country','Floorball','Football','Golf','Gymnastics','Hockey','Netball','Rugby','Sailing','SepakTakraw','Shooting','Softball','Squash','Swimming','Table Tennis','Taekwondo','Tennis','Track and Field','Volleyball','Water Polo','Wushu'],
    ccas: ['Astronomy','Chemistry Olympiad','Math Olympiad','Robotics','National STEM'],
    culture: ['Service/Care','Integrity/Moral Courage','Excellence','Compassion/Empathy','Leadership','Faith-based Character','People-centred Respect','Passion & Lifelong Learning','Responsibility/Accountability','Courage / Tenacity','Diversity & Inclusiveness','Innovation / Pioneering','Accountability / Stewardship','Holistic Development','Scholarship & Leadership Excellence'],
  });
}
