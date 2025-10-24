// script.js (MODIFIED FOR CHAT AGENT INTEGRATION)

// *** 1. CHAT AGENT CONFIGURATION ***
// ⚠️ REPLACE THIS WITH your NGROK URL ⚠️
const API_BASE_URL = "http://127.0.0.1:5000"; 
// In a production setup, this would be your deployed server URL (e.g., https://api.eidos.com)

let conversationHistory = [];
const CUSTOMER_ID = "CUST-HICLV-001"; // Fixed ID for testing the 'Profit Priority' rule


// *** 2. CHAT AGENT FUNCTIONS ***

function toggleChat() {
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
        addMessage("Connection error: Could not reach the AI Agent.", 'agent');
    }
}

function handleAgentResponse(response) {
    let outputText = response.support_answer;
    const action = response.autonomous_action;
    const aov = response.estimated_aov_increase_usd;

    // Format the response based on the Agent's action
    if (action === 'INITIATE_SALE' && aov > 0) {
        outputText += "\n\n--- Sales Opportunity ---";
        outputText += `\n**Action:** ${action}`;
        outputText += `\n**Offer:** ${response.sales_offer_summary}`;
        outputText += `\n**Price:** $${aov.toFixed(2)}`;
        outputText += `\n${response.persuasive_closing_line}`;
    } else {
        outputText += `\n\n[Action: ${action}]`;
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
    
    // Use innerHTML to handle simple markdown if needed
    messageDiv.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addLoadingMessage() {
    const id = Date.now();
    addMessage(`<span id="loading-${id}">...Agent is thinking...</span>`, 'agent');
    return id;
}

function removeLoadingMessage(id) {
    const loadingSpan = document.getElementById(`loading-${id}`);
    if (loadingSpan) {
        loadingSpan.parentNode.remove();
    }
}


// *** 3. THREE.JS VISUAL LOGIC (Original Code) ***

document.addEventListener('DOMContentLoaded', () => {
    let scene, camera, renderer, icosahedron;

    // Expose toggleChat globally since it's used in index.html onclick
    window.toggleChat = toggleChat;
    window.sendMessage = sendMessage;
    
    function init() {
        const container = document.body;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 2.5;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Create a low-poly icosahedron for a sci-fi look
        const geometry = new THREE.IcosahedronGeometry(1.5, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x88c0d0, // Soft blue-green
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        icosahedron = new THREE.Mesh(geometry, material);
        scene.add(icosahedron);

        // Add a glowing effect
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x88c0d0,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const glowIcosahedron = new THREE.Mesh(geometry, glowMaterial);
        glowIcosahedron.scale.set(1.2, 1.2, 1.2);
        scene.add(glowIcosahedron);

        function animate() {
            requestAnimationFrame(animate);
            if (icosahedron) {
                icosahedron.rotation.x += 0.002;
                icosahedron.rotation.y += 0.003;
                glowIcosahedron.rotation.x += 0.002;
                glowIcosahedron.rotation.y += 0.003;

                // Simple deformation effect
                const time = Date.now() * 0.001;
                const positions = icosahedron.geometry.attributes.position.array;
                const glowPositions = glowIcosahedron.geometry.attributes.position.array;

                for (let i = 0; i < positions.length; i += 3) {
                    const p = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                    const distance = p.length();
                    const newY = positions[i+1] + Math.sin(distance * 5 + time) * 0.01; // Reduced deformation for stability
                    
                    positions[i+1] = newY;
                    glowPositions[i+1] = newY;
                }
                icosahedron.geometry.attributes.position.needsUpdate = true;
                glowIcosahedron.geometry.attributes.position.needsUpdate = true;
            }
            renderer.render(scene, camera);
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }

        window.addEventListener('resize', onWindowResize, false);

        animate();
    }
    init();
});
