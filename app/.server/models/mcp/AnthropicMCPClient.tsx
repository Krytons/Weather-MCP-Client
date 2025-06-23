import Anthropic from "@anthropic-ai/sdk";
import { MessageParam, Tool} from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCPClientInterface } from "~/interfaces/MCPIntefaces";
import { ChatMessage } from "~/types/ChatTypes";


//Configure Dotenv 
import dotenv from 'dotenv';
dotenv.config();


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
            apiKey: process.env.ANTHROPIC_API_KEY,
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
        let response = await this.llm.messages.create({
            model: this.model,
            max_tokens: 1000,
            messages,
            tools: this.tools
        });

        //STEP 3 -- For each response content define a consequence
        let conversationResults: string[] = [];
        let context = this;
        response.content.forEach(async (content) => {
            switch (content.type) {
                case "text":
                    conversationResults.push(content.text);
                    break;
                case "tool_use":
                    //STEP 3.A -- Call tool
                    let toolName = content.name;
                    let toolArguments = content.input as { [x: string]: unknown; } | undefined;
                    let toolCallResult = await context.mcp.callTool({
                        name: toolName,
                        arguments: toolArguments
                    });

                    //STEP 3.B -- Push executed action to result, and call LLM for tool result processing
                    conversationResults.push(`Calling tool ${toolName} with args ${JSON.stringify(toolCallResult)}`);
                    messages.push({
                        role: "user",
                        content: toolCallResult.content as string,
                    });
                    const processingResponse = await this.llm.messages.create({
                        model: context.model,
                        max_tokens: 1000,
                        messages,
                    });
                    conversationResults.push(processingResponse.content[0].type === "text" ? processingResponse.content[0].text : "");
                    break;
                default:
                    throw new Error("[MCP-CLIENT] Content type not supported");
            }
        });
        return conversationResults.join("\n");
    }
}