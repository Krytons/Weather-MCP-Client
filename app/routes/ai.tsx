import { Form, useLoaderData } from "@remix-run/react";
import { FormEvent, useEffect, useState } from "react";
import { ChatMessage } from "~/types/ChatTypes";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { AnthropicMCPClient } from "~/.server/models/mcp/AnthropicMCPClient";
import Message from "~/components/chat/Message";
import "~/ai.css"; 


/**
 * Loader function that checks for a MCP Connection
 * @param request  
 * @returns 
 */
export async function loader({request} : LoaderFunctionArgs) {
    const connected = await AnthropicMCPClient.instance.connectToServer();
    if (!connected) 
        throw new Response("Failed to connect to MCP Server", { status: 500 });
    return Response.json({ connected });
}


/**
 * Route action that process a sent message
 * @param request 
 * @returns 
 */
export async function action({request} : ActionFunctionArgs){
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
    
    const mcpClient = AnthropicMCPClient.instance;
    if(!mcpClient.isConnected)
        await mcpClient.connectToServer();

    let aiResponse = await mcpClient.processUserMessage(userMessage);
    return Response.json({
        agentMessage: { 
            origin: "agent", 
            text: aiResponse 
        }
    });
}


export default function AI(){
    const { connected } = useLoaderData<typeof loader>();
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

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
    }, [])

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

        //STEP 2 -- Build a valid form send request, calling the same route
        const response = await fetch("/ai", {
            method: "POST",
            body: formData
        });

        //STEP 3 -- Handle response and update state
        let agentMessage = response.ok ? await response.json() : {
            origin: 'agent',
            text: 'An error has occurred, please try again'
        }
        setMessages(prev => [...prev, agentMessage]);
        setLoading(false);
    }

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {
                    messages.map((messageElement, index) => (
                        <Message key={index} message={messageElement}/>
                    ))
                }
            </div>
            <div className="chat-form">
                <Form className="w-full relative" onSubmit={submitMessage}>
                    <textarea className="chat-form-input" name="user-message"></textarea>
                    <button className="chat-form-submit" disabled={!connected || loading}>
                        {loading ? "Waiting..." : "Submit"}
                    </button>
                </Form>
            </div>
        </div>
    )
}