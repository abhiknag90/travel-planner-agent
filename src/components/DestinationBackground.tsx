"use client";

import { useMemo, useState, useEffect } from "react";
import { getDestinationBackground } from "@/lib/destination-backgrounds";

interface DestinationBackgroundProps {
  destination: string;
  children: React.ReactNode;
}

export default function DestinationBackground({
  destination,
  children,
}: DestinationBackgroundProps) {
  const { photoUrl: curatedUrl, gradient } = useMemo(
    () => getDestinationBackground(destination),
    [destination]
  );

  const [photoUrl, setPhotoUrl] = useState(curatedUrl);

  useEffect(() => {
    if (curatedUrl) {
      setPhotoUrl(curatedUrl);
      return;
    }
    // No curated photo — fetch from Unsplash API
    const city = destination.split(",")[0].trim();
    fetch(`/api/unsplash-photo?city=${encodeURIComponent(city)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.url) setPhotoUrl(data.url);
      })
      .catch(() => {});
  }, [curatedUrl, destination]);

  return (
    <div className="relative min-h-screen" style={{ background: "#1a1a2e" }}>
      {/* Blurred background image */}
      {photoUrl && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
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
      )}

      {/* Region gradient overlay */}
      <div
        className={`absolute inset-0 z-0 bg-gradient-to-br ${gradient}`}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-0 bg-black/15" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
