import Anthropic from "@anthropic-ai/sdk";

export const agentTools: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the web for current information about travel destinations, attractions, restaurants, activities, costs, and travel tips. Use this to find top-rated places, hidden gems, current prices, and local recommendations.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "The search query. Be specific - include the destination name and what you're looking for.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "places_search",
    description:
      "Search for specific places to get detailed information including ratings, addresses, coordinates, opening hours, and price levels. Use this after web_search to get structured data about specific attractions or restaurants.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The place name and location to search for.",
        },
        type: {
          type: "string",
          enum: [
            "attraction",
            "restaurant",
            "hotel",
            "shopping",
            "nightlife",
            "temple",
            "museum",
            "park",
          ],
          description: "The type of place to search for.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "weather_fetch",
    description:
      "Get the weather forecast for a destination for specific dates. Returns daily forecasts with temperature, precipitation chance, and conditions. Use this to plan weather-appropriate activities.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "The city or location to get weather for.",
        },
        days: {
          type: "number",
          description: "Number of days to forecast (1-5).",
        },
        start_date: {
          type: "string",
          description: "The start date for the forecast in YYYY-MM-DD format.",
        },
      },
      required: ["location", "days"],
    },
  },
];

// Real API implementations

export async function executeWebSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || apiKey === "your_tavily_api_key_here") {
    throw new Error("TAVILY_API_KEY not configured in .env.local");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const results = (data.results || []).map(
    (r: { title?: string; content?: string }) => ({
      title: r.title || "",
      snippet: r.content || "",
    })
  );

  return JSON.stringify({ results, query });
}

export async function executePlacesSearch(
  query: string,
  type?: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === "your_google_places_api_key_here") {
    throw new Error("GOOGLE_PLACES_API_KEY not configured in .env.local");
  }

  const fieldMask = [
    "places.displayName",
    "places.rating",
    "places.formattedAddress",
    "places.location",
    "places.regularOpeningHours",
    "places.priceLevel",
    "places.types",
  ].join(",");

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 10,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Google Places API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  interface GooglePlace {
    displayName?: { text?: string };
    rating?: number;
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    regularOpeningHours?: { weekdayDescriptions?: string[] };
    priceLevel?: string;
    types?: string[];
  }

  const priceLevelMap: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };

  const places = ((data.places as GooglePlace[]) || []).map(
    (place: GooglePlace) => ({
      name: place.displayName?.text || "",
      rating: place.rating || 0,
      address: place.formattedAddress || "",
      coordinates: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      },
      priceLevel: place.priceLevel
        ? priceLevelMap[place.priceLevel] ?? 2
        : 2,
      openingHours: place.regularOpeningHours?.weekdayDescriptions
        ? place.regularOpeningHours.weekdayDescriptions.join("; ")
        : "Hours not available",
      type: type || inferPlaceType(place.types || []),
      estimatedVisitTime: "1-2 hours",
      entranceFee: 0,
    })
  );

  return JSON.stringify({ places, query, type });
}

function inferPlaceType(types: string[]): string {
  const mapping: Record<string, string> = {
    restaurant: "restaurant",
    food: "restaurant",
    cafe: "restaurant",
    bar: "nightlife",
    night_club: "nightlife",
    museum: "museum",
    art_gallery: "museum",
    park: "park",
    hindu_temple: "temple",
    church: "temple",
    mosque: "temple",
    synagogue: "temple",
    place_of_worship: "temple",
    shopping_mall: "shopping",
    store: "shopping",
    lodging: "hotel",
    tourist_attraction: "attraction",
    amusement_park: "attraction",
    zoo: "attraction",
  };
  for (const t of types) {
    if (mapping[t]) return mapping[t];
  }
  return "attraction";
}

const WMO_CODES: Record<number, { condition: string; icon: string }> = {
  0: { condition: "Clear sky", icon: "☀️" },
  1: { condition: "Mainly clear", icon: "☀️" },
  2: { condition: "Partly cloudy", icon: "⛅" },
  3: { condition: "Overcast", icon: "☁️" },
  45: { condition: "Foggy", icon: "🌫️" },
  48: { condition: "Rime fog", icon: "🌫️" },
  51: { condition: "Light drizzle", icon: "🌦️" },
  53: { condition: "Moderate drizzle", icon: "🌦️" },
  55: { condition: "Dense drizzle", icon: "🌧️" },
  56: { condition: "Freezing drizzle", icon: "🌧️" },
  57: { condition: "Heavy freezing drizzle", icon: "🌧️" },
  61: { condition: "Slight rain", icon: "🌦️" },
  63: { condition: "Moderate rain", icon: "🌧️" },
  65: { condition: "Heavy rain", icon: "🌧️" },
  66: { condition: "Freezing rain", icon: "🌧️" },
  67: { condition: "Heavy freezing rain", icon: "🌧️" },
  71: { condition: "Slight snow", icon: "🌨️" },
  73: { condition: "Moderate snow", icon: "🌨️" },
  75: { condition: "Heavy snow", icon: "❄️" },
  77: { condition: "Snow grains", icon: "❄️" },
  80: { condition: "Slight showers", icon: "🌦️" },
  81: { condition: "Moderate showers", icon: "🌧️" },
  82: { condition: "Violent showers", icon: "🌧️" },
  85: { condition: "Slight snow showers", icon: "🌨️" },
  86: { condition: "Heavy snow showers", icon: "❄️" },
  95: { condition: "Thunderstorm", icon: "⛈️" },
  96: { condition: "Thunderstorm with slight hail", icon: "⛈️" },
  99: { condition: "Thunderstorm with heavy hail", icon: "⛈️" },
};

function wmoToCondition(code: number): { condition: string; icon: string } {
  return WMO_CODES[code] || { condition: "Unknown", icon: "❓" };
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number; name: string }> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geocoding error: ${res.status}`);
  }
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`Location not found: ${location}`);
  }
  const r = data.results[0];
  return { lat: r.latitude, lng: r.longitude, name: r.name };
}

export async function executeWeatherFetch(
  location: string,
  days: number,
  startDate?: string
): Promise<string> {
  const geo = await geocodeLocation(location);
  const clampedDays = Math.min(days, 5);
  const start = startDate
    ? new Date(startDate + "T00:00:00")
    : new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + clampedDays - 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let forecast;

  if (diffDays <= 16) {
    // Near-term: use forecast API
    const params = new URLSearchParams({
      latitude: String(geo.lat),
      longitude: String(geo.lng),
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      start_date: formatDateISO(start),
      end_date: formatDateISO(end),
      timezone: "auto",
    });
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );
    if (!res.ok) {
      throw new Error(`Open-Meteo forecast error: ${res.status}`);
    }
    const data = await res.json();
    const daily = data.daily;
    forecast = Array.from({ length: daily.time.length }, (_, i) => {
      const wmo = wmoToCondition(daily.weather_code[i]);
      const d = new Date(daily.time[i] + "T00:00:00");
      return {
        day: i + 1,
        date: formatDateDisplay(d),
        condition: wmo.condition,
        tempHigh: Math.round(daily.temperature_2m_max[i]),
        tempLow: Math.round(daily.temperature_2m_min[i]),
        rainChance: daily.precipitation_probability_max[i] ?? 0,
        humidity: 0,
        icon: wmo.icon,
      };
    });
  } else {
    // Far-future: average historical data from past 5 years for the same dates
    const historicalYears = 5;
    const allYears: {
      weather_code: number[][];
      temp_max: number[][];
      temp_min: number[][];
      precip: number[][];
    } = { weather_code: [], temp_max: [], temp_min: [], precip: [] };

    const currentYear = today.getFullYear();
    const fetches: Promise<void>[] = [];
    for (let y = 1; y <= historicalYears; y++) {
      const yearOffset = currentYear - y;
      const hStart = new Date(start);
      hStart.setFullYear(yearOffset);
      const hEnd = new Date(end);
      hEnd.setFullYear(yearOffset);

      fetches.push(
        (async () => {
          const params = new URLSearchParams({
            latitude: String(geo.lat),
            longitude: String(geo.lng),
            daily:
              "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
            start_date: formatDateISO(hStart),
            end_date: formatDateISO(hEnd),
            timezone: "auto",
          });
          const res = await fetch(
            `https://archive-api.open-meteo.com/v1/archive?${params}`
          );
          if (!res.ok) return;
          const data = await res.json();
          const d = data.daily;
          if (!d) return;
          allYears.weather_code.push(d.weather_code);
          allYears.temp_max.push(d.temperature_2m_max);
          allYears.temp_min.push(d.temperature_2m_min);
          allYears.precip.push(d.precipitation_sum);
        })()
      );
    }
    await Promise.all(fetches);

    if (allYears.temp_max.length === 0) {
      throw new Error("Could not retrieve historical weather data");
    }

    forecast = Array.from({ length: clampedDays }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);

      // Average across years
      let sumMax = 0,
        sumMin = 0,
        sumPrecip = 0,
        count = 0;
      const codes: number[] = [];
      for (let y = 0; y < allYears.temp_max.length; y++) {
        if (
          allYears.temp_max[y][i] != null &&
          allYears.temp_min[y][i] != null
        ) {
          sumMax += allYears.temp_max[y][i];
          sumMin += allYears.temp_min[y][i];
          sumPrecip += allYears.precip[y]?.[i] ?? 0;
          codes.push(allYears.weather_code[y][i]);
          count++;
        }
      }

      // Pick the most common weather code
      const codeCounts: Record<number, number> = {};
      for (const c of codes) {
        codeCounts[c] = (codeCounts[c] || 0) + 1;
      }
      const dominantCode = Object.entries(codeCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];
      const wmo = wmoToCondition(
        dominantCode ? Number(dominantCode[0]) : 0
      );

      // Estimate rain chance from historical precipitation frequency
      const rainyDays = codes.filter((c) => c >= 51).length;
      const rainChance =
        count > 0 ? Math.round((rainyDays / count) * 100) : 0;

      return {
        day: i + 1,
        date: formatDateDisplay(d),
        condition: wmo.condition,
        tempHigh: count > 0 ? Math.round(sumMax / count) : 0,
        tempLow: count > 0 ? Math.round(sumMin / count) : 0,
        rainChance,
        humidity: 0,
        icon: wmo.icon,
      };
    });
  }

  return JSON.stringify({ location: geo.name, forecast });
}
