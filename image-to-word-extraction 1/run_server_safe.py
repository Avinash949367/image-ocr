#!/usr/bin/env python3
"""
Safe Flask Server Launcher - handles Windows encoding issues
"""
import os
import sys
import io

# Fix encoding for Windows
if sys.platform == 'win32':
    # Set UTF-8 for stdout/stderr
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')

# Change to the correct directory
os.chdir(r'..\image-to-word-extraction')

# Add to path
sys.path.insert(0, os.getcwd())

if __name__ == '__main__':
    try:
        from app import app
        print("[SUCCESS] Flask app loaded successfully!")
        print("[INFO] Starting server on http://127.0.0.1:5000")
        print("[INFO] Press Ctrl+C to stop the server\n")
        
        # Run the app
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=False,
            use_reloader=False,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
