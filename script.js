// script.js (AI Agent Logic for E-Commerce Demo)

// *** 1. CHAT AGENT CONFIGURATION ***
// ⚠️ REPLACE THIS WITH your NGROK URL ⚠️
const API_BASE_URL = "https://laithly-ruddiest-ima.ngrok-free.dev";
// In a production setup, this would be your deployed server URL (e.g., https://api.eidos.com)

let conversationHistory = [];
const CUSTOMER_ID = "CUST-AURA-002"; // Unique ID for E-Commerce demo customer


// *** 2. CHAT AGENT FUNCTIONS ***

function toggleChat() {
    // MODIFIED: Reverted to original ID for the chat bubble container
    const chatBubble = document.getElementById('chat-bubble'); 
    const toggleIcon = document.getElementById('chat-toggle-icon');
    
    if (chatBubble.classList.contains('chat-closed')) {
        chatBubble.classList.remove('chat-closed');
        chatBubble.classList.add('chat-open');
        toggleIcon.textContent = 'x';
    } else {
        chatBubble.classList.remove('chat-open');
        chatBubble.classList.add('chat-closed');
        toggleIcon.textContent = '+';
    }
}

async function sendMessage() {
    const inputElement = document.getElementById('chat-input');
    const message = inputElement.value.trim();
    if (!message) return;

    // 1. Display User Message
    addMessage(message, 'user');
    inputElement.value = '';

    // 2. Add to conversation history
    conversationHistory.push({ role: 'user', content: message });
    
    // Simple loading indicator
    const loadingId = addLoadingMessage();

    // 3. Construct Payload (The exact structure your Flask server expects)
    const payload = {
        customer_id: CUSTOMER_ID,
        query: message,
        conversation_history: conversationHistory
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // 4. Handle Agent Response
        const agentResponse = await response.json();
        
        removeLoadingMessage(loadingId);
        
        if (response.ok) {
            handleAgentResponse(agentResponse);
        } else {
            // Handle HTTP errors or agent logic errors
            const errorMessage = agentResponse.error || "A high-priority system error occurred.";
            addMessage(`[ERROR] ${errorMessage}`, 'agent');
        }

    } catch (error) {
        removeLoadingMessage(loadingId);
        console.error("API Fetch Error:", error);
        addMessage("Connection error: Could not reach the AI Agent. Check your NGROK URL.", 'agent');
    }
}

function handleAgentResponse(response) {
    let outputText = response.support_answer;
    const action = response.autonomous_action;
    const aov = response.estimated_aov_increase_usd;

    // Format the response based on the Agent's action (Sales driven)
    if (action === 'INITIATE_SALE' && aov > 0) {
        outputText += "\n\n--- Sales Opportunity ---";
        outputText += `\n**Action:** ${action}`;
        outputText += `\n**Offer:** ${response.sales_offer_summary}`;
        outputText += `\n**Price:** $${aov.toFixed(2)}`;
        outputText += `\n${response.persuasive_closing_line}`;
    } else {
        // Only display action if it's not a successful sales push, for diagnostic purposes
        // outputText += `\n\n[Action: ${action}]`; 
    }

    addMessage(outputText, 'agent');
    
    // 5. Update Conversation History (for context in next turn)
    conversationHistory.push({ role: 'assistant', content: response.support_answer });
    
    // Scroll to the bottom
    document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
}

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    
    // Use innerHTML to handle simple markdown (bold/line breaks)
    messageDiv.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addLoadingMessage() {
    const id = Date.now();
    addMessage(`<span id="loading-${id}">...EIDOS is evaluating the query...</span>`, 'agent');
    return id;
}

function removeLoadingMessage(id) {
    const loadingSpan = document.getElementById(`loading-${id}`);
    if (loadingSpan) {
        loadingSpan.parentNode.remove();
    }
}

// *** 3. Initialize Chat Functions ***

// Expose chat functions globally since they are used in index.html onclick
window.toggleChat = toggleChat;
window.sendMessage = sendMessage;
