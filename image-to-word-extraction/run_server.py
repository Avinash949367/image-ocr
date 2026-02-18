from app import app

if __name__ == '__main__':
    print("=" * 70)
    print(" " * 20 + "IMAGE TO TEXT EXTRACTION OCR")
    print("=" * 70)
    print("\nServer is starting...")
    print("Open your browser and go to: http://127.0.0.1:5000")
    print("\nPress Ctrl+C to stop the server\n")
    print("=" * 70 + "\n")
    
    try:
        app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
