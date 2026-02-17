document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const resultSection = document.getElementById('resultSection');
    const previewImage = document.getElementById('previewImage');
    const textOutput = document.getElementById('textOutput');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');

    // Event Listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== browseBtn) {
            fileInput.click();
        }
    });
    
    clearBtn.addEventListener('click', clearAndReset);
    copyBtn.addEventListener('click', copyText);
    downloadBtn.addEventListener('click', downloadText);

    // Handle File Selection
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    // Updated API URL to match the Flask server's address
    const API_URL = 'http://127.0.0.1:5000/api/extract-text';

    // Added debugging logs to trace execution flow
    function handleFile(file) {
        console.log('handleFile called with file:', file);

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid image file (JPG, PNG, WEBP, or BMP)');
            console.log('Invalid file type:', file.type);
            return;
        }

        console.log('Valid file type detected. Preparing to upload...');

        // Show loading indicator
        loadingIndicator.style.display = 'block';
        resultSection.style.display = 'none';

        // Create FormData to send the file to the backend
        const formData = new FormData();
        formData.append('image', file);

        console.log('Sending file to backend...');

        // Send the file to the backend
        fetch(API_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('Received response from backend:', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Backend response data:', data);
            if (data.success) {
                // Display the uploaded image
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImage.src = e.target.result;
                    console.log('Image preview updated.');
                };
                reader.readAsDataURL(file);

                // Display the extracted text
                textOutput.innerHTML = `<pre>${data.text}</pre>`;
                console.log('Extracted text displayed.');
            } else {
                alert(`Error: ${data.message}`);
                console.log('Error message from backend:', data.message);
            }
        })
        .catch(error => {
            console.error('Error during file upload or processing:', error);
            alert('An error occurred while processing the image.');
        })
        .finally(() => {
            // Hide loading, show results
            loadingIndicator.style.display = 'none';
            resultSection.style.display = 'grid';
            console.log('UI updated after processing.');
        });
    }

    // Clear and reset the interface
    function clearAndReset() {
        fileInput.value = '';
        previewImage.src = '';
        textOutput.innerHTML = '<p class="placeholder-text">Processing image... (Backend not connected)</p>';
        resultSection.style.display = 'none';
        uploadArea.style.display = 'block';
    }

    // Copy text to clipboard
    function copyText() {
        const text = textOutput.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ Copied!';
            copyBtn.style.backgroundColor = '#059669';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy text. Please try again.');
        });
    }

    // Download extracted text
    function downloadText() {
        const text = textOutput.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = 'extracted_text.txt';
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
});
