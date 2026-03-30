# Spotify Listening Stats

A web app that visualizes your Spotify listening history, top tracks, and top artists using the Spotify Web API.

## Features

- **Recent History** — Charts showing your listening patterns by hour of day, day of week, most played artists, and activity over the past days. Includes a scrollable list of your 50 most recently played tracks.
- **Top Tracks** — Your top 20 tracks ranked by Spotify, with a popularity chart. Switchable between last 4 weeks, last 6 months, and all time.
- **Top Artists** — Your top 20 artists ranked by Spotify, with genres and popularity. Same time range options as top tracks.

## Setup

### 1. Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create a new app.
2. In the app settings, add `http://127.0.0.1:5000/callback` as a **Redirect URI** and save.
3. Copy your **Client ID** and **Client Secret**.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```
SPOTIPY_CLIENT_ID=your_client_id
SPOTIPY_CLIENT_SECRET=your_client_secret
SPOTIPY_REDIRECT_URI=http://127.0.0.1:5000/callback
FLASK_SECRET_KEY=any_random_string
```

To generate a secure `FLASK_SECRET_KEY`:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Install dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Run the app

```bash
source venv/bin/activate
python app.py
```

Open `http://127.0.0.1:5000` in your browser and click **Connect with Spotify**.

## Tech Stack

- **Backend:** Python, Flask, Spotipy
- **Frontend:** HTML/CSS, Chart.js
- **Auth:** Spotify OAuth 2.0
