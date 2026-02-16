"use client";

import { AgentStep } from "@/lib/types";
import { Search, Cloud, MapPin, Compass, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";

interface AgentThinkingProps {
  steps: AgentStep[];
  isActive: boolean;
}

const toolIcons: Record<string, React.ReactNode> = {
  web_search: <Search size={14} />,
  places_search: <MapPin size={14} />,
  weather_fetch: <Cloud size={14} />,
};

const stepTypeConfig: Record<string, { color: string; bgColor: string }> = {
  thinking: { color: "text-secondary", bgColor: "bg-secondary/10" },
  tool_use: { color: "text-blue-600", bgColor: "bg-blue-50" },
  tool_result: { color: "text-emerald-600", bgColor: "bg-emerald-50" },
  text: { color: "text-secondary", bgColor: "bg-secondary/10" },
  error: { color: "text-danger", bgColor: "bg-red-50" },
  complete: { color: "text-success", bgColor: "bg-emerald-50" },
};

export default function AgentThinking({ steps, isActive }: AgentThinkingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [steps]);

  if (steps.length === 0 && !isActive) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-surface-alt border-b border-gray-100 flex items-center gap-2">
        <Compass size={16} className="text-secondary" />
        <span className="text-sm font-semibold text-secondary">
          Explorer&apos;s Journal
        </span>
        {isActive && (
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-primary agent-dot-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary agent-dot-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary agent-dot-3" />
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="max-h-64 overflow-y-auto p-3 space-y-1.5"
      >
        {steps.map((step) => {
          const config = stepTypeConfig[step.type] || stepTypeConfig.thinking;
          return (
            <div
              key={step.id}
              className={`flex items-start gap-2 px-3 py-2 rounded-lg ${config.bgColor}
                         animate-[fadeIn_0.3s_ease-in-out]`}
            >
              <div className={`mt-0.5 flex-shrink-0 ${config.color}`}>
                {step.type === "tool_use" && step.toolName
                  ? toolIcons[step.toolName] || <Search size={14} />
                  : step.type === "tool_result"
                    ? <CheckCircle size={14} />
                    : step.type === "error"
                      ? <AlertCircle size={14} />
                      : step.type === "complete"
                        ? <CheckCircle size={14} />
                        : <Compass size={14} />}
              </div>
              <p className={`text-sm ${config.color} leading-relaxed`}>
                {step.content}
              </p>
            </div>
          );
        })}

        {isActive && steps.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-muted agent-dot-1" />
            <div className="w-1.5 h-1.5 rounded-full bg-muted agent-dot-2" />
            <div className="w-1.5 h-1.5 rounded-full bg-muted agent-dot-3" />
            <span className="text-xs">Mapping it out...</span>
          </div>
        )}
      </div>
    </div>
  );
}
