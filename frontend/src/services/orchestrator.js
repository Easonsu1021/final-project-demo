// API connection for the Orchestrator service

const ORCHESTRATOR_API_URL = import.meta.env.VITE_ORCHESTRATOR_API_URL || 'http://localhost:8003';

export const sendChatMessage = async (messages, context = null) => {
    try {
        const response = await fetch(`${ORCHESTRATOR_API_URL}/orchestrator/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: messages,
                context: context
            }),
        });

        if (!response.ok) {
            throw new Error(`Orchestrator API ERROR: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to communicate with orchestrator-api:", error);
        throw error;
    }
};
