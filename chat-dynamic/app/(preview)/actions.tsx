"use server"
import { Message, TextStreamMessage } from "@/components/message";
import { groq } from '@ai-sdk/groq';

import { CoreMessage, generateId } from "ai";
import {
  createAI,
  createStreamableValue,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";
import { CameraView } from "@/components/camera-view";
import { HubView } from "@/components/hub-view";
import { UsageView } from "@/components/usage-view";
import { WorldClock } from "@/components/world-clock";
import { SalesData } from "@/components/sales-data";

export interface Hub {
  climate: Record<"low" | "high", number>;
  lights: Array<{ name: string; status: boolean }>;
  locks: Array<{ name: string; isLocked: boolean }>;
}

let hub: Hub = {
  climate: {
    low: 23,
    high: 25,
  },
  lights: [
    { name: "patio", status: true },
    { name: "kitchen", status: false },
    { name: "garage", status: true },
  ],
  locks: [{ name: "back door", isLocked: true }],
};

// ML server URL with fallback
const ML_SERVER_URL = 'http://10.120.135.116:5001';

// Function to make API calls to ML server
async function callMLServer(query: string, user_id: number = 2412) {
  try {
    console.log(`Making API call to ML server with query: "${query}" and user_id: ${user_id}`);
    console.log(`Full request URL: ${ML_SERVER_URL}/query`);
    console.log(`Request body: ${JSON.stringify({ user_query: query, user_id })}`);
    
    // Create an AbortController to allow timing out the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(`${ML_SERVER_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_query: query, user_id }),
        signal: controller.signal,
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`ML server error - Status: ${response.status}, Status Text: ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Response error body: ${errorText}`);
        throw new Error(`ML server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`ML server response:`, data);
      
      // Check if the response has expected structure
      if (data.response) {
        return data.response;
      } else {
        // If not directly the response, check for other structures
        return data.chat_memory && data.response 
          ? data.response 
          : (typeof data === 'string' ? data : JSON.stringify(data));
      }
    } catch (fetchError: any) {
      // Check if the error is due to timeout
      if (fetchError.name === 'AbortError') {
        throw new Error('Request to ML server timed out after 15 seconds.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error calling ML server:', error);
    throw error;
  }
}

const sendMessage = async (message: string, args?: Record<string, any>) => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  // Extract user_id from args, default to 2412 if not provided
  const user_id = args?.user_id ? parseInt(args.user_id) : 2412;

  // Check for show/display keywords to determine if we need to use a tool
  const lowerMessage = message.toLowerCase();
  const hasShowKeywords = lowerMessage.includes("show") || lowerMessage.includes("display");
  
  // If message has show/display keywords, use the Groq model to render UI components
  if (hasShowKeywords) {
    // Determine which component to show based on keywords
    if (lowerMessage.includes("camera") || lowerMessage.includes("cameras")) {
      return await executeToolCall("viewCameras", {});
    }
    // Check for hub/temperature/lights/locks
    else if (lowerMessage.includes("hub") || lowerMessage.includes("temperature") || 
             lowerMessage.includes("light") || lowerMessage.includes("lock")) {
      return await executeToolCall("viewHub", {});
    }
    // Check for usage (electricity, water, gas)
    else if (lowerMessage.includes("usage") || lowerMessage.includes("electricity") || 
             lowerMessage.includes("water") || lowerMessage.includes("gas")) {
      const type = lowerMessage.includes("electricity") ? "electricity" : 
                   lowerMessage.includes("water") ? "water" : "gas";
      return await executeToolCall("viewUsage", { type });
    }
    // Check for world clock
    else if (lowerMessage.includes("clock") || lowerMessage.includes("time")) {
      return await executeToolCall("viewWorldClock", {});
    }
    // Check for sales data
    else if (lowerMessage.includes("sales") || lowerMessage.includes("revenue") || 
             lowerMessage.includes("performance")) {
      // Extract year if mentioned, default to 2024
      const yearMatch = lowerMessage.match(/\b(202[0-4])\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 2024;
      return await executeToolCall("viewSalesData", { year });
    }
  } else {
    // For non-show/display messages, send query to ML server
    try {
      // Call ML server /query endpoint using our helper function with user_id
      const mlResponse = await callMLServer(message, user_id);
      
      // Update messages with ML server response
      messages.done([
        ...(messages.get() as CoreMessage[]),
        { role: "assistant", content: mlResponse },
      ]);
      
      // Return the ML response as a message
      return <Message role="assistant" content={mlResponse} />;
    } catch (error) {
      console.error("Error calling ML server:", error);
      const errorMessage = "Sorry, I encountered an error communicating with the ML server. Please try again later.";
      
      messages.done([
        ...(messages.get() as CoreMessage[]),
        { role: "assistant", content: errorMessage },
      ]);
      
      return <Message role="assistant" content={errorMessage} />;
    }
  }

  // Fallback response if no specific condition was met
  const fallbackResponse = `Hello! I'm here to help with your enterprise needs. You can ask me to show or display various components like cameras, hub status, utility usage, world clock, or sales data. How can I assist you today?`;
  
  messages.done([
    ...(messages.get() as CoreMessage[]),
    { role: "assistant", content: fallbackResponse },
  ]);
  
  return <Message role="assistant" content={fallbackResponse} />;
};

// Helper function to execute tool calls directly
const executeToolCall = async (toolName: string, args: any) => {
  const messages = getMutableAIState<typeof AI>("messages");
  const toolCallId = generateId();
  
  // Define result messages for each tool
  const toolResults: Record<string, string> = {
    viewCameras: "The active cameras are currently displayed on the screen",
    viewHub: "Current status of the hub is displayed on the screen",
    viewUsage: `The current usage for ${args.type || 'utilities'} is currently displayed on the screen`,
    viewWorldClock: "The current time in various countries is displayed on the screen",
    viewSalesData: `Sales performance data for ${args.year} is displayed on the screen. You can switch between views and metrics.`
  };
  
  // Update the messages with the tool call and result
  messages.done([
    ...(messages.get() as CoreMessage[]),
    {
      role: "assistant",
      content: [
        {
          type: "tool-call",
          toolCallId,
          toolName,
          args,
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolName,
          toolCallId,
          result: toolResults[toolName],
        },
      ],
    },
  ]);
  
  // Execute the actual tool and return appropriate component
  switch (toolName) {
    case "viewCameras":
      return <Message role="assistant" content={<CameraView />} />;
      
    case "viewHub":
      return <Message role="assistant" content={<HubView hub={hub} />} />;
      
    case "viewUsage":
      return <Message role="assistant" content={<UsageView type={args.type} />} />;
      
    case "viewWorldClock":
      return <Message role="assistant" content={<WorldClock />} />;
      
    case "viewSalesData":
      return (
        <Message
          role="assistant"
          content={
            <>
              <p className="mb-4">Here&apos;s the sales performance data for {args.year}:</p>
              <SalesData initialYear={args.year} />
            </>
          }
        />
      );
      
    default:
      return null;
  }
};

export type UIState = Array<ReactNode>;

export type AIState = {
  chatId: string;
  messages: Array<CoreMessage>;
};

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
  },
  initialUIState: [],
  actions: {
    sendMessage,
  },
  onSetAIState: async ({ state, done }) => {
    "use server";

    if (done) {
      // save to database
    }
  },
});
