import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { FormEvent, useEffect, useState } from "react";
import { ChatMessage } from "~/types/ChatTypes";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import Message from "~/components/chat/Message";
import "~/ai.css"; 
import LoadingDots from "~/components/loaders/LoadingDots";
import { getUserSessionId, jsonWithSession } from "~/.server/session/AppSessionStorage";
import { getGlobalMCPClient } from "~/entry.server";


/**
 * Loader function that checks for a MCP Connection
 * @param request  
 * @returns 
 */
export async function loader({request} : LoaderFunctionArgs) {
    //STEP 1 -- Be sure that server has an instance of mcpClient
    const mcpClient = getGlobalMCPClient();
    if (!mcpClient) 
        throw new Response("Failed to connect to MCP Server", { status: 500 });

    //STEP 2 -- Retrieve session for current user
    const currentSessionId = await getUserSessionId(request);
    
    //STEP 3 -- Return MCP connection status
    return jsonWithSession(request, { connected: mcpClient.isConnected });
}


/**
 * Route action that process a sent message
 * @param request 
 * @returns 
 */
export async function action({request} : ActionFunctionArgs){
    //STEP 1 -- Compose user message
    const formData = await request.formData();
    const userText = formData?.get("user-message");
    if(!userText || typeof userText !== "string")
        return Response.json({
            error: "Invalid or empty message",
            status: 400
        })
    let userMessage : ChatMessage = {
        origin: 'user',
        text: userText
    }
    
    //STEP 2 -- Get MCP client and be sure it's connected
    const mcpClient = getGlobalMCPClient();
    if(!mcpClient)
        return Response.json({
            error: "Internal server error",
            status: 500
        })
    if(!mcpClient.isConnected)
        await mcpClient.connectToServer();

    //STEP 3 -- Retrieve session for current user
    const currentSessionId = await getUserSessionId(request);

    //STEP 4 -- Process chat message and return it's response
    let aiResponse = await mcpClient.processUserMessage(userMessage, currentSessionId);
    console.log("Server response: " + aiResponse);
    return Response.json({
        agentMessage: { 
            origin: "agent", 
            text: aiResponse 
        }
    }, {status : 200});
}


export default function AI(){
    const { connected } = useLoaderData<typeof loader>();
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const fetcher = useFetcher<typeof action>();

    //Handle connection to MCP or component loading
    useEffect(() => {
        let firstMessage;
        if(connected)
            firstMessage = 'Welcome to AI chat, please ask me anything!'
        else
            firstMessage = 'An error occurred. Please try again or later.'

        setMessages(prev => [...prev, {
            origin: 'agent',
            text: firstMessage
        }]);
    }, [connected])


    //Handle fetcher response
    useEffect(() => {
        if (fetcher.data && !fetcher.data.error) {
            const responseData = fetcher.data as { agentMessage: ChatMessage };
            setMessages(prev => [...prev, responseData.agentMessage]);
            setLoading(false);
        } else if (fetcher.data?.error) {
            setMessages(prev => [...prev, {
                origin: "agent",
                text: "An error has occurred, please try again"
            }]);
            setLoading(false);
        }
    }, [fetcher.data]);


    //Handle loading status
     useEffect(() => {
        if (fetcher.state === "submitting") 
            setLoading(true);
        else if (fetcher.state === "idle") 
            setLoading(false);
    }, [fetcher.state]);


    async function submitMessage(event: FormEvent<HTMLFormElement>){
        //STEP 0 -- Handle submit only if load state is off
        event.preventDefault();
        if (loading) 
            return;
        setLoading(true);

        //STEP 1 -- Get user message ad update current state
        const form = event.currentTarget;
        const formData = new FormData(form);
        const messageText = formData.get("user-message")?.toString().trim();
        if (!messageText)
            return;
        setMessages(prev => [...prev, {
            origin: 'user',
            text: messageText
        }]);
        form.reset();

        // STEP 2 -- Submit using fetcher instead of manual fetch
        fetcher.submit(formData, { method: "POST" });
    }

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {
                    messages.map((messageElement, index) => (
                        <Message key={index} message={messageElement}/>
                    ))
                }
                { loading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-3 max-w-xs animate-pulse">
                            <div className="flex items-center gap-2">
                                <LoadingDots size="md" />
                                <span className="text-gray-600 dark:text-gray-300 text-sm">
                                    AI is thinking...
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="chat-form">
                <Form className="w-full relative" onSubmit={submitMessage}>
                    <textarea className="chat-form-input" name="user-message"></textarea>
                    <button className="chat-form-submit" disabled={!connected || loading}>
                        { 
                            loading ? (
                                <span className="flex items-center gap-2">
                                    <LoadingDots size="sm" />
                                    Waiting
                                </span>
                            ) : ("Submit")
                        }
                    </button>
                </Form>
            </div>
        </div>
    )
}