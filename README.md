# Spotify Listening Stats

A web app that visualizes your Spotify listening history, top tracks, and top artists using the Spotify Web API.

## Features

- **Recent History** — Charts showing your listening patterns by hour of day and most played artists. Includes a scrollable list of your 50 most recently played tracks.
- **Top Tracks** — Your top 20 tracks ranked by Spotify, with a popularity chart. Switchable between last 4 weeks, last 6 months, and all time.
- **Top Artists** — Your top 20 artists ranked by Spotify, with genres and popularity. Same time range options as top tracks.

## Setup

### 1. Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new app.
2. In the app settings, add `http://127.0.0.1:5000/callback` as a **Redirect URI** and save.
3. Copy your **Client ID** and **Client Secret**.

### 2. Install dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run the app

```bash
source venv/bin/activate
python app.py
```

### 4. Enter your credentials

Open `http://127.0.0.1:5000` in your browser. You will be prompted to enter your **Client ID** and **Client Secret** from the Spotify Developer Dashboard. The exact redirect URI you need to register is shown on that screen.

Once submitted, click **Connect with Spotify** to authorize the app and view your stats.

To switch to a different Spotify account or app, click **Change credentials** in the top right corner.

## Tech Stack

- **Backend:** Python, Flask, Spotipy
- **Frontend:** HTML/CSS, Chart.js
- **Auth:** Spotify OAuth 2.0

## GitHub Actions Deployment

The workflow in `.github/workflows/ci-cd.yml` runs the app's smoke tests for pull requests and pushes to `main`. A successful push to `main` is deployed to Railway.

To enable deployment, add a Railway project token as the `RAILWAY_TOKEN` GitHub Actions secret and set the `RAILWAY_SERVICE_NAME` repository variable to the target Railway service name. The Railway project token selects the project and environment. Set `SPOTIPY_CLIENT_ID`, `SPOTIPY_CLIENT_SECRET`, and `FLASK_SECRET_KEY` as Railway service variables; use the deployed app's `/callback` URL as the Spotify redirect URI.
