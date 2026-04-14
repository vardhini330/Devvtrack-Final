document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('ai-chat-form');
    const chatInput = document.getElementById('ai-chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            // Add user message to UI
            addMessage('user', message);
            chatInput.value = '';

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ message })
                });

                const data = await response.json();
                if (data.success) {
                    addMessage('assistant', data.response);
                } else {
                    addMessage('error', 'Sorry, I encountered an error. Please try again.');
                }
            } catch (error) {
                console.error('AI Chat Error:', error);
                addMessage('error', 'Network error. Please check your connection.');
            }
        });
    }

    function addMessage(role, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`;
        
        let bgColor = role === 'user' ? 'bg-primary' : (role === 'error' ? 'bg-red-500/20' : 'bg-gray-700');
        let textColor = 'text-white';
        let icon = role === 'user' ? 'user' : 'robot';

        messageDiv.innerHTML = `
            <div class="flex items-start max-w-[80%] ${role === 'user' ? 'flex-row-reverse' : ''}">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center ${role === 'user' ? 'ml-3' : 'mr-3'}">
                    <i class="fas fa-${icon} text-xs"></i>
                </div>
                <div class="${bgColor} ${textColor} p-3 rounded-2xl shadow-sm text-sm">
                    ${text}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
