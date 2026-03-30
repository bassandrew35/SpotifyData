import os
from datetime import datetime

import spotipy
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from spotipy.oauth2 import SpotifyOAuth

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

SCOPE = "user-read-recently-played user-top-read user-read-playback-state"
CACHE_PATH = ".spotify_cache"


def get_redirect_uri():
    return url_for("callback", _external=True)


def get_credentials():
    """Return (client_id, client_secret) from session, falling back to env vars."""
    client_id = session.get("client_id") or os.getenv("SPOTIPY_CLIENT_ID")
    client_secret = session.get("client_secret") or os.getenv("SPOTIPY_CLIENT_SECRET")
    return client_id, client_secret


def get_spotify_oauth():
    client_id, client_secret = get_credentials()
    return SpotifyOAuth(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=get_redirect_uri(),
        scope=SCOPE,
        cache_path=CACHE_PATH,
        show_dialog=True,
    )


def get_spotify_client():
    token_info = session.get("token_info")
    if not token_info:
        return None
    sp_oauth = get_spotify_oauth()
    if sp_oauth.is_token_expired(token_info):
        token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
        session["token_info"] = token_info
    return spotipy.Spotify(auth=token_info["access_token"])


@app.route("/")
def index():
    client_id, client_secret = get_credentials()
    configured = bool(client_id and client_secret)

    if not configured:
        return render_template("index.html", state="setup", redirect_uri=get_redirect_uri())

    sp = get_spotify_client()
    if not sp:
        return render_template("index.html", state="login", redirect_uri=get_redirect_uri())

    user = sp.current_user()
    return render_template("index.html", state="dashboard", user=user)


@app.route("/setup", methods=["POST"])
def setup():
    session["client_id"] = request.form.get("client_id", "").strip()
    session["client_secret"] = request.form.get("client_secret", "").strip()
    return redirect(url_for("index"))


@app.route("/clear-credentials")
def clear_credentials():
    session.pop("client_id", None)
    session.pop("client_secret", None)
    session.pop("token_info", None)
    if os.path.exists(CACHE_PATH):
        os.remove(CACHE_PATH)
    return redirect(url_for("index"))


@app.route("/login")
def login():
    sp_oauth = get_spotify_oauth()
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)


@app.route("/callback")
def callback():
    sp_oauth = get_spotify_oauth()
    code = request.args.get("code")
    token_info = sp_oauth.get_access_token(code)
    session["token_info"] = token_info
    return redirect(url_for("index"))


@app.route("/logout")
def logout():
    session.pop("token_info", None)
    if os.path.exists(CACHE_PATH):
        os.remove(CACHE_PATH)
    return redirect(url_for("index"))


@app.route("/api/recently-played")
def recently_played():
    sp = get_spotify_client()
    if not sp:
        return jsonify({"error": "Not authenticated"}), 401

    results = sp.current_user_recently_played(limit=50)
    tracks = []
    for item in results["items"]:
        track = item["track"]
        played_at = datetime.fromisoformat(item["played_at"].replace("Z", "+00:00"))
        tracks.append({
            "id": track["id"],
            "name": track["name"],
            "artist": track["artists"][0]["name"],
            "artists": [a["name"] for a in track["artists"]],
            "album": track["album"]["name"],
            "album_image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
            "duration_ms": track["duration_ms"],
            "played_at": item["played_at"],
            "played_at_local": played_at.astimezone().isoformat(),
            "hour": played_at.astimezone().hour,
            "day": played_at.astimezone().strftime("%Y-%m-%d"),
            "day_of_week": played_at.astimezone().strftime("%A"),
            "url": track["external_urls"].get("spotify"),
        })
    return jsonify(tracks)


@app.route("/api/top-tracks")
def top_tracks():
    sp = get_spotify_client()
    if not sp:
        return jsonify({"error": "Not authenticated"}), 401

    time_range = request.args.get("time_range", "short_term")
    results = sp.current_user_top_tracks(limit=20, time_range=time_range)
    tracks = []
    for i, track in enumerate(results["items"]):
        tracks.append({
            "rank": i + 1,
            "name": track["name"],
            "artist": track["artists"][0]["name"],
            "album_image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
            "url": track["external_urls"].get("spotify"),
            "popularity": track["popularity"],
        })
    return jsonify(tracks)


@app.route("/api/top-artists")
def top_artists():
    sp = get_spotify_client()
    if not sp:
        return jsonify({"error": "Not authenticated"}), 401

    time_range = request.args.get("time_range", "short_term")
    results = sp.current_user_top_artists(limit=20, time_range=time_range)
    artists = []
    for i, artist in enumerate(results["items"]):
        artists.append({
            "rank": i + 1,
            "name": artist["name"],
            "genres": artist["genres"][:3],
            "image": artist["images"][0]["url"] if artist["images"] else None,
            "url": artist["external_urls"].get("spotify"),
            "popularity": artist["popularity"],
            "followers": artist["followers"]["total"],
        })
    return jsonify(artists)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
