from flask import Flask, request, jsonify, send_from_directory
import os
import sys
from PIL import Image
from werkzeug.utils import secure_filename
import traceback

# Add the nested folder to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'image-to-word-extraction'))

# Try to import EasyOCR - pure Python OCR solution
try:
    import easyocr
    OCR_AVAILABLE = True
    print("[OK] EasyOCR is available - Real text extraction enabled")
except Exception as e:
    print(f"[WARNING] EasyOCR not available: {e}")
    OCR_AVAILABLE = False

# Initialize reader once to avoid repeated initialization
ocr_reader = None
if OCR_AVAILABLE:
    try:
        print("[INIT] Loading OCR model (this may take a minute on first run)...")
        ocr_reader = easyocr.Reader(['en'])
        print("[OK] OCR model loaded successfully")
    except Exception as e:
        print(f"[ERROR] Failed to load OCR model: {e}")
        ocr_reader = None
        OCR_AVAILABLE = False

app = Flask(__name__, static_folder='.')

# Add CORS and CSP headers
@app.after_request
def add_cors_headers(response):
    """Add CORS and CSP headers to all responses"""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    
    # Add Content Security Policy headers to allow local connections and fonts
    response.headers['Content-Security-Policy'] = (
        "default-src 'self' http://127.0.0.1:5000 http://localhost:5000; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' http://127.0.0.1:5000 http://localhost:5000; "
        "img-src 'self' data:; "
        "frame-src 'self'"
    )
    
    return response

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'bmp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Create uploads folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_image(image_path):
    """Extract text from image using EasyOCR"""
    try:
        # Validate file exists and is readable
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        # Open image with PIL to verify it's valid
        img = Image.open(image_path)
        img.verify()
        img = Image.open(image_path)  # Need to reopen after verify
        
        # If OCR is not available, return demo text
        if not OCR_AVAILABLE or ocr_reader is None:
            print("[INFO] OCR not available, returning demo text")
            demo_text = "DEMO MODE: EasyOCR not loaded.\n\n"
            demo_text += "This is sample extracted text. EasyOCR will work once initialized.\n"
            demo_text += "The model is downloading on first run (~200MB).\n"
            demo_text += "Please try again in a moment."
            return demo_text
        
        # Try to extract text using EasyOCR
        try:
            print(f"[OCR] Extracting text from {image_path}...")
            results = ocr_reader.readtext(image_path)
            
            # Combine all detected text
            extracted_text = '\n'.join([text[1] for text in results])
            
            if extracted_text.strip():
                print(f"[OCR] Successfully extracted {len(extracted_text)} characters")
                return extracted_text.strip()
            else:
                return "[No text detected in image]"
                
        except Exception as ocr_error:
            print(f"[WARNING] OCR extraction failed: {ocr_error}")
            # Fallback to demo text
            demo_text = "OCR extraction attempted but failed.\n\n"
            demo_text += f"Error: {str(ocr_error)}\n\n"
            demo_text += "Possible causes:\n"
            demo_text += "- Image quality too low\n"
            demo_text += "- No text in image\n"
            demo_text += "- Unsupported language"
            return demo_text
        
    except Exception as e:
        print(f"[ERROR] Error extracting text: {e}")
        raise

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)"""
    return send_from_directory('.', filename)

@app.route('/api/extract-text', methods=['POST', 'OPTIONS'])
def extract_text_api():
    """Extract text from uploaded image"""
    # Handle OPTIONS request (CORS preflight)
    if request.method == 'OPTIONS':
        return '', 200
    
    filepath = None
    
    try:
        # Validate request
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image file in request'
            }), 400
        
        file = request.files['image']
        
        if not file or file.filename == '':
            return jsonify({
                'success': False,
                'message': 'No file selected'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'Invalid file type. Allowed: jpg, png, webp, bmp'
            }), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            file.save(filepath)
            print(f"[OK] File saved: {filename}")
        except Exception as save_error:
            print(f"[ERROR] Failed to save file: {save_error}")
            return jsonify({
                'success': False,
                'message': f'Failed to save file: {str(save_error)}'
            }), 500
        
        # Extract text from image
        try:
            text = extract_text_from_image(filepath)
            print(f"[OK] Text extracted successfully ({len(text)} chars)")
            
            return jsonify({
                'success': True,
                'text': text,
                'message': 'Text extracted successfully'
            }), 200
            
        except Exception as extract_error:
            error_msg = str(extract_error)
            print(f"[ERROR] Extraction failed: {error_msg}")
            return jsonify({
                'success': False,
                'message': f'Error extracting text: {error_msg}'
            }), 500
    
    except Exception as e:
        print(f"[FATAL ERROR] {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Unexpected error: {str(e)}'
        }), 500
    
    finally:
        # Clean up - delete uploaded file
        if filepath and os.path.exists(filepath):
            try:
                os.remove(filepath)
                print(f"[OK] Cleaned up: {filename}")
            except Exception as cleanup_error:
                print(f"[WARNING] Could not delete file: {cleanup_error}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'tesseract_available': TESSERACT_AVAILABLE,
        'mode': 'demo' if not TESSERACT_AVAILABLE else 'production'
    }), 200

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print(" " * 15 + "IMAGE TO TEXT EXTRACTION - OCR APPLICATION")
    print("=" * 70)
    print(f"\nMode: {'DEMO (Tesseract not installed)' if not TESSERACT_AVAILABLE else 'PRODUCTION (Tesseract available)'}")
    print(f"Upload Folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print("\nServer Information:")
    print(f"  Host: 127.0.0.1")
    print(f"  Port: 5000")
    print(f"  URL: http://127.0.0.1:5000")
    print("\nAPI Endpoints:")
    print(f"  GET  /                    - Main web interface")
    print(f"  POST /api/extract-text    - Upload and extract text")
    print(f"  GET  /api/health          - Health check")
    print("\n" + "=" * 70)
    print("Server starting... Press Ctrl+C to stop\n")
    
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
