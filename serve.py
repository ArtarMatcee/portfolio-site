#!/usr/bin/env python3
"""Tiny static server for previewing the whole portfolio site locally.

Serves the site root, so /projects/actorstock/ and friends resolve exactly as
they would on GitHub Pages, Netlify, Vercel or S3. Also accepts the
extensionless form (/projects/actorstock) by redirecting to the trailing-slash
URL, which is what those hosts do too.
"""
import functools
import http.server
import os
import socketserver

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 4180


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        # /projects/actorstock -> /projects/actorstock/, keeping any query string.
        parts = self.path.split("?", 1)
        if os.path.isdir(self.translate_path(self.path)) and not parts[0].endswith("/"):
            parts[0] += "/"
            self.send_response(301)
            self.send_header("Location", "?".join(parts))
            self.end_headers()
            return None
        return super().send_head()

    def end_headers(self):
        # never cache during local preview
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
handler = functools.partial(Handler, directory=ROOT)
with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
    print(f"serving {ROOT} on http://127.0.0.1:{PORT}")
    httpd.serve_forever()
