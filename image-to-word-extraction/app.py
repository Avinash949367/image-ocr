from flask import Flask, request, jsonify, send_from_directory
import os
import sys
import cv2
import numpy as np
from PIL import Image
import pytesseract
from werkzeug.utils import secure_filename

# Add the nested folder to path so we can import from it
sys.path.append(os.path.join(os.path.dirname(__file__), 'image-to-word-extraction'))

# Configure Tesseract OCR path
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = Flask(__name__, static_folder='.')

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    """Preprocess the image for better OCR results"""
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    return thresh

def extract_text(image_path):
    """Extract text from image using Tesseract OCR"""
    img = Image.open(image_path)
    return pytesseract.image_to_string(img)

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)"""
    return send_from_directory('.', filename)

@app.route('/api/extract-text', methods=['POST'])
def extract_text_api():
    """API endpoint to extract text from uploaded image"""
    try:
        # Check if file is in the request
        if 'image' not in request.files:
            print("No image file provided")
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        # Check if filename is valid
        if file.filename == '':
            print("No selected file")
            return jsonify({'error': 'No selected file'}), 400
        
        if not allowed_file(file.filename):
            print(f"Invalid file type: {file.filename}")
            return jsonify({'error': 'Invalid file type. Allowed types: png, jpg, jpeg, webp, bmp'}), 400
        
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Process the image and extract text
            processed = preprocess_image(filepath)
            processed_path = os.path.join(app.config['UPLOAD_FOLDER'], f"processed_{filename}")
            cv2.imwrite(processed_path, processed)
            text = extract_text(processed_path)
            
            # Debugging log for extracted text
            print(f"Extracted text: {text}")
            
            # Return the extracted text
            return jsonify({
                'success': True,
                'text': text,
                'message': 'Text extracted successfully'
            })
            
        finally:
            # Clean up - remove the uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
            if os.path.exists(processed_path):
                os.remove(processed_path)
                
    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error processing image'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Image to Text API is running'
    })

if __name__ == '__main__':
    print("=" * 50)
    print("Starting Image to Text Extraction API...")
    print("=" * 50)
    print("\nAPI Endpoints:")
    print("  - GET  /                 : Main page")
    print("  - GET  /api/health       : Health check")
    print("  - POST /api/extract-text : Extract text from image")
    print("\n" + "=" * 50)
    print("Server running on http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
