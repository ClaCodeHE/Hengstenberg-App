// Vercel serverless function: POST /api/chat
// Set ANTHROPIC_API_KEY in the Vercel project settings (server-side env var).
import { handleChat } from "../server/chat.ts";

export async function POST(request: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    /* handled as invalid request below */
  }
  const result = await handleChat(body);
  return Response.json(result.body, { status: result.status });
}
