// src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// POST handler (for Home page form submission)
export async function POST(request: Request) {
  try {
    const { psle, primary, postal } = await request.json();
    const score = Number.parseInt(String(psle), 10);
    if (!Number.isFinite(score) || !primary || !postal) {
      return NextResponse.json(
        { error: "psle (int), primary (string), postal (string) are required" },
        { status: 400 }
      );
    }

    // Call internal geocode route
    const origin = new URL(request.url).origin;
    const geocodeURL = new URL("/api/geocode", origin);
    geocodeURL.searchParams.set("pincode", String(postal));
    const geoRes = await fetch(geocodeURL.toString(), { cache: "no-store" });
    if (!geoRes.ok) {
      return NextResponse.json(
        { error: `Geocode failed (${geoRes.status})` },
        { status: 502 }
      );
    }
    const g = await geoRes.json();
    const lat = Number.parseFloat(
      g?.lat ?? g?.latitude ?? g?.LATITUDE ?? g?.data?.lat ?? "NaN"
    );
    const lng = Number.parseFloat(
      g?.lng ?? g?.longitude ?? g?.LONGITUDE ?? g?.data?.lng ?? "NaN"
    );
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Invalid geocode response" },
        { status: 400 }
      );
    }

    // Call search_schools RPC
    const { data, error } = await supabase.rpc("search_schools", {
      user_score: score,
      user_primary: primary,
      user_lat: lat,
      user_lng: lng,
      limit_count: 10,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return array directly
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error in /api/search" },
      { status: 500 }
    );
  }
}

// GET handler (for Ranking page querystring fetch)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const score = Number.parseInt(searchParams.get("score") ?? "");
    const primary = searchParams.get("primary") ?? "";
    const lat = Number.parseFloat(searchParams.get("lat") ?? "");
    const lng = Number.parseFloat(searchParams.get("lng") ?? "");
    const maxDistanceKm = Number.parseFloat(searchParams.get("maxDistanceKm") ?? "5");
    const weightDist = Number.parseFloat(searchParams.get("weightDist") ?? "0.4");
    const weightSport = Number.parseFloat(searchParams.get("weightSport") ?? "0.2");
    const weightCca = Number.parseFloat(searchParams.get("weightCca") ?? "0.2");
    const limitCount = Number.parseInt(searchParams.get("limitCount") ?? "6");

    if (
      !Number.isFinite(score) ||
      !primary ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid query params" },
        { status: 400 }
      );
    }

    // Call rank_schools RPC (since you use ranking UI here)
    const { data, error } = await supabase.rpc("rank_schools", {
      user_score: score,
      user_primary: primary,
      user_lat: lat,
      user_lng: lng,
      max_distance_km: maxDistanceKm,
      weight_dist: weightDist,
      weight_sport: weightSport,
      weight_cca: weightCca,
      limit_count: limitCount,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return array directly
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error in /api/search GET" },
      { status: 500 }
    );
  }
}
