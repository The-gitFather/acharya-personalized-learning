// popup.js
// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get references to all required DOM elements
  const captureBtn = document.getElementById('capture-btn');
  const processBtn = document.getElementById('process-btn');
  const promptInput = document.getElementById('prompt-input');
  const resultOutput = document.getElementById('result-output');
  const capturedImage = document.getElementById('captured-image');
  const noImageText = document.getElementById('no-image');
  const loading = document.getElementById('loading');
  
  // Check if all elements exist to prevent null reference errors
  if (!captureBtn || !processBtn || !promptInput || !resultOutput || 
      !capturedImage || !noImageText || !loading) {
    console.error('One or more DOM elements are missing. Check your HTML structure.');
    return; // Exit early if elements are missing
  }
  
  let imageData = null;

  // API key (in a real extension, this should be securely stored or fetched from an authenticated backend)
  const API_KEY = process.env.API_KEY;
;

  // Capture screenshot of current tab
  captureBtn.addEventListener('click', () => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        showError('Failed to capture screenshot: ' + chrome.runtime.lastError.message);
        return;
      }
      
      imageData = dataUrl;
      capturedImage.src = dataUrl;
      capturedImage.style.display = 'block';
      noImageText.style.display = 'none';
      processBtn.disabled = false;
    });
  });

  // Process image with Gemini
  processBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    
    if (!imageData) {
      showError('Please capture an image first');
      return;
    }
    
    if (!prompt) {
      showError('Please enter a prompt');
      return;
    }
    
    try {
      loading.style.display = 'flex';
      resultOutput.innerHTML = '';
      
      const result = await processImageWithGemini(imageData, prompt);
      
      loading.style.display = 'none';
      resultOutput.innerHTML = `<p>${formatResult(result)}</p>`;
    } catch (error) {
      loading.style.display = 'none';
      showError(`Error: ${error.message}`);
    }
  });

  // Process image with Gemini API
  async function processImageWithGemini(imageData, prompt) {
    try {
      // Convert base64 data URL to Blob
      const imageBlob = dataURLtoBlob(imageData);
      
      // Directly use the Google Generative AI library
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('prompt', 'you are bot which helps students with doubt solving. you are being used in a chrom extension and the user upload the photo of their current screen and asks you to clear the doubt they faced on the current screen. send plain text dont send markdown. the user will send you the question and you will answer it. you will use the image to solve the doubt. the answer will be in plain text. dont use any other information. answer the question in the best way possible. if you dont know the answer, say "i don\'t know" and dont answer anything else. if you have no idea about the question, say "i don\'t know" and dont answer anything else.' + prompt);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: imageData.split(',')[1]  // Remove the data URL prefix
                  }
                }
              ]
            }
          ],
          generation_config: {
            temperature: 0.4,
            max_output_tokens: 2048
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to process with Gemini');
      }
      
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(handleGeminiError(error));
    }
  }

  // Helper function to convert data URL to Blob
  function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  // Handle Gemini API errors
  function handleGeminiError(error) {
    // Handle specific error cases from the image
    if (error.message.includes('script-src') || error.message.includes('Content Security Policy')) {
      return 'Extension CSP issue. Using direct API call instead.';
    }
    if (error.message.includes('NetworkError') || error.message.includes('Failed to execute')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message.includes('TypeError')) {
      return 'Type error. Please try again.';
    }
    return error.message || 'An unknown error occurred';
  }

  // Format the result text with proper line breaks and styling
  function formatResult(text) {
    return text.replace(/\n/g, '<br>');
  }

  // Show error message
  function showError(message) {
    console.error(message);
    
    // Make sure resultOutput exists
    if (!resultOutput) return;
    
    // Remove any existing error message
    const existingError = resultOutput.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    resultOutput.appendChild(errorElement);
  }
});

// Add this code to verify that all permissions are correctly set
chrome.runtime.getPlatformInfo(function(info) {
  console.log('Chrome extension running on: ', info.os);
});