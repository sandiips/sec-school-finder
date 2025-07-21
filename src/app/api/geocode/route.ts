// src/app/api/geocode/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode');
  if (!pincode) {
    return NextResponse.json({ error: 'Missing pincode' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  const geoRes = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pincode)}&key=${apiKey}`
  ).then(r => r.json());

  if (geoRes.status !== 'OK' || !geoRes.results.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { lat, lng } = geoRes.results[0].geometry.location;
  return NextResponse.json({ lat, lng });
}
