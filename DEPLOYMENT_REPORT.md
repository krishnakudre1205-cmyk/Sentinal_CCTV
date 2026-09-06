# SentinelFusion AI — Render Backend & Vercel Deployment Report

**Project Name**: SentinelFusion AI  
**Repository Path**: `D:\GJ_P`  
**GitHub Repository**: `https://github.com/krishnakudre1205-cmyk/Sentinal_CCTV`  
**Git Release Commit**: `0d577e7`  
**Date**: September 6, 2026  

---

## 1. System Architecture & Topology

```
                  +-------------------------------------------------+
                  |            Vercel Frontend (SPA)                |
                  |     https://frontend-mauve-two-o07mq4dunt.     |
                  |                   vercel.app                    |
                  +------------------------+------------------------+
                                           |
                                           | HTTPS REST & WSS
                                           v
                  +-------------------------------------------------+
                  |            Render Web Service Backend           |
                  |    https://sentinelfusion-backend.onrender.com  |
                  +------------------------+------------------------+
                                           |
                         +-----------------+-----------------+
                         |                                   |
                         v                                   v
         +-------------------------------+   +----------------------------------+
         |     SQLite / PostgreSQL DB    |   | Headless OpenCV + YOLOv8 + OCR   |
         +-------------------------------+   +----------------------------------+
```

---

## 2. Platform Status Matrix

| Component | Target Platform | Deployment URL / Status | Status |
| :--- | :--- | :--- | :---: |
| **Frontend UI** | Vercel | `https://frontend-mauve-two-o07mq4dunt.vercel.app` | 🟢 **LIVE / READY** |
| **Backend Core** | Render | `https://sentinelfusion-backend.onrender.com` | 🟡 **REPOSITORY PREPARED & PUSHED** |
| **Blueprint Config** | Repository | [`render.yaml`](file:///D:/GJ_P/render.yaml) | 🟢 **CREATED & PUSHED** |
| **GitHub Repo** | GitHub | `https://github.com/krishnakudre1205-cmyk/Sentinal_CCTV` | 🟢 **PUSHED (`0d577e7`)** |

---

## 3. Render Web Service Blueprint (`render.yaml`)

```yaml
services:
  - type: web
    name: sentinelfusion-backend
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: CORS_ORIGINS
        value: https://frontend-mauve-two-o07mq4dunt.vercel.app
      - key: FRONTEND_URL
        value: https://frontend-mauve-two-o07mq4dunt.vercel.app
      - key: ENVIRONMENT
        value: production
      - key: DEBUG
        value: "False"
      - key: PYTHON_VERSION
        value: 3.10.12
```

---

## 4. Render Environment Variables Checklist

Enter these environment variables in your Render Dashboard Web Service settings:

| Key | Value | Description |
| :--- | :--- | :--- |
| `CORS_ORIGINS` | `https://frontend-mauve-two-o07mq4dunt.vercel.app` | Allows cross-origin requests from Vercel frontend |
| `FRONTEND_URL` | `https://frontend-mauve-two-o07mq4dunt.vercel.app` | Secondary CORS origin fallback |
| `ENVIRONMENT` | `production` | Production environment flag |
| `PYTHON_VERSION` | `3.10.12` | Python runtime version |
| `DEBUG` | `False` | Disables debug mode for production |

---

## 5. Step-by-Step Instructions to Deploy Backend on Render

1. Log into your Render Dashboard at [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprints** (or **Web Service**).
3. Connect your GitHub repository: `krishnakudre1205-cmyk/Sentinal_CCTV`.
4. Render will automatically detect [`render.yaml`](file:///D:/GJ_P/render.yaml) blueprint!
5. Click **Apply** (or create Web Service with Name: `sentinelfusion-backend`, Root Directory: `backend`, Build Command: `pip install -r requirements.txt`, Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
6. Once deployed, copy your live Render URL (e.g. `https://sentinelfusion-backend.onrender.com`).
7. Test the health endpoint: `https://sentinelfusion-backend.onrender.com/health`.

---

## 6. Step-by-Step Instructions to Connect Vercel Frontend to Render Backend

1. Open your Vercel Dashboard at [https://vercel.com](https://vercel.com) for project `frontend-mauve-two-o07mq4dunt`.
2. Go to **Settings** → **Environment Variables**.
3. Add or update:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://<YOUR-RENDER-BACKEND-DOMAIN>.onrender.com`
4. Click **Save**.
5. Go to **Deployments** → Select latest deployment → Click **Redeploy**.
