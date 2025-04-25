# Chat-Dynamic ML Server Integration

This document explains how the chat-dynamic application integrates with the ML server for enhanced functionality.

## Overview

The chat-dynamic application now has a dual behavior based on user input:

1. When messages contain keywords "show" or "display", the system uses the Groq model to render UI components dynamically.
2. For all other messages, the system routes the query to the ML server at http://10.120.135.116:5001 for AI-powered responses.

## Configuration

The ML server URL is configured in the `.env.local` file:

```
ML_SERVER_URL=http://10.120.135.116:5001
```

## How It Works

1. The `sendMessage` function in `app/(preview)/actions.tsx` checks if the user's message contains the keywords "show" or "display".
2. If these keywords are present, it determines which dynamic component to show based on additional keywords (cameras, hub, usage, etc.)
3. If these keywords are not present, it routes the request to the ML server's `/query` endpoint.
4. The ML server response is then displayed to the user as a regular text message.

## Starting the Application

To start both the Next.js application and ML server together, use:

```bash
npm run dev:all
```

This will start the Next.js application and the ML server in the background.

## Error Handling

If the ML server is unavailable or returns an error, the application will display a friendly error message to the user.

## ML Server API

The ML server exposes a `/query` endpoint that accepts POST requests with the following structure:

```json
{
  "query": "User's message here"
}
```

The response from the ML server should have the following structure:

```json
{
  "response": "AI-generated response here",
  "chat_memory": [...] // Optional chat history
}
``` 