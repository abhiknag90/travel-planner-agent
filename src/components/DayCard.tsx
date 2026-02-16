"use client";

import { DayPlan, Activity } from "@/lib/types";
import {
  Clock,
  DollarSign,
  Star,
  MapPin,
  ChevronDown,
  ChevronUp,
  Utensils,
  Bus,
} from "lucide-react";
import { useState } from "react";

interface DayCardProps {
  day: DayPlan;
  currency: string;
  budgetPerDay: number;
  onActivityClick?: (activity: Activity) => void;
}

const categoryColors: Record<string, string> = {
  food: "bg-orange-100 text-orange-700 border-orange-200",
  temples: "bg-red-100 text-red-700 border-red-200",
  museums: "bg-purple-100 text-purple-700 border-purple-200",
  nightlife: "bg-indigo-100 text-indigo-700 border-indigo-200",
  shopping: "bg-pink-100 text-pink-700 border-pink-200",
  nature: "bg-green-100 text-green-700 border-green-200",
  history: "bg-amber-100 text-amber-700 border-amber-200",
  adventure: "bg-cyan-100 text-cyan-700 border-cyan-200",
  relaxation: "bg-teal-100 text-teal-700 border-teal-200",
  photography: "bg-violet-100 text-violet-700 border-violet-200",
  transport: "bg-gray-100 text-gray-600 border-gray-200",
  meal: "bg-orange-100 text-orange-700 border-orange-200",
};

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

export default function DayCard({
  day,
  currency,
  budgetPerDay,
  onActivityClick,
}: DayCardProps) {
  const [expanded, setExpanded] = useState(true);
  const isOverBudget = day.totalCost > budgetPerDay;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-alt/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            {day.dayNumber}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">
              Day {day.dayNumber}: {day.theme}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {day.date && <span className="mr-2">{day.date}</span>}
              {day.activities.length} activities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Weather badge */}
          {day.weather && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-alt text-sm">
              <span>{day.weather.icon}</span>
              <span className="text-foreground font-medium">
                {day.weather.tempHigh}°
              </span>
              {day.weather.rainChance > 30 && (
                <span className="text-blue-500 text-xs">
                  {day.weather.rainChance}% rain
                </span>
              )}
            </div>
          )}

          {/* Cost badge */}
          <div
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              isOverBudget
                ? "bg-red-50 text-danger"
                : "bg-emerald-50 text-success"
            }`}
          >
            {formatCurrency(day.totalCost, currency)}
          </div>

          {expanded ? (
            <ChevronUp size={18} className="text-muted" />
          ) : (
            <ChevronDown size={18} className="text-muted" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5">
          {/* Weather detail bar */}
          {day.weather && (
            <div className="flex items-center gap-4 px-4 py-2.5 mb-4 rounded-xl bg-surface-alt text-sm">
              <span className="text-lg">{day.weather.icon}</span>
              <span className="text-foreground">
                {day.weather.condition}
              </span>
              <span className="text-muted">
                {day.weather.tempLow}° - {day.weather.tempHigh}°C
              </span>
              {day.weather.rainChance > 0 && (
                <span className="text-blue-500">
                  {day.weather.rainChance}% rain
                </span>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-1">
            {day.activities.map((activity, i) => (
              <div
                key={activity.id || i}
                className="flex gap-3 group"
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  {i < day.activities.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                  )}
                </div>

                {/* Activity card */}
                <div
                  className="flex-1 mb-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30
                             hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => onActivityClick?.(activity)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted">
                          {activity.time}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            categoryColors[activity.category] ||
                            categoryColors.transport
                          }`}
                        >
                          {activity.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-sm">
                        {activity.name}
                      </h4>
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>

                    {activity.estimatedCost > 0 && (
                      <span className="text-sm font-semibold text-foreground flex-shrink-0">
                        {formatCurrency(activity.estimatedCost, currency)}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {activity.duration}
                    </span>
                    {activity.rating && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        {activity.rating}
                      </span>
                    )}
                    {activity.address && (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin size={12} />
                        {activity.address}
                      </span>
                    )}
                  </div>

                  {/* Tips */}
                  {activity.tips && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 text-xs text-amber-700">
                      💡 {activity.tips}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                <Utensils size={12} /> Food
              </div>
              <p className="text-sm font-semibold">
                {formatCurrency(day.foodCost, currency)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                <Star size={12} /> Activities
              </div>
              <p className="text-sm font-semibold">
                {formatCurrency(day.activityCost, currency)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted mb-1">
                <Bus size={12} /> Transport
              </div>
              <p className="text-sm font-semibold">
                {formatCurrency(day.transportCost, currency)}
              </p>
            </div>
          </div>

          {/* Budget warning */}
          {isOverBudget && (
            <div className="mt-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-sm text-danger flex items-center gap-2">
              <DollarSign size={16} />
              <span>
                This day is{" "}
                <strong>
                  {formatCurrency(day.totalCost - budgetPerDay, currency)}
                </strong>{" "}
                over budget. Consider swapping some activities.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
