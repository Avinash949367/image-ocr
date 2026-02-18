document.addEventListener('DOMContentLoaded', function() {
    console.log('[APP] Initializing Image OCR application...');
    
    // Configuration
    const CONFIG = {
        API_URL: 'http://127.0.0.1:5000/api/extract-text',
        MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'],
        ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.bmp']
    };

    // DOM Elements with null checks
    const elements = {
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('fileInput'),
        browseBtn: document.getElementById('browseBtn'),
        resultSection: document.getElementById('resultSection'),
        previewImage: document.getElementById('previewImage'),
        textOutput: document.getElementById('textOutput'),
        clearBtn: document.getElementById('clearBtn'),
        copyBtn: document.getElementById('copyBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        loadingIndicator: document.getElementById('loadingIndicator'),
        languageSelect: document.getElementById('languageSelect')
    };

    // Verify all required elements exist
    const missingElements = Object.entries(elements)
        .filter(([key, el]) => !el)
        .map(([key]) => key);
    
    if (missingElements.length > 0) {
        console.error('[ERROR] Missing DOM elements:', missingElements);
        return;
    }

    console.log('[OK] All DOM elements found');

    // Event Listeners
    elements.browseBtn.addEventListener('click', (e) => {
        console.log('[EVENT] Browse button clicked');
        e.preventDefault();
        elements.fileInput.click();
    });
    
    elements.fileInput.addEventListener('change', (e) => {
        console.log('[EVENT] File input changed');
        handleFileSelect(e);
    });
    
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.uploadArea.classList.add('drag-over');
        console.log('[EVENT] Drag over');
    });
    
    elements.uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.uploadArea.classList.remove('drag-over');
        console.log('[EVENT] Drag leave');
    });
    
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.uploadArea.classList.remove('drag-over');
        console.log('[EVENT] Drop detected');
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    elements.uploadArea.addEventListener('click', (e) => {
        if (e.target === elements.browseBtn) return;
        console.log('[EVENT] Upload area clicked');
        elements.fileInput.click();
    });
    
    elements.clearBtn.addEventListener('click', (e) => {
        console.log('[EVENT] Clear button clicked');
        e.preventDefault();
        clearAndReset();
    });
    
    elements.copyBtn.addEventListener('click', (e) => {
        console.log('[EVENT] Copy button clicked');
        e.preventDefault();
        copyText();
    });
    
    elements.downloadBtn.addEventListener('click', (e) => {
        console.log('[EVENT] Download button clicked');
        e.preventDefault();
        downloadText();
    });

    // File selection handler
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            console.log('[FILE] File selected:', file.name, file.size, file.type);
            handleFile(file);
        }
    }

    // Main file handler with comprehensive validation
    function handleFile(file) {
        console.log('[HANDLER] Starting file processing for:', file.name);

        try {
            // Validate file exists
            if (!file) {
                throw new Error('No file provided');
            }

            // Validate file size
            if (file.size === 0) {
                throw new Error('File is empty');
            }

            if (file.size > CONFIG.MAX_FILE_SIZE) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                throw new Error(`File too large (${sizeMB}MB). Maximum 5MB allowed.`);
            }

            console.log('[VALIDATION] File size OK:', (file.size / 1024).toFixed(2), 'KB');

            // Validate file type by MIME type
            if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
                console.warn('[VALIDATION] MIME type check failed:', file.type);
                console.log('[VALIDATION] Checking extension instead...');
                
                const extension = '.' + file.name.split('.').pop().toLowerCase();
                if (!CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
                    throw new Error(`Invalid file type. Allowed: ${CONFIG.ALLOWED_EXTENSIONS.join(', ')}`);
                }
            }

            console.log('[VALIDATION] File type OK:', file.type);

            // Show image preview immediately
            showImagePreviewImmediately(file);

            // All validations passed
            uploadFile(file);

        } catch (error) {
            console.error('[ERROR] File validation failed:', error.message);
            showError(error.message);
        }
    }

    // Show image preview immediately when file is selected
    function showImagePreviewImmediately(file) {
        console.log('[PREVIEW] Showing image preview immediately for:', file.name);
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            console.log('[PREVIEW] Image loaded as data URL, length:', e.target.result.length);
            elements.previewImage.src = e.target.result;
            elements.previewImage.alt = file.name;
            elements.previewImage.style.display = 'block';
            elements.previewImage.style.width = '100%';
            elements.previewImage.style.height = 'auto';
            elements.resultSection.style.display = 'grid';
            console.log('[PREVIEW] Preview element src set:', !!elements.previewImage.src);
            console.log('[PREVIEW] Preview displayed');
        };
        
        reader.onerror = function(error) {
            console.error('[PREVIEW ERROR]', error);
            elements.previewImage.alt = 'Preview unavailable';
        };
        
        reader.readAsDataURL(file);
    }

    // Upload file to backend
    function uploadFile(file) {
        console.log('[UPLOAD] Starting upload process...');

        try {
            // Validate API URL
            if (!CONFIG.API_URL) {
                throw new Error('API URL not configured');
            }

            // Show loading state
            showLoading(true);
            elements.resultSection.style.display = 'none';

            // Create FormData
            const formData = new FormData();
            formData.append('image', file);
            
            // Get selected language
            const selectedLanguage = elements.languageSelect ? elements.languageSelect.value : 'en';
            formData.append('language', selectedLanguage);
            console.log('[UPLOAD] Language selected:', selectedLanguage);

            console.log('[UPLOAD] FormData created, sending to:', CONFIG.API_URL);

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            // Send request with proper error handling
            fetch(CONFIG.API_URL, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            })
            .then(response => {
                clearTimeout(timeoutId);
                console.log('[RESPONSE] Status:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                
                return response.json().catch(e => {
                    console.error('[RESPONSE] Failed to parse JSON:', e);
                    throw new Error('Invalid response format from server');
                });
            })
            .then(data => {
                console.log('[RESPONSE] JSON parsed:', data);

                if (!data) {
                    throw new Error('Empty response from server');
                }

                if (data.success === false) {
                    throw new Error(data.message || 'Unknown server error');
                }

                if (!data.text) {
                    throw new Error('No extracted text in response');
                }

                // Success - display results
                displayResults(file, data.text);

            })
            .catch(error => {
                clearTimeout(timeoutId);
                
                if (error.name === 'AbortError') {
                    console.error('[FETCH ERROR] Request timeout (30s)');
                    showError('Request timeout - server took too long to respond');
                } else {
                    console.error('[FETCH ERROR]', error.message);
                    showError(`Upload failed: ${error.message}`);
                }
            })
            .finally(() => {
                showLoading(false);
            });

        } catch (error) {
            console.error('[UPLOAD ERROR]', error.message);
            showError(error.message);
            showLoading(false);
        }
    }

    // Display successful results
    function displayResults(file, extractedText) {
        console.log('[DISPLAY] Showing results for file:', file.name);
        console.log('[DISPLAY] Extracted text length:', extractedText.length);

        try {
            // Image preview already shown in showImagePreviewImmediately
            // Just update the extracted text
            
            // Display extracted text
            if (extractedText.trim()) {
                elements.textOutput.innerHTML = `<pre>${escapeHtml(extractedText)}</pre>`;
                console.log('[TEXT] Text displayed successfully');
            } else {
                elements.textOutput.innerHTML = '<p class="info-text">No text detected in image</p>';
                console.log('[TEXT] No text detected');
            }

            // Results section already shown, just ensure it's visible
            elements.resultSection.style.display = 'grid';
            console.log('[DISPLAY] Results section shown');

        } catch (error) {
            console.error('[DISPLAY ERROR]', error);
            showError('Error displaying results: ' + error.message);
        }
    }

    // Show/hide loading indicator
    function showLoading(show) {
        elements.loadingIndicator.style.display = show ? 'flex' : 'none';
        console.log('[LOADING]', show ? 'shown' : 'hidden');
    }

    // Show error message to user
    function showError(message) {
        console.error('[USER ERROR]', message);
        
        // Clear previous error if any
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${escapeHtml(message)}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Insert at top of main
        document.querySelector('main').insertBefore(errorDiv, document.querySelector('main').firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Clear and reset UI
    function clearAndReset() {
        console.log('[RESET] Clearing form and results');
        
        elements.fileInput.value = '';
        elements.previewImage.src = '';
        elements.previewImage.alt = 'Image preview';
        elements.textOutput.innerHTML = '<p class="placeholder-text">No text extracted yet</p>';
        elements.resultSection.style.display = 'none';
        elements.uploadArea.style.display = 'block';
        
        console.log('[RESET] Form cleared');
    }

    // Copy text to clipboard
    function copyText() {
        console.log('[COPY] Copying text to clipboard');
        
        try {
            const textContent = elements.textOutput.innerText;
            
            if (!textContent || textContent.length === 0) {
                showError('No text to copy');
                return;
            }

            navigator.clipboard.writeText(textContent)
                .then(() => {
                    console.log('[COPY] Success');
                    showCopyFeedback();
                })
                .catch(error => {
                    console.error('[COPY ERROR]', error);
                    showError('Failed to copy: ' + error.message);
                });
        } catch (error) {
            console.error('[COPY ERROR]', error);
            showError('Error copying text');
        }
    }

    // Show copy feedback
    function showCopyFeedback() {
        const originalHTML = elements.copyBtn.innerHTML;
        elements.copyBtn.innerHTML = '✓ Copied!';
        elements.copyBtn.style.backgroundColor = '#059669';
        
        setTimeout(() => {
            elements.copyBtn.innerHTML = originalHTML;
            elements.copyBtn.style.backgroundColor = '';
        }, 2000);
    }

    // Download text as file
    function downloadText() {
        console.log('[DOWNLOAD] Downloading text');
        
        try {
            const textContent = elements.textOutput.innerText;
            
            if (!textContent || textContent.length === 0) {
                showError('No text to download');
                return;
            }

            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', 'extracted_text.txt');
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            console.log('[DOWNLOAD] Success');
            
        } catch (error) {
            console.error('[DOWNLOAD ERROR]', error);
            showError('Error downloading file: ' + error.message);
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    console.log('[APP] Initialization complete - ready for image upload');
});
