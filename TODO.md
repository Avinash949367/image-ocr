# TODO - Fix Server and Image Upload Issues

## Plan:

### Step 1: Install Dependencies
- Install required Python packages: flask, opencv-python, Pillow, numpy, pytesseract

### Step 2: Check/Install Tesseract OCR
- Verify Tesseract OCR is installed on the system
- If not installed, the app will run in demo mode (showing sample text)

### Step 3: Start the Flask Server
- Run `python run_server.py` or `python app.py` from the image-to-word-extraction directory
- Server should start on http://127.0.0.1:5000

### Step 4: Test the Server
- Access http://127.0.0.1:5000 in the browser
- The frontend should load
- Try uploading an image

### Step 5: If Issues Persist
- Check for CORS issues
- Verify the API endpoint is working by accessing http://127.0.0.1:5000/api/health

## Commands to run:
```
bash
# Navigate to the project directory
cd image-to-word-extraction

# Install dependencies
pip install flask opencv-python Pillow numpy pytesseract

# Start the server
python run_server.py
```

## Notes:
- The server must be running for the image upload to work
- Open http://127.0.0.1:5000 in your browser (not the file directly)
- If uploading doesn't work, check browser console for errors
