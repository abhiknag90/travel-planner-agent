"use client";

import { useState, useRef, useEffect } from "react";
import { searchDestinations, Destination } from "@/lib/destinations";
import { MapPin } from "lucide-react";

interface DestinationInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function DestinationInput({
  value,
  onChange,
  disabled,
}: DestinationInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.length >= 1) {
      const results = searchDestinations(value);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
    setHighlightIndex(-1);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectDestination = (dest: Destination) => {
    onChange(`${dest.city}, ${dest.country}`);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      selectDestination(suggestions[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search destinations... (e.g. Tokyo, Paris, Bali)"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-foreground
                     placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                     transition-all text-lg"
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          {suggestions.map((dest, i) => (
            <button
              key={`${dest.city}-${dest.country}`}
              onClick={() => selectDestination(dest)}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                i === highlightIndex
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-surface-alt text-foreground"
              }`}
            >
              <span className="text-xl flex-shrink-0">{dest.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold">{dest.city}</span>
                <span className="text-muted">, {dest.country}</span>
              </div>
              <span className="text-xs text-muted bg-surface-alt px-2 py-0.5 rounded-full flex-shrink-0">
                {dest.region}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
