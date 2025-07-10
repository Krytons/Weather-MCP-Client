import { createCookieSessionStorage } from "@remix-run/node";
import { randomUUID } from "crypto";

export const appSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "session",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  },
});


/**
 * Generate a unique user session ID
 */
export function generateUserSessionId(): string {
  return `user_${randomUUID()}`;
}


/**
 * Get or create user session ID from request
 */
export async function getUserSessionId(request: Request): Promise<string> {
  const session = await appSessionStorage.getSession(request.headers.get("Cookie"));
  let userSessionId = session.get("userSessionId");
  
  if (!userSessionId) {
    // Generate new session ID if none exists
    userSessionId = generateUserSessionId();
    session.set("userSessionId", userSessionId);
  }
  
  return userSessionId;
}

/**
 * Create JSON response with session cookie
 */
export async function jsonWithSession(request: Request,data: any, responseInit?: ResponseInit): Promise<Response> {
  //STEP 1 -- Get current session storage
  const session = await appSessionStorage.getSession(request.headers.get("Cookie"));

  //STEP 2 -- Get current session ID
  let userSessionId = session.get("userSessionId");
  if (!userSessionId) {
    userSessionId = generateUserSessionId();
    session.set("userSessionId", userSessionId);
  }
  
  //STEP 3 -- Generate headers for response, committing session info
  const headers = new Headers(responseInit?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Set-Cookie", await appSessionStorage.commitSession(session));
  
  //STEP 4 -- Return response
  return new Response(JSON.stringify(data), {
    ...responseInit,
    headers,
  });
}