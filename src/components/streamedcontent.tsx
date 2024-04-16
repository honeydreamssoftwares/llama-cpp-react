import React, { useState } from 'react';
import { llama } from './completion';


// Define interfaces for expected data types
interface StreamedContentComponentProps {
    onPcTypeRecommended: (pcType: string) => void;
}

// Main component definition using React.FC (Functional Component)
const StreamedContentComponent: React.FC<StreamedContentComponentProps> = ({ onPcTypeRecommended }) => {
    const [messages, setMessages] = useState<string>(""); // State for storing message strings
    const [loading, setLoading] = useState<boolean>(false); // State to track loading status

    // Handler for changes in text input, assuming you want to capture input for the llama function
    const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessages(event.target.value);
    };

    // Asynchronously fetch or process data, abstracted into its own function for clarity
    const fetchStreamedContent = async (query: string) => {
        console.log("fetching...",query);

        const params = {
            n_predict: 512,
            stream: true,
        };
        const config = {
            api_url: 'http://localhost:8080'
        };

        try {
             let newContent="";
            for await (const event of llama(query, params, config)) {

               
                if (event.data?.content) {
                    // Append new content to existing messages

                    newContent += event.data.content;

                    setMessages(currentMessages => currentMessages + event.data?.content );
                }
                if (event.error) {
                    throw new Error(event.error.message);
                }
                if (event.data && event.data.stop) {

                    pcRecommended(newContent);
                    console.log("Stop received",event.data);
                    break; // Exit loop if stop signal is received
                }
            }
        } catch (error) {
            console.error('Error consuming events:', error);
        }
    };

    const pcRecommended = (currentMessages: string) => {
        console.log("pcRecommended filtering...",currentMessages);

        const lastColonIndex = currentMessages.lastIndexOf(':');
        if (lastColonIndex >= 0) {
            let pcType = currentMessages.substring(lastColonIndex + 1).trim();

            if (pcType.endsWith('.')) {
                pcType = pcType.slice(0, -1).trim();
            }

            pcType = pcType.replace(/[.,;]$/g, '').trim();
            onPcTypeRecommended(pcType);
        }
    };

    // Button click handler that triggers the asynchronous operation
    const handleAskClick = () => {
        if (!messages.trim()) return; // Prevent running with empty query
        setLoading(true); // Set loading true when the process starts
        void fetchStreamedContent(messages).finally(() => {
            setLoading(false); // Reset loading state when the process completes or fails
        });
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <input
                type="text"
                onChange={handleQueryChange}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Ask AI"
            />
            <button
                onClick={handleAskClick}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
                {loading ? "Thinking..." : "Ask"}
            </button>
            <div className="w-full p-4 bg-gray-100 rounded shadow">
                {messages.split("\n").map((message, index) => (
                    <p key={index}>{message}</p>
                ))}
            </div>
        </div>
    );
};

export default StreamedContentComponent;
