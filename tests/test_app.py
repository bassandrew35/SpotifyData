import unittest
from unittest.mock import patch

import app


class AppRouteTests(unittest.TestCase):
    def setUp(self):
        app.app.config["TESTING"] = True
        self.client = app.app.test_client()

    def test_index_renders_setup_without_credentials(self):
        with patch("app.get_credentials", return_value=(None, None)):
            response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Enter your Spotify app credentials", response.data)

    def test_setup_redirect_uri_uses_forwarded_https_scheme(self):
        with patch("app.get_credentials", return_value=(None, None)):
            response = self.client.get("/", headers={"X-Forwarded-Proto": "https"})

        self.assertIn(b"https://localhost/callback", response.data)

    def test_recently_played_requires_authentication(self):
        with patch("app.get_spotify_client", return_value=None):
            response = self.client.get("/api/recently-played")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json(), {"error": "Not authenticated"})


if __name__ == "__main__":
    unittest.main()