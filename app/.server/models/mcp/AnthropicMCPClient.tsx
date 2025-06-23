import Anthropic from "@anthropic-ai/sdk";
import { MessageParam, Tool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCPClientInterface } from "~/interfaces/MCPIntefaces";
import { ChatMessage } from "~/types/ChatTypes";


export class AnthropicMCPClient implements MCPClientInterface{
    /**
     * SINGLETON INSTANCE
     */
    static #instance: AnthropicMCPClient;


    /**
     * ATTRIBUTES
     */
    transport: StreamableHTTPClientTransport;
    tools: Tool[];
    mcp: Client;
    llm: Anthropic;
    model: string;
    isConnected: boolean;


    /**
     * CONSTRUCTORS
     */


    private constructor(serverUrl: URL){
        if(!process.env.ANTHROPIC_SECRET)
            throw new Error("[MCP-CLIENT] Missing ANTHROPIC_SECRET. Check .env");

        this.transport = new StreamableHTTPClientTransport(serverUrl, {
            reconnectionOptions : {
                maxReconnectionDelay: 20000,
                initialReconnectionDelay: 1000,
                reconnectionDelayGrowFactor: 1.5,
                maxRetries: 5
            }
        });
        this.mcp = new Client({
            name: "mcp-weather-client",
            version: "1.0.0"
        });
        this.tools = [];
        this.llm = new Anthropic({
            apiKey: process.env.ANTHROPIC_SECRET,
        });
        
        this.model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
        this.isConnected = false;
    }

    public static get instance(): AnthropicMCPClient{
        if(!process.env.MCP_SERVER_URL)
            throw new Error('[MCP-CLIENT] No server URL provided. Please try again');

        if(!AnthropicMCPClient.#instance)
            AnthropicMCPClient.#instance = new AnthropicMCPClient(new URL(process.env.MCP_SERVER_URL));
        
        return AnthropicMCPClient.#instance;
    }


    /**
     * FUNCTIONS
     */


    /**
     * Function that starts a connection to an MCP Server
     * @returns 
     */
    public async connectToServer() : Promise<boolean>{
        if(this.isConnected)
            return true;

        try {
            //STEP 1 -- Connect to MCP Server
            console.log(`[MCP-CLIENT] Connecting to ${process.env.MCP_SERVER_URL}`)
            await this.mcp.connect(this.transport);

            //STEP 2 -- Get tools
            const serverTools = await this.mcp.listTools();
            this.tools = serverTools.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    input_schema: tool.inputSchema
                }
            })
            console.log("[MCP-CLIENT] Connected to server with tools:", this.tools.map(({ name }) => name));
            this.isConnected = true;
            return true;
        }
        catch(error){
            console.log(`[MCP-CLIENT] Connection to MCP server has failed: ${error instanceof Error ? error.message : error}`);
            this.disconnectFromServer();
            return false;
        }
    }


    public async disconnectFromServer() : Promise<boolean>{
        try {
            //STEP 1 -- Disconnect from MCP Server
            await this.mcp.close();
            this.isConnected = false;
            return true;
        }
        catch(error){
            console.log(`[MCP-CLIENT] Disconnection from MCP server has failed: ${error instanceof Error ? error.message : error}`);
            return false;
        }
    }

    public async processUserMessage(message : ChatMessage) : Promise<string>{
        //STEP 1 -- Generate message array for current request
        let messages : MessageParam[] = [
            {
                role: "user",
                content: message.text
            }
        ]

        //STEP 2 -- Ask to llm to process current messages
        console.log(`[MCP-CLIENT] Asking message ${message.text}`);
        let response = await this.llm.messages.create({
            model: this.model,
            max_tokens: 1000,
            messages,
            tools: this.tools
        });
        console.log(`[MCP-CLIENT] Received response ${response}`);

        //STEP 3 -- Process each response content sequentially
        let conversationResults: string[] = [];
         for (const content of response.content) {
            switch (content.type) {
                case "text":
                    console.log(`[MCP-CLIENT] Pushing text: ${content.text}`);
                    conversationResults.push(content.text);
                    break;
                    
                case "tool_use":
                    //STEP 3.A -- Call tool
                    let toolName = content.name;
                    let toolArguments = content.input as { [x: string]: unknown; } | undefined;
                    console.log(`[MCP-CLIENT] Processing tool use: ${toolName}`);
                    try {
                        let toolCallResult = await this.mcp.callTool({
                            name: toolName,
                            arguments: toolArguments
                        });
                        console.log(`[MCP-CLIENT] Tool ${toolName} result:`, toolCallResult);
                        
                        //STEP 3.B -- Add assistant message with tool use and tool result
                        messages.push({
                            role: "assistant",
                            content: [
                                {
                                    type: "tool_use",
                                    id: content.id,
                                    name: toolName,
                                    input: toolArguments || {}
                                }
                            ]
                        });
                        messages.push({
                            role: "user",
                            content: [
                                {
                                    type: "tool_result",
                                    tool_use_id: content.id,
                                    content: Array.isArray(toolCallResult.content) 
                                        ? toolCallResult.content.map(content => content.text || content).join('\n')
                                        : toolCallResult.content as string
                                }
                            ]
                        });

                        //STEP 3.C -- Get LLM's response to the tool result
                        const processingResponse = await this.llm.messages.create({
                            model: this.model,
                            max_tokens: 1000,
                            messages,
                        });
                        console.log(`[MCP-CLIENT] Processing response from ${toolName}:`, processingResponse);
                        
                        //STEP 3.D Add the processed response to results
                        for (const processedContent of processingResponse.content) {
                            if (processedContent.type === "text") 
                                conversationResults.push(processedContent.text);
                        }
                        
                    } 
                    catch (toolError) {
                        console.error(`[MCP-CLIENT] Error calling tool ${toolName}:`, toolError);
                        conversationResults.push(`Error calling tool ${toolName}: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`);
                    }
                    break;
                    
                default:
                    console.warn(`[MCP-CLIENT] Unsupported content type: ${(content as any).type}`);
                    break;
            }
        }
        
        const finalResult = conversationResults.join("\n");
        console.log(`[MCP-CLIENT] Final conversation result: ${finalResult}`);
        return finalResult;
    }
}