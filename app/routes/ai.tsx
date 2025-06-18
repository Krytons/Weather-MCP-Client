import { Form } from "@remix-run/react";
import { FormEvent, useEffect, useState } from "react";
import Message from "~/components/chat/Message";
import { ChatMessage } from "~/types/ChatTypes";

import "~/ai.css"; 

export default function AI(){
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        setMessages(prev => [...prev, {
            origin: 'agent',
            text: 'Welcome to AI chat, please ask me anything!'
        }]);
    }, [])

    function submitMessage(event: FormEvent<HTMLFormElement>){
        event.preventDefault();

        let textarea : HTMLTextAreaElement | null = event.currentTarget.querySelector<HTMLTextAreaElement>(".chat-form-input");
        if(!textarea || textarea.value === "")
            return;
        let messageText = textarea.value.trim();

        setMessages(prev => [...prev, {
            origin: 'user',
            text: messageText
        }]);

        textarea.value = "";
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
                    <textarea className="chat-form-input"></textarea>
                    <button className="chat-form-submit">Submit</button>
                </Form>
            </div>
        </div>
    )
}