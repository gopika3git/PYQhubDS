document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatBox = document.getElementById("chat-box");
    const sendBtn = document.getElementById("chat-send-btn");

    if (!chatForm) return;

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const question = chatInput.value.trim();
        if (!question) return;

        // 1. Append user message to chat UI
        appendMessage("user-msg", question);
        chatInput.value = "";
        sendBtn.disabled = true;

        // 2. Append temporary "Thinking..." message
        const loadingDiv = appendMessage("bot-msg", "Thinking...");

        try {
            // 3. Send prompt to server AI route
            const res = await fetch("/api/ai/ask", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ question })
            });

            const data = await res.json();

            if (res.ok) {
                loadingDiv.innerText = data.reply;
            } else {
                loadingDiv.innerText = `❌ ${data.error || "Could not get an answer."}`;
            }
        } catch (err) {
            console.error("Chat Error:", err);
            loadingDiv.innerText = "❌ Network error. Please try again.";
        } finally {
            sendBtn.disabled = false;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    function appendMessage(className, text) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-msg ${className}`;
        msgDiv.innerText = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return msgDiv;
    }
});