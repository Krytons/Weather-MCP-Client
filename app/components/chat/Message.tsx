import { ChatMessage } from "~/types/ChatTypes";

type MessageProps = {
    message : ChatMessage
}

export default function Message({message} : MessageProps) {
    
    return (
        <>
           <div className={`flex ${message.origin === 'user' ? 'text-right justify-end' : 'text-left justify-start'}`}>
                <p className="w-fit p-2 rounded bg-gray-200 dark:bg-gray-700">
                    {message.text}
                </p>
           </div>
        </>
    )
}