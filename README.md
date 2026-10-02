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

### Optional: configure credentials with environment variables

Instead of entering credentials in the browser, you can set these values in your shell or a `.env` file before starting the app:

```bash
export SPOTIPY_CLIENT_ID="your-client-id"
export SPOTIPY_CLIENT_SECRET="your-client-secret"
export FLASK_SECRET_KEY="your-secret-key"
```

The app will use these automatically when present. This is also useful for deployed environments such as Elastic Beanstalk.

### Troubleshooting

- If Spotify login fails after switching apps or accounts, use **Change credentials** or **Log out** in the top-right menu to clear the saved session and cached token data.
- If the redirect URI does not match, confirm the exact callback URL shown in the app and register that value in the Spotify Developer Dashboard.
- If you are testing locally, make sure the app is running on `http://127.0.0.1:5000` and that the same URL is registered in your Spotify app settings.

## Tech Stack

- **Backend:** Python, Flask, Spotipy
- **Frontend:** HTML/CSS, Chart.js
- **Auth:** Spotify OAuth 2.0

## GitHub Actions Deployment to AWS

The workflow in `.github/workflows/ci-cd.yml` runs the app's smoke tests for pull requests and pushes to `main`. A successful push to `main` is packaged and deployed to the configured AWS Elastic Beanstalk environment. The Python platform installs dependencies from `requirements.txt` and runs Gunicorn on port 8000 as specified in the `Procfile`.

To enable deployment:

1. Create an Elastic Beanstalk application and Python environment, plus an S3 bucket in the same AWS region for deployment bundles.
2. Create an IAM role trusted by GitHub Actions through OpenID Connect (OIDC), restricted to this repository's `main` branch. Grant it permission to upload objects to the deployment bucket and create application versions, update the environment, and describe the environment in Elastic Beanstalk. Also allow the Elastic Beanstalk environment's service role to read objects from the deployment bucket.
3. Add these repository variables in GitHub settings:
	- `AWS_ROLE_TO_ASSUME`: the IAM role ARN.
	- `AWS_REGION`: the region containing the Elastic Beanstalk environment and S3 bucket.
	- `EB_APPLICATION_NAME`: the Elastic Beanstalk application name.
	- `EB_ENVIRONMENT_NAME`: the Elastic Beanstalk environment name.
	- `EB_S3_BUCKET`: the deployment bundle bucket name.
4. Set `SPOTIPY_CLIENT_ID`, `SPOTIPY_CLIENT_SECRET`, and `FLASK_SECRET_KEY` as environment properties for the Elastic Beanstalk environment.
5. Configure HTTPS for the environment and register its HTTPS `/callback` URL as a Spotify redirect URI.
