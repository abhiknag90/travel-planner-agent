"use client";

import { Itinerary, Activity, TripInput } from "@/lib/types";
import DayCard from "./DayCard";
import MapView from "./MapView";
import {
  DollarSign,
  Lightbulb,
  Download,
  ExternalLink,
  RefreshCw,
  Utensils,
  Footprints,
  Wallet,
} from "lucide-react";
import { useState } from "react";

interface ItineraryViewProps {
  itinerary: Itinerary;
  input: TripInput;
  onAdjust?: (adjustment: string, label: string) => void;
  activeAdjustment?: string | null;
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "\u20AC",
    GBP: "\u00A3",
    JPY: "\u00A5",
    THB: "\u0E3F",
  };
  return `${symbols[currency] || currency}${amount.toFixed(amount >= 100 ? 0 : 2)}`;
}

export default function ItineraryView({
  itinerary,
  input,
  onAdjust,
  activeAdjustment,
}: ItineraryViewProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );

  const totalBudget = input.budgetPerDay * input.days * input.travelers;
  const budgetRatio = itinerary.totalEstimatedCost / totalBudget;
  const budgetStatus =
    budgetRatio <= 0.9
      ? "under"
      : budgetRatio <= 1.1
        ? "on-track"
        : "over";

  const handleExportGoogleMaps = () => {
    // Build a Google Maps directions URL from all activity coordinates
    const coords = itinerary.days
      .flatMap((d) => d.activities)
      .filter((a) => a.coordinates)
      .map((a) => `${a.coordinates!.lat},${a.coordinates!.lng}`);

    if (coords.length === 0) return;
    const origin = coords[0];
    const dest = coords[coords.length - 1];
    const waypoints = coords.slice(1, -1).join("|");

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${waypoints}&travelmode=walking`;
    window.open(url, "_blank");
  };

  const handleDownloadPDF = () => {
    // Generate a printable view
    const printContent = itinerary.days
      .map(
        (day) =>
          `\n=== Day ${day.dayNumber}: ${day.theme} ===\n${day.weather ? `Weather: ${day.weather.icon} ${day.weather.condition}, ${day.weather.tempLow}-${day.weather.tempHigh}°C\n` : ""}${day.activities
            .map(
              (a) =>
                `  ${a.time} - ${a.name} (${a.duration}) - ${a.estimatedCost > 0 ? formatCurrency(a.estimatedCost, itinerary.currency) : "Free"}\n    ${a.description}`
            )
            .join("\n")}\n  Total: ${formatCurrency(day.totalCost, itinerary.currency)}`
      )
      .join("\n");

    const fullText = `TRAVEL ITINERARY: ${itinerary.destination}\n${"=".repeat(50)}\nTotal Budget: ${formatCurrency(totalBudget, itinerary.currency)}\nEstimated Cost: ${formatCurrency(itinerary.totalEstimatedCost, itinerary.currency)}\n${printContent}\n\n--- Tips ---\n${itinerary.tips.map((t) => `• ${t}`).join("\n")}`;

    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itinerary-${itinerary.destination.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickAdjustments = [
    {
      label: "More budget-friendly",
      icon: <Wallet size={14} />,
      action: "Make it more budget-friendly - swap expensive options for cheaper alternatives",
    },
    {
      label: "Add more food stops",
      icon: <Utensils size={14} />,
      action: "Add more highly-rated restaurant and food stops to the itinerary",
    },
    {
      label: "Less walking",
      icon: <Footprints size={14} />,
      action: "Reduce walking - suggest transport options and group closer activities together",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      {/* Left: Itinerary Details */}
      <div className="lg:col-span-3 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
        {/* Header summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {itinerary.destination}
              </h2>
              <p className="text-sm text-muted mt-1">
                {input.days}-day itinerary · {input.travelers}{" "}
                {input.travelers === 1 ? "traveler" : "travelers"} ·{" "}
                {input.interests.length} interests
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-alt text-sm
                           font-medium text-foreground hover:bg-gray-200 transition-colors"
              >
                <Download size={14} />
                Export
              </button>
              <button
                onClick={handleExportGoogleMaps}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-sm
                           font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink size={14} />
                Google Maps
              </button>
            </div>
          </div>

          {/* Budget meter */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">Estimated Cost</span>
                <span
                  className={`font-semibold ${
                    budgetStatus === "over"
                      ? "text-danger"
                      : budgetStatus === "on-track"
                        ? "text-warning"
                        : "text-success"
                  }`}
                >
                  {formatCurrency(itinerary.totalEstimatedCost, itinerary.currency)}{" "}
                  / {formatCurrency(totalBudget, itinerary.currency)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetStatus === "over"
                      ? "bg-danger"
                      : budgetStatus === "on-track"
                        ? "bg-warning"
                        : "bg-success"
                  }`}
                  style={{
                    width: `${Math.min(100, budgetRatio * 100)}%`,
                  }}
                />
              </div>
            </div>
            <DollarSign
              size={20}
              className={
                budgetStatus === "over"
                  ? "text-danger"
                  : budgetStatus === "on-track"
                    ? "text-warning"
                    : "text-success"
              }
            />
          </div>
        </div>

        {/* Quick adjustments */}
        {onAdjust && (
          <div className="flex flex-wrap gap-2">
            {quickAdjustments.map((adj) => {
              const isActive = activeAdjustment === adj.label;
              return (
                <button
                  key={adj.label}
                  onClick={() => onAdjust(adj.action, adj.label)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-white text-foreground border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {adj.icon}
                  {adj.label}
                  <RefreshCw size={12} className={isActive ? "text-white/70" : "text-muted"} />
                </button>
              );
            })}
          </div>
        )}

        {/* Day cards */}
        {itinerary.days.map((day) => (
          <DayCard
            key={day.dayNumber}
            day={day}
            currency={itinerary.currency}
            budgetPerDay={input.budgetPerDay}
            onActivityClick={setSelectedActivity}
          />
        ))}

        {/* Tips */}
        {itinerary.tips && itinerary.tips.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-amber-800 mb-3">
              <Lightbulb size={18} />
              Travel Tips
            </h3>
            <ul className="space-y-2">
              {itinerary.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-amber-700"
                >
                  <span className="text-amber-400 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right: Map */}
      <div className="lg:col-span-2 h-[400px] lg:h-[calc(100vh-200px)] lg:sticky lg:top-6">
        <MapView
          itinerary={itinerary}
          selectedActivity={selectedActivity}
          onActivitySelect={setSelectedActivity}
        />
      </div>
    </div>
  );
}
