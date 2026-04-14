const chatForm = document.getElementById('ai-chat-form');
const chatInput = document.getElementById('ai-chat-input');
const chatMessages = document.getElementById('chat-messages');

if (chatForm) {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        if (!msg) return;

        // Add user message to UI
        appendMessage('user', msg);
        chatInput.value = '';

        try {
            const result = await apiFetch('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message: msg })
            });

            // Add bot response to UI
            appendMessage('bot', result.response);
        } catch (error) {
            appendMessage('bot', "I'm having trouble connecting to my central brain. Please check your connection!");
        }
    });
}

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`;
    
    const isBot = sender === 'bot';
    
    div.innerHTML = `
        <div class="flex items-start max-w-[80%] ${sender === 'user' ? 'flex-row-reverse' : ''}">
            <div class="flex-shrink-0 w-8 h-8 rounded-full ${isBot ? 'bg-primary/20 text-primary' : 'bg-gray-600 text-white'} flex items-center justify-center ${isBot ? 'mr-3' : 'ml-3'}">
                <i class="fas ${isBot ? 'fa-robot' : 'fa-user'} text-xs"></i>
            </div>
            <div class="${isBot ? 'bg-gray-700' : 'bg-primary'} text-white p-3 rounded-2xl shadow-sm text-sm">
                ${text}
            </div>
        </div>
    `;
    
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
