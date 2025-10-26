// src/app/api/geocode/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode');
  if (!pincode) {
    return NextResponse.json({ error: 'Missing pincode' }, { status: 400 });
  }

  // Validate Singapore postal code format (6 digits)
  if (!/^\d{6}$/.test(pincode)) {
    console.error('[Geocode] Invalid postal code format:', pincode);
    return NextResponse.json({ error: 'Invalid Singapore postal code format (must be 6 digits)' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY!;

  // Append "Singapore" to postal code for better geocoding accuracy
  const addressQuery = `${pincode}, Singapore`;

  console.log('[Geocode] Geocoding postal code:', addressQuery);

  const geoRes = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${apiKey}`
  ).then(r => r.json());

  console.log('[Geocode] Google Maps API response:', {
    status: geoRes.status,
    resultsCount: geoRes.results?.length || 0,
    errorMessage: geoRes.error_message
  });

  if (geoRes.status !== 'OK' || !geoRes.results.length) {
    console.error('[Geocode] Geocoding failed:', {
      status: geoRes.status,
      errorMessage: geoRes.error_message,
      postalCode: pincode
    });
    return NextResponse.json({
      error: `Geocoding failed: ${geoRes.error_message || geoRes.status || 'Not found'}`
    }, { status: 404 });
  }

  const { lat, lng } = geoRes.results[0].geometry.location;
  console.log('[Geocode] Success:', { lat, lng, postalCode: pincode });

  return NextResponse.json({ lat, lng });
}
