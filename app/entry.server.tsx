/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { PassThrough } from "node:stream";

import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { AnthropicMCPClient } from "./.server/services/AnthropicMCPClient";

const ABORT_DELAY = 5_000;

import dotenv from 'dotenv';
import { AuthService } from "./.server/services/AuthService";
dotenv.config();

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
) {
  return isbot(request.headers.get("user-agent") || "")
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}


// Global MCP Client instance
let globalMCPClient: AnthropicMCPClient | null = null;
let mcpInitializationPromise: Promise<boolean> | null = null;

/**
 * Initialize shared MCP Client connection
 */
async function initializeMCPClient() : Promise<boolean> {
  //STEP 0 -- Check initialization
  if (globalMCPClient && globalMCPClient.isConnected) 
    return true;
  if (mcpInitializationPromise) 
    return await mcpInitializationPromise;
  
  try{
    //STEP 1 -- Authenticate client to get a valid JWT
      let authServiceResponse = await AuthService.authenticateClient();
      if (!authServiceResponse) 
          throw new Response("Failed to authenticate client", { status: 500 });
      console.log("[MCP-CLIENT-HANDLER] Authenticated client successfully");

      //STEP 2 -- Instantiate new MCP Client 
      globalMCPClient = new AnthropicMCPClient(authServiceResponse.token);

      //STEP 3 -- Connect MCP Client to MCP Server
      const connected = await globalMCPClient.connectToServer();
      if (connected)
        console.log("[ENTRY-SERVER] Global MCP Client connected successfully");

      //STEP 4 -- Setup graceful shutdown
      process.on('SIGINT', async () => {
        console.log("[ENTRY-SERVER] Shutting down MCP Client...");
        if (globalMCPClient) 
          await globalMCPClient.disconnectFromServer();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log("[ENTRY-SERVER] Shutting down MCP Client...");
        if (globalMCPClient) 
          await globalMCPClient.disconnectFromServer();
        process.exit(0);
      });

      return true;
  }
  catch (error) {
    console.error("[ENTRY-SERVER] Failed to initialize MCP Client:", error);
    globalMCPClient = null;
    return false;
  }
}

/**
 * Get the global MCP Client instance
 */
export function getGlobalMCPClient(): AnthropicMCPClient | null {
  return globalMCPClient;
}

// Initialize MCP Client on server startup
initializeMCPClient().catch(error => {
  console.error("[ENTRY-SERVER] Critical error during MCP Client initialization:", error);
});