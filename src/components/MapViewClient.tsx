"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Itinerary, Activity } from "@/lib/types";

interface MapViewClientProps {
  itinerary: Itinerary;
  selectedActivity?: Activity | null;
  onActivitySelect?: (activity: Activity) => void;
}

const dayColors = [
  "#e94560", // red
  "#0f3460", // navy
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
];

export default function MapViewClient({
  itinerary,
  selectedActivity,
  onActivitySelect,
}: MapViewClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(
      [itinerary.centerCoordinates.lat, itinerary.centerCoordinates.lng],
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers for each day's activities
    const allCoords: [number, number][] = [];

    itinerary.days.forEach((day) => {
      const color = dayColors[(day.dayNumber - 1) % dayColors.length];
      const dayCoords: [number, number][] = [];

      day.activities.forEach((activity) => {
        if (!activity.coordinates) return;

        const { lat, lng } = activity.coordinates;
        allCoords.push([lat, lng]);
        dayCoords.push([lat, lng]);

        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            background: ${color};
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${day.dayNumber}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="min-width: 200px; font-family: system-ui, sans-serif;">
            <div style="font-size: 10px; color: ${color}; font-weight: 600; margin-bottom: 4px;">
              DAY ${day.dayNumber} · ${activity.time}
            </div>
            <div style="font-size: 14px; font-weight: 700; margin-bottom: 4px;">
              ${activity.name}
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">
              ${activity.description.substring(0, 100)}${activity.description.length > 100 ? "..." : ""}
            </div>
            <div style="display: flex; gap: 8px; font-size: 11px; color: #6b7280;">
              ${activity.rating ? `<span>⭐ ${activity.rating}</span>` : ""}
              ${activity.duration ? `<span>⏱ ${activity.duration}</span>` : ""}
              ${activity.estimatedCost > 0 ? `<span>💰 $${activity.estimatedCost}</span>` : "<span>Free</span>"}
            </div>
          </div>
        `);

        marker.on("click", () => {
          onActivitySelect?.(activity);
        });

        markersRef.current.push(marker);
      });

      // Draw path between day's activities
      if (dayCoords.length > 1) {
        L.polyline(dayCoords, {
          color,
          weight: 3,
          opacity: 0.6,
          dashArray: "8, 8",
        }).addTo(map);
      }
    });

    // Fit map to show all markers
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [itinerary, onActivitySelect]);

  // Pan to selected activity
  useEffect(() => {
    if (selectedActivity?.coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [selectedActivity.coordinates.lat, selectedActivity.coordinates.lng],
        15,
        { animate: true }
      );
    }
  }, [selectedActivity]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full rounded-2xl" />
      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg z-[1000]">
        <p className="text-xs font-semibold text-foreground mb-1.5">Legend</p>
        <div className="flex flex-wrap gap-2">
          {itinerary.days.map((day) => (
            <div key={day.dayNumber} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background:
                    dayColors[(day.dayNumber - 1) % dayColors.length],
                }}
              />
              <span className="text-xs text-muted">Day {day.dayNumber}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
