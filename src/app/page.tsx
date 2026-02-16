"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TripInput, Itinerary, AgentStep, SavedTrip } from "@/lib/types";
import TripForm from "@/components/TripForm";
import AgentThinking from "@/components/AgentThinking";
import ItineraryView from "@/components/ItineraryView";
import DestinationBackground from "@/components/DestinationBackground";
import { Plane, History, X, ArrowLeft, Palette } from "lucide-react";

type ThemeMode = "vibrant" | "classic";

// Curated travel destination photos from Unsplash (free to use)
const BACKGROUND_PHOTOS = [
  // Santorini, Greece
  "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1920&q=80",
  // Bali rice terraces
  "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80",
  // Maldives overwater
  "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1920&q=80",
  // Tropical beach
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80",
  // Mountain lake reflection
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
  // Venice canal
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1920&q=80",
  // Tropical resort pool
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80",
  // Amalfi coast
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1920&q=80",
  // Swiss Alps
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80",
  // Japanese temple
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1920&q=80",
];

function getRandomPhoto(): string {
  return BACKGROUND_PHOTOS[Math.floor(Math.random() * BACKGROUND_PHOTOS.length)];
}

export default function Home() {
  const [isPlanning, setIsPlanning] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [tripInput, setTripInput] = useState<TripInput | null>(null);
  const [activeAdjustment, setActiveAdjustment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSavedTrips, setShowSavedTrips] = useState(false);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>("vibrant");
  const [bgPhoto, setBgPhoto] = useState<string>(BACKGROUND_PHOTOS[0]);
  const [scrolled, setScrolled] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load theme preference and pick a random background photo on mount
  useEffect(() => {
    setBgPhoto(getRandomPhoto());
    try {
      const stored = localStorage.getItem("travel-planner-theme");
      if (stored === "classic" || stored === "vibrant") {
        setThemeMode(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // Track scroll for header glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next = themeMode === "vibrant" ? "classic" : "vibrant";
    setThemeMode(next);
    try {
      localStorage.setItem("travel-planner-theme", next);
    } catch {
      // ignore
    }
  };

  const loadSavedTrips = useCallback(() => {
    try {
      const stored = localStorage.getItem("travel-planner-trips");
      if (stored) {
        setSavedTrips(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveTrip = useCallback(
    (input: TripInput, itin: Itinerary) => {
      const trip: SavedTrip = {
        id: Date.now().toString(),
        input,
        itinerary: itin,
        createdAt: new Date().toISOString(),
      };
      const updated = [trip, ...savedTrips].slice(0, 10);
      setSavedTrips(updated);
      try {
        localStorage.setItem("travel-planner-trips", JSON.stringify(updated));
      } catch {
        // ignore
      }
    },
    [savedTrips]
  );

  const planTrip = useCallback(
    async (input: TripInput) => {
      setIsPlanning(true);
      setAgentSteps([]);
      setItinerary(null);
      setError(null);
      setTripInput(input);

      abortRef.current = new AbortController();

      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to plan trip");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "step") {
                setAgentSteps((prev) => [...prev, data.step]);
              } else if (data.type === "itinerary") {
                const itin = data.itinerary as Itinerary;
                setItinerary(itin);
                saveTrip(input, itin);
              } else if (data.type === "done") {
                setIsPlanning(false);
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setAgentSteps((prev) => [
            ...prev,
            {
              id: "cancelled",
              type: "error",
              content: "Planning cancelled.",
              timestamp: Date.now(),
            },
          ]);
        } else {
          const message =
            err instanceof Error ? err.message : "Something went wrong";
          setError(message);
          setAgentSteps((prev) => [
            ...prev,
            {
              id: "error",
              type: "error",
              content: message,
              timestamp: Date.now(),
            },
          ]);
        }
      } finally {
        setIsPlanning(false);
      }
    },
    [saveTrip]
  );

  const handleReset = () => {
    abortRef.current?.abort();
    setIsPlanning(false);
    setAgentSteps([]);
    setItinerary(null);
    setTripInput(null);
    setError(null);
    setActiveAdjustment(null);
  };

  const handleLoadTrip = (trip: SavedTrip) => {
    setTripInput(trip.input);
    setItinerary(trip.itinerary);
    setAgentSteps([]);
    setShowSavedTrips(false);
    setActiveAdjustment(null);
  };

  const showForm = !itinerary && !isPlanning && agentSteps.length === 0;
  const isVibrant = themeMode === "vibrant";
  const hasBackground = (isVibrant && showForm) || (!showForm && !!tripInput);

  const headerContent = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {!showForm && (
          <button
            onClick={handleReset}
            className={`p-2 rounded-lg transition-colors ${
              hasBackground ? "text-white/80 hover:bg-white/10" : "text-muted hover:bg-surface-alt"
            }`}
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              hasBackground ? "bg-white/20" : "bg-primary/10"
            }`}
          >
            <Plane
              size={18}
              className={
                hasBackground ? "text-white" : "text-primary"
              }
            />
          </div>
          <h1
            className={`text-lg font-bold ${
              hasBackground ? "text-white" : "text-foreground"
            }`}
            style={hasBackground ? { textShadow: "0 1px 4px rgba(0,0,0,0.5)" } : undefined}
          >
            Travel Planner
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showForm && (
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-lg font-bold transition-colors ${
              isVibrant
                ? "text-white/80 hover:bg-white/10"
                : "text-muted hover:bg-surface-alt"
            }`}
            style={isVibrant ? { textShadow: "0 1px 4px rgba(0,0,0,0.5)" } : undefined}
            title={`Switch to ${isVibrant ? "classic" : "vibrant"} mode`}
          >
            <Palette size={16} />
            {isVibrant ? "Classic" : "Vibrant"}
          </button>
        )}
        <button
          onClick={() => {
            loadSavedTrips();
            setShowSavedTrips(!showSavedTrips);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-lg font-bold transition-colors ${
            hasBackground
              ? "text-white/80 hover:bg-white/10"
              : "text-muted hover:bg-surface-alt"
          }`}
          style={hasBackground ? { textShadow: "0 1px 4px rgba(0,0,0,0.5)" } : undefined}
        >
          <History size={16} />
          My Trips
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen">
      {/* Header — rendered outside vibrant wrapper for non-vibrant modes */}
      {!(isVibrant && showForm) && (
        !showForm && tripInput ? (
          /* Planning & results: transparent fixed header */
          <header
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            style={scrolled ? {
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            } : {
              backgroundColor: "transparent",
            }}
          >
            {headerContent}
          </header>
        ) : (
          /* Classic form: opaque white sticky header */
          <header className="sticky top-0 z-50 border-b backdrop-blur-sm bg-white/80 border-gray-100">
            {headerContent}
          </header>
        )
      )}

      {/* Saved trips sidebar */}
      {showSavedTrips && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowSavedTrips(false)}
          />
          <div className="w-80 bg-white shadow-2xl h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Saved Trips</h2>
              <button
                onClick={() => setShowSavedTrips(false)}
                className="p-1 rounded hover:bg-surface-alt"
              >
                <X size={16} />
              </button>
            </div>
            {savedTrips.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm">
                No saved trips yet. Plan your first trip!
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {savedTrips.map((trip) => (
                  <button
                    key={trip.id}
                    onClick={() => handleLoadTrip(trip)}
                    className="w-full text-left p-3 rounded-xl hover:bg-surface-alt transition-colors"
                  >
                    <p className="font-medium text-foreground text-sm">
                      {trip.itinerary.destination}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {trip.input.days} days ·{" "}
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ FORM VIEW ============ */}
      {showForm && (
        <>
          {isVibrant ? (
            /* ---- VIBRANT HERO — absolute bg covers header + content ---- */
            <div className="relative min-h-screen pb-10" style={{ background: "#1a1a2e" }}>
              {/* Background layer — img with inline blur, clipped by overflow-hidden */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bgPhoto}
                  alt=""
                  style={{
                    position: "absolute",
                    top: "-20px",
                    left: "-20px",
                    width: "calc(100% + 40px)",
                    height: "calc(100% + 40px)",
                    objectFit: "cover",
                    filter: "blur(5px)",
                  }}
                />
              </div>
              {/* Dark overlay */}
              <div className="absolute inset-0 z-0 bg-black/15" />

              {/* Fixed header — transparent at top, frosted glass on scroll */}
              <header
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
                style={scrolled ? {
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                } : {
                  backgroundColor: "transparent",
                }}
              >
                {headerContent}
              </header>

              <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-8">
                {/* Hero text */}
                <div className="text-center mb-8 pt-4" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
                  <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                    Your next adventure
                    <br />
                    <span
                      className="bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 bg-clip-text text-transparent"
                      style={{ textShadow: "none", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
                    >
                      starts here
                    </span>
                  </h2>
                  <p className="text-white text-lg max-w-lg mx-auto leading-relaxed font-medium">
                    Tell us your dream destination and our AI travel agent will
                    craft a perfect, personalized itinerary in seconds.
                  </p>

                  {/* Stats bar */}
                  <div className="flex items-center justify-center gap-16 mt-6">
                    {[
                      { label: "Destinations", value: "100+" },
                      { label: "Activities", value: "10K+" },
                      { label: "Happy Trips", value: "Free" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center px-2">
                        <p className="text-xl font-bold text-white">{stat.value}</p>
                        <p className="text-sm font-semibold text-white">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Card - glass effect */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-white/30 p-6 sm:p-8">
                  <TripForm onSubmit={planTrip} isLoading={isPlanning} />
                </div>

                {/* Trust badges */}
                <div
                  className="flex items-center justify-center gap-4 mt-6 text-white text-xs font-semibold"
                  style={{ textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}
                >
                  <span>Powered by Claude AI</span>
                  <span>\u00B7</span>
                  <span>Weather-aware planning</span>
                  <span>\u00B7</span>
                  <span>Budget optimized</span>
                </div>
              </div>
            </div>
          ) : (
            /* ---- CLASSIC HERO ---- */
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
              <div className="text-center mb-8 pt-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Plane size={16} />
                  AI-Powered Travel Planning
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-3 leading-tight">
                  Plan your perfect trip
                </h2>
                <p className="text-muted text-lg max-w-md mx-auto">
                  Tell us where you want to go and our AI agent will create a
                  detailed, personalized itinerary.
                </p>
              </div>

              <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
                <TripForm onSubmit={planTrip} isLoading={isPlanning} />
              </div>
            </div>
          )}
        </>
      )}

      {/* ============ PLANNING VIEW ============ */}
      {(isPlanning || (agentSteps.length > 0 && !itinerary)) && tripInput && (
        <DestinationBackground destination={tripInput.destination}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-20 pb-6 space-y-4">
            <div className="text-center mb-4">
              <h2
                className="text-2xl font-bold text-white"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
              >
                Getting you trip-ready for {tripInput.destination}...
              </h2>
              <p
                className="text-white/80 mt-1"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
              >
                Exploring every corner to craft your perfect adventure
              </p>
            </div>
            <AgentThinking steps={agentSteps} isActive={isPlanning} />

            {isPlanning && (
              <button
                onClick={() => abortRef.current?.abort()}
                className="mx-auto block px-4 py-2 rounded-lg text-sm text-white/70
                           hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            )}

            {error && !isPlanning && (
              <div className="bg-red-50 rounded-2xl border border-red-100 p-5 text-center">
                <p className="text-danger font-medium">{error}</p>
                <button
                  onClick={handleReset}
                  className="mt-3 px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </DestinationBackground>
      )}

      {/* ============ ITINERARY VIEW ============ */}
      {itinerary && tripInput && (
        <DestinationBackground destination={tripInput.destination}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
            <ItineraryView
              itinerary={itinerary}
              input={tripInput}
              activeAdjustment={activeAdjustment}
              onAdjust={(adjustment, label) => {
                setActiveAdjustment(label);
                planTrip({
                  ...tripInput,
                  hotelLocation:
                    (tripInput.hotelLocation || "") +
                    ` [ADJUSTMENT: ${adjustment}]`,
                });
              }}
            />
          </div>
        </DestinationBackground>
      )}
    </main>
  );
}
