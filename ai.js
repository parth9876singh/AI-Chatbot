

let prompt = document.querySelector("#prompt");
let chatcontainer = document.querySelector(".chat-display");
const microphoneBtn = document.querySelector("#microphoneBtn");
const imageUploadBtn = document.querySelector("#imageUploadBtn");
const imageInput = document.querySelector("#imageInput");
const sendBtn = document.querySelector("#sendBtn");

const api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDFu4DREzvH0Z6ITZGrSwyYVmQrhnmJMTQ";
let user = {
    data: "",
    image: null
};

// Speech recognition setup (unchanged)
let recognition;
try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = function() {
        microphoneBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        microphoneBtn.classList.add('listening');
    };

    recognition.onend = function() {
        microphoneBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        microphoneBtn.classList.remove('listening');
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error', event.error);
        microphoneBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        microphoneBtn.classList.remove('listening');
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        prompt.value = transcript;
        handleChatResponse(transcript);
    };

} catch(e) {
    console.error("Speech recognition not supported", e);
    microphoneBtn.style.display = 'none';
}

// Image upload functionality
imageUploadBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("Please upload an image smaller than 5MB");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        user.image = imageUrl;
        displayUserImage(imageUrl, file.name);
    };
    reader.readAsDataURL(file);
});

function displayUserImage(imageUrl, filename) {
    let html = `<div class="user-chat-box">
        <img src="user.png" alt="" id="userimg" width="50">
        <div class="user-chat-area">
            <img src="${imageUrl}" alt="Uploaded image" class="uploaded-image">
            <p>${filename}</p>
        </div>
    </div>`;
    
    let userchatBox = createChatBox(html, "user-chat-box");   
    chatcontainer.appendChild(userchatBox); 
    chatcontainer.scrollTo({top: chatcontainer.scrollHeight, behavior: "smooth"});
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

async function generateResponse(aichatBox) {
    let text = aichatBox.querySelector(".ai-chat-area");

    let requestBody = {
        "contents": [{
            "parts": []
        }]
    };

    // Add text if available
    if (user.data && user.data.trim() !== "") {
        requestBody.contents[0].parts.push({"text": user.data});
    }

    // Add image if available
    if (user.image) {
        const base64Image = user.image.split(',')[1];
        requestBody.contents[0].parts.push({
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": base64Image
            }
        });
    }

    let requestoption = {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody)
    }

    try {
        let response = await fetch(api_url, requestoption);
        let data = await response.json();
        let apiresponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        text.innerHTML = apiresponse;
    } catch(error) {
        console.log(error);
        text.innerHTML = "Sorry, I encountered an error. Please try again.";
    } finally {
        chatcontainer.scrollTo({top: chatcontainer.scrollHeight, behavior: "smooth"});
        // Reset user data after processing
        user.data = "";
        user.image = null;
        imageInput.value = ""; // Clear file input
    }
}

function handleChatResponse(message) {
    if (!message || message.trim() === "") return;
    
    user.data = message;
    let html = `<div class="user-chat-box">
        <img src="user.png" alt="" id="userimg" width="50">
        <div class="user-chat-area">
            ${user.data}
        </div>
    </div>`;
    prompt.value = "";

    let userchatBox = createChatBox(html, "user-chat-box");   
    chatcontainer.appendChild(userchatBox); 
    chatcontainer.scrollTo({top: chatcontainer.scrollHeight, behavior: "smooth"});

    setTimeout(() => {
        let html = `<div class="ai-chat-box">
            <img src="ai.png" alt="" id="aiimg" width="50">
            <div class="ai-chat-area">
                <img src="loading.png" alt="" class="loading" width="50px">
            </div>
        </div>`;
        let aichatBox = createChatBox(html, "ai-chat-box");
        chatcontainer.appendChild(aichatBox);
        generateResponse(aichatBox);
    }, 600);
}

// Event listeners
prompt.addEventListener("keydown", (event) => {
    if(event.key === "Enter") {
        handleChatResponse(prompt.value);
    }
});

sendBtn.addEventListener("click", () => {
    handleChatResponse(prompt.value);
});

microphoneBtn.addEventListener("click", () => {
    if (recognition) {
        try {
            recognition.start();
        } catch(e) {
            console.error("Speech recognition error:", e);
        }
    }
});