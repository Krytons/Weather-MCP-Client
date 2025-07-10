import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Tool as MCPTool } from "@modelcontextprotocol/sdk/types.js";
import { Tool as AnthropicTool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { ChatMessage } from "~/types/ChatTypes";

export interface MCPClientInterface {
  mcp: Client;
  llm: Anthropic;
  transport: StreamableHTTPClientTransport;
  tools: MCPTool[] | AnthropicTool[];
  model: string;
  isConnected: boolean;
  mcpSessionId?: string;

  connectToServer(): Promise<boolean>;
  disconnectFromServer(): Promise<boolean>;
  processUserMessage(message: ChatMessage, userSessionID : string): Promise<string>;
}