"use client";

import { useMemo } from "react";
import { getDestinationBackground } from "@/lib/destination-backgrounds";

interface DestinationBackgroundProps {
  destination: string;
  children: React.ReactNode;
}

export default function DestinationBackground({
  destination,
  children,
}: DestinationBackgroundProps) {
  const { photoUrl, gradient } = useMemo(
    () => getDestinationBackground(destination),
    [destination]
  );

  return (
    <div className="relative min-h-screen" style={{ background: "#1a1a2e" }}>
      {/* Blurred background image */}
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
