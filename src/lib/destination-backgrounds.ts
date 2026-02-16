import { DESTINATIONS } from "./destinations";

// Hand-picked Unsplash photos for popular destinations
const CURATED_PHOTOS: Record<string, string> = {
  // Asia
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=80",
  kyoto: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1920&q=80",
  osaka: "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1920&q=80",
  bangkok: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1920&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1920&q=80",
  seoul: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1920&q=80",
  "hong kong": "https://images.unsplash.com/photo-1536599018102-9f803c979b15?auto=format&fit=crop&w=1920&q=80",
  shanghai: "https://images.unsplash.com/photo-1537531383496-f4749b66a39e?auto=format&fit=crop&w=1920&q=80",
  taipei: "https://images.unsplash.com/photo-1470004914212-05527e49370b?auto=format&fit=crop&w=1920&q=80",
  mumbai: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1920&q=80",
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1920&q=80",
  // Europe
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1920&q=80",
  florence: "https://images.unsplash.com/photo-1543429776-2782f8f3cde5?auto=format&fit=crop&w=1920&q=80",
  venice: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1920&q=80",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1920&q=80",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1920&q=80",
  berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1920&q=80",
  prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=1920&q=80",
  istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1920&q=80",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1920&q=80",
  lisbon: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?auto=format&fit=crop&w=1920&q=80",
  // Americas
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1920&q=80",
  "san francisco": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1920&q=80",
  "los angeles": "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?auto=format&fit=crop&w=1920&q=80",
  miami: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&w=1920&q=80",
  "rio de janeiro": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1920&q=80",
  "mexico city": "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&w=1920&q=80",
  // Middle East & Africa
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=80",
  marrakech: "https://images.unsplash.com/photo-1597211833712-5e41faa202ea?auto=format&fit=crop&w=1920&q=80",
  "cape town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1920&q=80",
  cairo: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1920&q=80",
  // Oceania
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1920&q=80",
  melbourne: "https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=1920&q=80",
};

// Region-based gradient overlays for color harmony
const REGION_GRADIENTS: Record<string, string> = {
  Asia: "from-rose-900/40 via-amber-900/20 to-orange-900/30",
  Europe: "from-blue-900/40 via-indigo-900/20 to-violet-900/30",
  Americas: "from-emerald-900/40 via-teal-900/20 to-cyan-900/30",
  "Middle East": "from-amber-900/40 via-orange-900/20 to-yellow-900/30",
  Africa: "from-orange-900/40 via-red-900/20 to-amber-900/30",
  Oceania: "from-sky-900/40 via-cyan-900/20 to-blue-900/30",
};

const DEFAULT_GRADIENT = "from-slate-900/40 via-gray-900/20 to-zinc-900/30";

/** Extract city name from "City, Country" format */
export function extractCityName(destination: string): string {
  return destination.split(",")[0].trim();
}

/** Look up region from destinations list */
export function getRegionForDestination(destination: string): string | null {
  const city = extractCityName(destination).toLowerCase();
  const match = DESTINATIONS.find((d) => d.city.toLowerCase() === city);
  return match?.region ?? null;
}

/** Get background photo URL and gradient for a destination */
export function getDestinationBackground(destination: string): {
  photoUrl: string | null;
  gradient: string;
} {
  const city = extractCityName(destination).toLowerCase();

  // 1. Curated photo lookup (null if not found — fetched dynamically via API)
  const photoUrl = CURATED_PHOTOS[city] || null;

  // 2. Region gradient (always applied)
  const region = getRegionForDestination(destination);
  const gradient = (region && REGION_GRADIENTS[region]) || DEFAULT_GRADIENT;

  return { photoUrl, gradient };
}
