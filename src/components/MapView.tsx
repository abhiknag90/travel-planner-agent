"use client";

import { useEffect, useState } from "react";
import { Itinerary, Activity } from "@/lib/types";

interface MapViewProps {
  itinerary: Itinerary;
  selectedActivity?: Activity | null;
  onActivitySelect?: (activity: Activity) => void;
}

// Dynamically import Leaflet to avoid SSR issues
export default function MapView({
  itinerary,
  selectedActivity,
  onActivitySelect,
}: MapViewProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<MapViewProps> | null>(null);

  useEffect(() => {
    // Dynamic import of the actual map implementation
    import("./MapViewClient").then((mod) => {
      setMapComponent(() => mod.default);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-full rounded-2xl bg-surface-alt flex items-center justify-center">
        <div className="text-center text-muted">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapComponent
      itinerary={itinerary}
      selectedActivity={selectedActivity}
      onActivitySelect={onActivitySelect}
    />
  );
}
