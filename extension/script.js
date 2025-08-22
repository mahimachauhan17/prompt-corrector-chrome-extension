document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatWindow = document.getElementById('chat-window');
    
    // Modal elements
    const confirmationModal = document.getElementById('confirmation-modal');
    const originalPromptText = document.getElementById('original-prompt-text');
    const optimizedPromptText = document.getElementById('optimized-prompt-text');
    const confirmYesBtn = document.getElementById('confirm-yes');
    const confirmNoBtn = document.getElementById('confirm-no');

    const API_URL_OPTIMIZE = 'http://127.0.0.1:5000/optimize-prompt';
    const API_URL_RESPONSE = 'http://127.0.0.1:5000/get-response';

    let lastUserMessageElement = null; // To keep track of the user's message bubble

    const sendMessage = async () => {
        const originalPrompt = messageInput.value.trim();
        if (originalPrompt === '') return;

        // 1. Display user's original message and store the element
        lastUserMessageElement = appendMessage(originalPrompt, 'user-message');
        messageInput.value = '';
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // --- REMOVED --- We no longer show the "Optimizing..." message
        // const optimizingMsg = appendMessage('Optimizing your prompt...', 'bot-message');

        try {
            // 2. First API Call: Optimize the prompt
            const optimizeResponse = await fetch(API_URL_OPTIMIZE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: originalPrompt })
            });

            if (!optimizeResponse.ok) throw new Error('Failed to optimize prompt.');
            
            const dataOptimize = await optimizeResponse.json();
            const optimizedPrompt = dataOptimize.optimized_prompt;

            // 3. Show confirmation modal directly
            // --- REMOVED --- optimizingMsg.remove();
            showConfirmationModal(originalPrompt, optimizedPrompt);

        } catch (error) {
            console.error('Error:', error);
            // --- REMOVED --- optimizingMsg.remove();
            appendMessage('Sorry, something went wrong during optimization. Please check the console.', 'bot-message');
        }
    };

    const showConfirmationModal = (originalPrompt, optimizedPrompt) => {
        originalPromptText.textContent = originalPrompt;
        optimizedPromptText.innerHTML = optimizedPrompt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        confirmationModal.classList.add('visible');

        // We need to remove old listeners before adding new ones to prevent bugs
        const newYesBtn = confirmYesBtn.cloneNode(true);
        confirmYesBtn.parentNode.replaceChild(newYesBtn, confirmYesBtn);

        const newNoBtn = confirmNoBtn.cloneNode(true);
        confirmNoBtn.parentNode.replaceChild(newNoBtn, confirmNoBtn);

        newYesBtn.addEventListener('click', () => {
            // Modify the user's last message bubble with the optimized prompt
            if (lastUserMessageElement) {
                lastUserMessageElement.querySelector('p').textContent = optimizedPrompt;
            }
            getFinalResponse(optimizedPrompt);
        });

        newNoBtn.addEventListener('click', () => {
            getFinalResponse(originalPrompt);
        });
    };

    const getFinalResponse = async (promptToSend) => {
        // Hide the modal
        confirmationModal.classList.remove('visible');

        const loadingIndicator = appendLoadingIndicator();
        chatWindow.scrollTop = chatWindow.scrollHeight;

        try {
            const finalResponse = await fetch(API_URL_RESPONSE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptToSend })
            });

            if (!finalResponse.ok) throw new Error('Failed to get final response.');

            const dataFinal = await finalResponse.json();
            const botReply = dataFinal.response;
            
            loadingIndicator.remove();
            appendMessage(botReply, 'bot-message');
            chatWindow.scrollTop = chatWindow.scrollHeight;

        } catch (error) {
            console.error('Error:', error);
            loadingIndicator.remove();
            appendMessage('Sorry, something went wrong. Please check the console.', 'bot-message');
        }
    };

    const appendMessage = (text, className) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        const icon = document.createElement('i');
        icon.className = className === 'user-message' ? 'fas fa-user' : 'fas fa-robot';
        const p = document.createElement('p');
        p.textContent = text;
        messageDiv.appendChild(icon);
        messageDiv.appendChild(p);
        chatWindow.appendChild(messageDiv);
        return messageDiv;
    };

    const appendLoadingIndicator = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message bot-message loading-indicator';
        const icon = document.createElement('i');
        icon.className = 'fas fa-robot';
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        loadingDiv.appendChild(icon);
        loadingDiv.appendChild(spinner);
        chatWindow.appendChild(loadingDiv);
        return loadingDiv;
    };

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
});
