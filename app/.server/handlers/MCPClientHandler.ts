import { appSessionStorage } from "~/.server/session/AppSessionStorage";
import { MCPClientHandlerInterface } from "~/interfaces/MCPIntefaces";
import { ChatMessage } from "~/types/ChatTypes";
import { MCPSessionData } from "~/types/MCPTypes";
import { AuthService } from "../services/AuthService";
import { AnthropicMCPClient } from "../services/AnthropicMCPClient";

export class MCPClientHandler implements MCPClientHandlerInterface {
    private session: Map<string, MCPSessionData> = new Map();
    private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    private readonly SESSION_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

    
    constructor(){
        //STEP 1 -- Start cleanup interval
        setInterval(() => this.cleanupSessions(), this.SESSION_CLEANUP_INTERVAL); 
    }


    public async connectToServer(request: Request): Promise<boolean> {
        try{
            //STEP 1 -- Authenticate client to get a valid JWT
            let authServiceResponse = AuthService.authenticateClient();
            if (!authServiceResponse) 
                throw new Response("Failed to authenticate client", { status: 500 });
            console.log("[MCP-CLIENT-HANDLER] Authenticated client successfully");

            //STEP 2 -- Instantiate MCP Client and connect to server
            const storageSession = await appSessionStorage.getSession(request.headers.get("Cookie") );
            let jwt = storageSession.get("jwt");

            //STEP 3 -- Handle connection and store session data
            let mcpClient = new AnthropicMCPClient(jwt);
            if (!mcpClient) 
                throw new Response("Failed to create MCP Client", { status: 500 });
            let connected = await mcpClient.connectToServer(request);
            if (!connected) 
                throw new Response("Failed to connect to MCP Server", { status: 500 }); 
            console.log("[MCP-CLIENT-HANDLER] Connected to MCP Server successfully");

            //STEP 4 -- Store session data
            const sessionId = mcpClient.mcpSessionId || "default-session-id";
            this.session.set(sessionId, {
                mcpClientInstance: mcpClient,
                lastActivity: Date.now()     
            });
            storageSession.set("mcp-session-id", sessionId);
            return true;
        }
        catch(error) {
            console.error("[MCP-CLIENT-HANDLER] Error connecting to MCP Server:", error);
            throw new Response("Failed to connect to MCP Server", { status: 500 });
        }   
    }


    public async disconnectFromServer(request: Request): Promise<boolean> {
        try{
            //STEP 1 -- Get session data from request
            let sessionData = await this.getValidSession(request);
            if(!sessionData)
                throw new Response("Failed to disconnect from MCP Server: invalid session data", { status: 500 });

            //STEP 2 -- Execute disconnection
            let result = sessionData.mcpClientInstance.disconnectFromServer();
            if(!result)
                throw new Response("Failed to disconnect from MCP Server", { status: 500 });

            //STEP 3 -- Remove from session
            if (sessionData.mcpClientInstance.mcpSessionId) 
                this.session.delete(sessionData.mcpClientInstance.mcpSessionId);
            const session = await appSessionStorage.getSession(request.headers.get("Cookie"));
            appSessionStorage.destroySession(session);
            return true;
        }
        catch(error){
            console.error("[MCP-CLIENT-HANDLER] An error occurred while disconnecting from MCP Server:", error);
            throw new Response("Failed to connect to MCP Server", { status: 500 });
        }
    }


    public async processUserMessage(message: ChatMessage, request: Request): Promise<string> {
        try{
            //STEP 1 -- Get session data from request
            let sessionData = await this.getValidSession(request);
            if(!sessionData)
                throw new Response("Failed to connect to MCP Server: invalid session data", { status: 500 });
            
            //STEP 2 -- Process user message
            return sessionData.mcpClientInstance.processUserMessage(message);
        }
        catch(error){
            console.error("[MCP-CLIENT-HANDLER] Error connecting to MCP Server:", error);
            throw new Response("Failed to connect to MCP Server", { status: 500 });
        }
    }


    private cleanupSessions() {
        const now = Date.now();
        for (const [sessionId, sessionData] of this.session.entries()) {
            if (now - sessionData.lastActivity > this.SESSION_TIMEOUT) {
                console.log(`[MCP-CLIENT-HANDLER] Cleaning up session: ${sessionId}`);
                sessionData.mcpClientInstance.disconnectFromServer();
                this.session.delete(sessionId);
            }
        }
    }


    private async getValidSession(request : Request): Promise<MCPSessionData | undefined> {
        try{
            //STEP 1 -- Get session cookie from request headers
            if (!request.headers.get("Cookie")) {
                console.warn("[MCP-CLIENT-HANDLER] No session cookie found in request headers.");
                return;
            }

            //STEP 2 -- Get session from storage and validate JWT and mcp-session-id
            const session = await appSessionStorage.getSession(request.headers.get("Cookie") );
            let jwt = session.get("jwt");
            let mcpSessionId = session.get("mcp-session-id");
            if (!jwt || !mcpSessionId ) {
                console.warn("[MCP-CLIENT-HANDLER] Session data is incomplete or missing.");
                return;
            }

            //STEP 3 -- Get MCP client instance  TODO: check for a connection
            let mcpSessionData = this.session.get(mcpSessionId);
            if(!mcpSessionData || !mcpSessionData.mcpClientInstance){
                console.warn("[MCP-CLIENT-HANDLER] Could not find a valid MCP client instance");
                return;
            }
            mcpSessionData.lastActivity = Date.now();
                
            //STEP 4 -- Return validated session
            console.log("[MCP-CLIENT-HANDLER] Session validated successfully.");
            return mcpSessionData;
        }
        catch(error) {
            console.error("[MCP-CLIENT-HANDLER] Session validation failed:", error);
            throw new Error("Invalid session");
        }
    }
}