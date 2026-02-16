import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300;
import {
  agentTools,
  executeWebSearch,
  executePlacesSearch,
  executeWeatherFetch,
} from "@/lib/tools";
import { TripInput } from "@/lib/types";

function formatDate(dateStr: string, offsetDays: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildSystemPrompt(input: TripInput): string {
  const dateRange = Array.from({ length: input.days }, (_, i) =>
    formatDate(input.startDate, i)
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripStart = new Date(input.startDate + "T00:00:00");
  const diffDays = Math.floor(
    (tripStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weatherNote =
    diffDays > 16
      ? `\nIMPORTANT: The trip start date is more than 16 days away, so weather data is based on historical averages for this time of year (averaged over the past 5 years). Present this to the user as "typical weather for this period" rather than a precise forecast.`
      : "";

  return `You are an expert travel planning agent. You create detailed, realistic day-by-day travel itineraries.

CURRENT TASK: Create a ${input.days}-day itinerary for ${input.destination}.
Travel dates: ${dateRange.join(" → ")}
Number of travelers: ${input.travelers}
Budget: ${input.currency === "USD" ? "$" : input.currency}${input.budgetPerDay}/day per person (${input.currency === "USD" ? "$" : input.currency}${input.budgetPerDay * input.travelers}/day total for the group)
Interests: ${input.interests.join(", ")}
${input.hotelLocation ? `Hotel location: ${input.hotelLocation}` : ""}${weatherNote}

YOUR APPROACH:
1. First, use weather_fetch to check the forecast for the destination
2. Use web_search to find top attractions, restaurants, and activities matching the user's interests
3. Use places_search to get specific details (coordinates, ratings, costs) for the best options
4. Create a structured itinerary that is weather-aware (outdoor activities on clear days, indoor on rainy days)
5. Group nearby locations together to minimize travel time
6. Balance the daily schedule (don't overpack - typically 3-5 major activities per day)
7. Include realistic timing, travel between locations, and meal breaks
8. Track costs and stay within budget

CRITICAL RULES:
- Always search for weather FIRST
- Search for at least 2-3 different types of attractions based on user interests
- Get specific place details before including them in the itinerary
- Include specific cost estimates for each activity (PER PERSON costs)
- For ${input.travelers} traveler(s), note when activities have group discounts
- Note opening hours to avoid scheduling conflicts
- Add meal recommendations with cost estimates
- If budget is tight, prioritize free/cheap activities and note savings tips
- Include transport suggestions between locations
- Each day MUST include the "date" field matching the travel dates: ${dateRange.join(", ")}

OUTPUT FORMAT: After gathering all information, respond with a JSON block wrapped in <itinerary> tags:
<itinerary>
{
  "destination": "City Name",
  "centerCoordinates": {"lat": number, "lng": number},
  "currency": "USD",
  "totalEstimatedCost": number,
  "tips": ["tip1", "tip2", ...],
  "days": [
    {
      "dayNumber": 1,
      "date": "${dateRange[0]}",
      "theme": "Descriptive theme for the day",
      "weather": {
        "condition": "Sunny",
        "tempHigh": 25,
        "tempLow": 15,
        "rainChance": 10,
        "icon": "☀️"
      },
      "activities": [
        {
          "id": "unique-id",
          "name": "Place Name",
          "description": "Brief engaging description",
          "time": "9:00 AM",
          "duration": "1.5 hours",
          "category": "temples",
          "estimatedCost": 0,
          "rating": 4.7,
          "address": "Full Address",
          "coordinates": {"lat": number, "lng": number},
          "tips": "Optional insider tip"
        }
      ],
      "totalCost": number,
      "transportCost": number,
      "foodCost": number,
      "activityCost": number
    }
  ]
}
</itinerary>`;
}

function sendEvent(
  controller: ReadableStreamDefaultController,
  data: object
): void {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY not configured. Please add your API key to .env.local",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const input: TripInput = await request.json();

  // Validate input
  if (!input.destination || input.destination.trim().length === 0) {
    return new Response(
      JSON.stringify({ error: "Please enter a destination" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (input.days < 1 || input.days > 5) {
    return new Response(
      JSON.stringify({ error: "Days must be between 1 and 5" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendEvent(controller, {
          type: "step",
          step: {
            id: "start",
            type: "thinking",
            content: `Charting a ${input.days}-day adventure in ${input.destination}...`,
            timestamp: Date.now(),
          },
        });

        const messages: Anthropic.MessageParam[] = [
          {
            role: "user",
            content: `Plan a ${input.days}-day trip to ${input.destination} starting on ${input.startDate} for ${input.travelers} traveler${input.travelers > 1 ? "s" : ""}, with a budget of ${input.currency === "USD" ? "$" : input.currency}${input.budgetPerDay}/day per person. My interests are: ${input.interests.join(", ")}. ${input.hotelLocation ? `I'm staying near ${input.hotelLocation}.` : ""} Please search for the best options and create a detailed itinerary with specific dates for each day.`,
          },
        ];

        let iterationCount = 0;
        const maxIterations = 10;

        while (iterationCount < maxIterations) {
          iterationCount++;

          const response = await client.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 8192,
            system: buildSystemPrompt(input),
            tools: agentTools,
            messages,
          });

          // Process response content blocks
          const assistantContent: Anthropic.ContentBlock[] = [];
          let hasToolUse = false;
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of response.content) {
            assistantContent.push(block);

            if (block.type === "text") {
              // Check if this contains the final itinerary
              const itineraryMatch = block.text.match(
                /<itinerary>([\s\S]*?)<\/itinerary>/
              );
              if (itineraryMatch) {
                try {
                  const itinerary = JSON.parse(itineraryMatch[1]);
                  sendEvent(controller, {
                    type: "step",
                    step: {
                      id: `text-${Date.now()}`,
                      type: "complete",
                      content: "Your adventure is ready! Time to explore.",
                      timestamp: Date.now(),
                    },
                  });
                  sendEvent(controller, {
                    type: "itinerary",
                    itinerary: {
                      ...itinerary,
                      totalBudget: input.budgetPerDay * input.days * input.travelers,
                    },
                  });
                } catch {
                  sendEvent(controller, {
                    type: "step",
                    step: {
                      id: `error-${Date.now()}`,
                      type: "error",
                      content: "Error parsing itinerary. Retrying...",
                      timestamp: Date.now(),
                    },
                  });
                }
              } else {
                // Send thinking text
                const lines = block.text.split("\n").filter((l) => l.trim());
                for (const line of lines.slice(0, 3)) {
                  sendEvent(controller, {
                    type: "step",
                    step: {
                      id: `think-${Date.now()}-${Math.random()}`,
                      type: "thinking",
                      content: line.trim().substring(0, 200),
                      timestamp: Date.now(),
                    },
                  });
                }
              }
            }

            if (block.type === "tool_use") {
              hasToolUse = true;
              const toolName = block.name;
              const toolInput = block.input as Record<string, unknown>;

              // Friendly descriptions for the UI
              const toolDescriptions: Record<string, string> = {
                web_search: `Scouting the web for "${toolInput.query}"`,
                places_search: `Exploring "${toolInput.query}"...`,
                weather_fetch: `Checking the skies over ${toolInput.location}...`,
              };

              sendEvent(controller, {
                type: "step",
                step: {
                  id: `tool-${block.id}`,
                  type: "tool_use",
                  content:
                    toolDescriptions[toolName] || `Using ${toolName}...`,
                  toolName,
                  timestamp: Date.now(),
                },
              });

              // Execute the tool
              let result: string;
              try {
                switch (toolName) {
                  case "web_search":
                    result = await executeWebSearch(
                      toolInput.query as string
                    );
                    break;
                  case "places_search":
                    result = await executePlacesSearch(
                      toolInput.query as string,
                      toolInput.type as string | undefined
                    );
                    break;
                  case "weather_fetch":
                    result = await executeWeatherFetch(
                      toolInput.location as string,
                      toolInput.days as number,
                      (toolInput.start_date as string) || input.startDate
                    );
                    break;
                  default:
                    result = JSON.stringify({
                      error: `Unknown tool: ${toolName}`,
                    });
                }

                // Parse result to extract count for UI
                const parsed = JSON.parse(result);
                let resultSummary = "Noted!";
                if (parsed.results) {
                  resultSummary = `Discovered ${parsed.results.length} ${parsed.results.length === 1 ? "spot" : "spots"}`;
                } else if (parsed.places) {
                  resultSummary = `Pinned ${parsed.places.length} ${parsed.places.length === 1 ? "gem" : "gems"} on the map`;
                } else if (parsed.forecast) {
                  resultSummary = `${parsed.forecast.length}-day forecast locked in`;
                }

                sendEvent(controller, {
                  type: "step",
                  step: {
                    id: `result-${block.id}`,
                    type: "tool_result",
                    content: resultSummary,
                    toolName,
                    timestamp: Date.now(),
                  },
                });

                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: result,
                });
              } catch (error) {
                const errorMsg =
                  error instanceof Error
                    ? error.message
                    : "Tool execution failed";
                sendEvent(controller, {
                  type: "step",
                  step: {
                    id: `error-${block.id}`,
                    type: "error",
                    content: `Error with ${toolName}: ${errorMsg}`,
                    toolName,
                    timestamp: Date.now(),
                  },
                });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify({ error: errorMsg }),
                  is_error: true,
                });
              }
            }
          }

          // Add assistant message to conversation
          messages.push({ role: "assistant", content: assistantContent });

          if (hasToolUse) {
            // Add tool results and continue the loop
            messages.push({ role: "user", content: toolResults });
          }

          // Check stop condition
          if (response.stop_reason === "end_turn") {
            break;
          }
          if (!hasToolUse && response.stop_reason !== "tool_use") {
            break;
          }
        }

        if (iterationCount >= maxIterations) {
          sendEvent(controller, {
            type: "step",
            step: {
              id: "max-iterations",
              type: "error",
              content:
                "Reached maximum planning steps. Here's what we have so far.",
              timestamp: Date.now(),
            },
          });
        }

        sendEvent(controller, { type: "done" });
        controller.close();
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "An unexpected error occurred";
        sendEvent(controller, {
          type: "step",
          step: {
            id: "fatal-error",
            type: "error",
            content: `Planning error: ${errorMsg}`,
            timestamp: Date.now(),
          },
        });
        sendEvent(controller, { type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
