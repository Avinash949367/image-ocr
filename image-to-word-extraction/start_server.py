#!/usr/bin/env python3
"""
Image OCR Server Launcher
This script starts the Flask server for the Image-to-Text extraction application
"""
import os
import sys

# Change to the correct directory
os.chdir(r'c:\Users\jahna\Desktop\CCBD\image-ocr\image-to-word-extraction')

# Add to path
sys.path.insert(0, os.getcwd())

if __name__ == '__main__':
    try:
        from app import app
        print("\n[SUCCESS] Flask app loaded successfully!")
        print("[INFO] Starting server on http://127.0.0.1:5000\n")
        
        # Run the app
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=False,
            use_reloader=False,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n\n[INFO] Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
