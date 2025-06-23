import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Tool as MCPTool } from "@modelcontextprotocol/sdk/types.js";
import { Tool as AnthropicTool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { ReactNode } from "react";
import { ChatMessage } from "~/types/ChatTypes";

export interface MCPClientInterface {
  mcp: Client;
  llm: Anthropic;
  transport: StreamableHTTPClientTransport;
  tools: MCPTool[] | AnthropicTool[];
  model: string;
  isConnected: boolean;

  connectToServer(): Promise<boolean>;
  disconnectFromServer(): Promise<boolean>;
  processUserMessage(message: ChatMessage): Promise<string>;
}

export interface MCPProviderInterface {
  children: ReactNode;
  serverURL: URL;
}