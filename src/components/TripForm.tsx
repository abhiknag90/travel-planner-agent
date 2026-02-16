"use client";

import { useState } from "react";
import { INTERESTS, InterestId, TripInput } from "@/lib/types";
import DestinationInput from "./DestinationInput";
import {
  MapPin,
  Calendar,
  DollarSign,
  Sparkles,
  Loader2,
  Users,
} from "lucide-react";

interface TripFormProps {
  onSubmit: (input: TripInput) => void;
  isLoading: boolean;
}

export default function TripForm({ onSubmit, isLoading }: TripFormProps) {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [travelers, setTravelers] = useState(1);
  const [budgetPerDay, setBudgetPerDay] = useState(100);
  const [currency, setCurrency] = useState("USD");
  const [interests, setInterests] = useState<InterestId[]>([
    "food",
    "temples",
  ]);
  const [hotelLocation, setHotelLocation] = useState("");

  const toggleInterest = (id: InterestId) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || interests.length === 0) return;
    onSubmit({
      destination: destination.trim(),
      days,
      startDate,
      travelers,
      budgetPerDay,
      currency,
      interests,
      hotelLocation: hotelLocation.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Destination */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-secondary mb-2">
          Where do you want to go?
        </label>
        <DestinationInput
          value={destination}
          onChange={setDestination}
          disabled={isLoading}
        />
      </div>

      {/* Date + Days row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-secondary mb-2">
            <Calendar size={16} />
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-foreground
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-secondary mb-2">
            <Calendar size={16} />
            Number of Days
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  days === d
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "bg-white border border-gray-200 text-foreground hover:border-primary"
                }`}
                disabled={isLoading}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Travelers + Budget row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-secondary mb-2">
            <Users size={16} />
            Number of Travelers
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTravelers((t) => Math.max(1, t - 1))}
              className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-foreground font-semibold
                         hover:border-primary transition-colors disabled:opacity-40"
              disabled={isLoading || travelers <= 1}
            >
              -
            </button>
            <span className="w-12 text-center text-lg font-semibold text-foreground">
              {travelers}
            </span>
            <button
              type="button"
              onClick={() => setTravelers((t) => Math.min(20, t + 1))}
              className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-foreground font-semibold
                         hover:border-primary transition-colors disabled:opacity-40"
              disabled={isLoading || travelers >= 20}
            >
              +
            </button>
            <span className="text-sm text-muted ml-1">
              {travelers === 1 ? "person" : "people"}
            </span>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-secondary mb-2">
            <DollarSign size={16} />
            Budget per Day
            <span className="text-xs font-normal text-muted">(per person)</span>
          </label>
          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={isLoading}
            >
              <option value="USD">USD $</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
              <option value="THB">THB</option>
            </select>
            <input
              type="number"
              value={budgetPerDay}
              onChange={(e) => setBudgetPerDay(Number(e.target.value))}
              min={10}
              max={10000}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Hotel Location (optional) */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-secondary mb-2">
          <MapPin size={16} />
          Hotel Location
          <span className="text-xs font-normal text-muted">(optional)</span>
        </label>
        <input
          type="text"
          value={hotelLocation}
          onChange={(e) => setHotelLocation(e.target.value)}
          placeholder="e.g., Shinjuku, Tokyo or near Eiffel Tower"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-foreground
                     placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                     transition-all"
          disabled={isLoading}
        />
      </div>

      {/* Interests */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-secondary mb-3">
          <Sparkles size={16} />
          What are you interested in?
        </label>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggleInterest(interest.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                interests.includes(interest.id)
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white border-gray-200 text-foreground hover:border-primary/50 hover:bg-primary/5"
              }`}
              disabled={isLoading}
            >
              <span className="mr-1.5">{interest.icon}</span>
              {interest.label}
            </button>
          ))}
        </div>
        {interests.length === 0 && (
          <p className="text-xs text-danger mt-2">
            Select at least one interest
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={
          isLoading || !destination.trim() || interests.length === 0
        }
        className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-lg
                   hover:bg-primary-dark transition-all shadow-lg shadow-primary/30
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                   flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            Planning your trip...
          </>
        ) : (
          <>
            <Sparkles size={22} />
            Plan My Trip
          </>
        )}
      </button>
    </form>
  );
}
