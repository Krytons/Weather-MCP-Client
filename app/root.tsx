import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";
import Sidebar from "./components/navigation/sidebar";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Sidebar />
        <div className="main-content w-full">
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}


export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)){
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-16">
          <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">
            {error.status} {error.statusText}
          </h1>
          <p className="leading-6 text-gray-700 dark:text-gray-200">{error.data}</p>
        </div>
      </div>
    );
  }
  else if (error instanceof Error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>
          <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">Error</h1>
          <p className="leading-6 text-gray-700 dark:text-gray-200">{error.message}</p>
          <p className="leading-6 text-gray-700 dark:text-gray-200">The stack trace is:</p>
          <pre>{error.stack}</pre>
        </div>
      </div>
    )
  }
  else {
    return <h1>Unknown Error</h1>
  }
}