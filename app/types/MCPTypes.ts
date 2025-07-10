import { MCPClientInterface } from "~/interfaces/MCPIntefaces";

export type MCPSessionData = {
    mcpClientInstance : MCPClientInterface;
    lastActivity: number;
}