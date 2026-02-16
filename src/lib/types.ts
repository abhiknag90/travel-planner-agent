export const INTERESTS = [
  { id: "food", label: "Food & Dining", icon: "🍜" },
  { id: "temples", label: "Temples & Shrines", icon: "⛩️" },
  { id: "museums", label: "Museums & Art", icon: "🏛️" },
  { id: "nightlife", label: "Nightlife", icon: "🌙" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "nature", label: "Nature & Parks", icon: "🌿" },
  { id: "history", label: "History & Culture", icon: "📜" },
  { id: "adventure", label: "Adventure", icon: "🧗" },
  { id: "relaxation", label: "Relaxation & Spa", icon: "🧘" },
  { id: "photography", label: "Photography Spots", icon: "📸" },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

export interface TripInput {
  destination: string;
  days: number;
  startDate: string; // ISO date string e.g. "2026-02-15"
  travelers: number;
  budgetPerDay: number;
  currency: string;
  interests: InterestId[];
  hotelLocation?: string;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  time: string;
  duration: string;
  category: InterestId | "transport" | "meal";
  estimatedCost: number;
  rating?: number;
  address?: string;
  coordinates?: { lat: number; lng: number };
  photoUrl?: string;
  isIndoorAlternative?: boolean;
  tips?: string;
}

export interface DayPlan {
  dayNumber: number;
  date?: string;
  theme: string;
  weather?: {
    condition: string;
    tempHigh: number;
    tempLow: number;
    rainChance: number;
    icon: string;
  };
  activities: Activity[];
  totalCost: number;
  transportCost: number;
  foodCost: number;
  activityCost: number;
}

export interface Itinerary {
  destination: string;
  days: DayPlan[];
  totalBudget: number;
  totalEstimatedCost: number;
  currency: string;
  tips: string[];
  centerCoordinates: { lat: number; lng: number };
}

export interface AgentStep {
  id: string;
  type: "thinking" | "tool_use" | "tool_result" | "text" | "error" | "complete";
  content: string;
  toolName?: string;
  timestamp: number;
}

export interface SavedTrip {
  id: string;
  input: TripInput;
  itinerary: Itinerary;
  createdAt: string;
}
