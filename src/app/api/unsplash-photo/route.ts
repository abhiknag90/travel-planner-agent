import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");
  if (!city) {
    return NextResponse.json({ error: "city parameter required" }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey === "your_unsplash_access_key_here") {
    return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    query: `${city} city landmark`,
    per_page: "1",
    orientation: "landscape",
  });

  const res = await fetch(
    `https://api.unsplash.com/search/photos?${params}`,
    {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 86400 }, // cache for 24 hours
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Unsplash API error" }, { status: 502 });
  }

  const data = await res.json();
  const photo = data.results?.[0];

  if (!photo) {
    return NextResponse.json({ url: null });
  }

  return NextResponse.json({ url: photo.urls.regular });
}
