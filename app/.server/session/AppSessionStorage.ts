import { createCookieSessionStorage } from "@remix-run/node";

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