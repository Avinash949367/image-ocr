# Image OCR Application - Ready for Render Deployment

Your project is now configured for deployment on Render! Here's what was set up:

## Files Created/Updated at Root Level:

### Backend Configuration
- **`app.py`** - Flask application configured for Render:
  - Listens on all interfaces (`0.0.0.0`)
  - Uses `PORT` environment variable (set by Render)
  - Uses EasyOCR for text extraction
  - Supports English and Telugu languages

- **`Procfile`** - Render process file
  - Command: `web: gunicorn app:app`

- **`requirements.txt`** - Python dependencies with versions
  - Flask, Gunicorn, EasyOCR, PyTorch, OpenCV, Pillow, NumPy

### Frontend Files
- **`index.html`** - Web interface
- **`style.css`** - Responsive styling
- **`app.js`** - Client-side logic with relative API URL

### Configuration
- **`.gitignore`** - Git ignore file for Python/Flask projects

## Deployment Instructions:

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Render Service
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Select "Connect a repository" and authorize
4. Choose your GitHub repository
5. Configure:
   - **Name**: Choose your service name
   - **Region**: Select your region
   - **Branch**: `main`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

### Step 3: Deploy
- Click "Create Web Service"
- Render will automatically build and deploy your app
- Your app will be available at: `https://your-service-name.onrender.com`

## Important Notes:

1. **EasyOCR Model Download**: On the first request, EasyOCR will download language models (~200MB). This may take 2-5 minutes. Subsequent requests will be much faster.

2. **Port Configuration**: The app automatically uses the `PORT` environment variable that Render provides. No manual configuration needed.

3. **Relative URLs**: The JavaScript uses relative API URLs (`/api/extract-text`), so it works on any domain.

4. **Static Files**: Flask serves HTML, CSS, and JS files directly from the root directory.

## Troubleshooting:

If you see the error "Could not open requirements file", make sure:
- All files are in the root directory of your repository (not in a subfolder)
- Push all changes to GitHub before deploying
- Check that `requirements.txt` is at the root level

For more help: https://render.com/docs

---
Created: February 18, 2026
