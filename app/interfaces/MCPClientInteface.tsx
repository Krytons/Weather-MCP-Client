import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Tool as MCPTool } from "@modelcontextprotocol/sdk/types.js";
import { Tool as AnthropicTool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";

export default interface MCPClientInterface {
  mcp: Client;
  llm: Anthropic;
  transport: StreamableHTTPClientTransport;
  tools: MCPTool[] | AnthropicTool[];
  model: string;
}