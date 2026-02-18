#!/usr/bin/env python3
import sys
import traceback

try:
    print("Starting app...")
    from app import app
    print("App imported successfully!")
    print("Starting Flask server on 127.0.0.1:5000...")
    app.run(debug=False, host='127.0.0.1', port=5000, use_reloader=False)
except Exception as e:
    print(f"ERROR: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
    sys.exit(1)
