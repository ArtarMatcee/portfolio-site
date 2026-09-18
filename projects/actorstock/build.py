#!/usr/bin/env python3
"""Generate capture.html and dist/artifact.html from index.html.

index.html is the source of truth and the page the site actually serves.

  capture.html         index.html plus Figma's html-to-design capture script.
                       Kept as a separate file so the shipped page never loads a
                       third-party script. Open it with `?capture=1` and the
                       `#figmacapture=...` hash Figma hands you.

  dist/artifact.html   the same page in Claude Artifact format. The Artifact host
                       supplies its own <!doctype>/<html>/<head>/<body> wrapper,
                       so this keeps only the <title>, the stylesheet links and
                       the body.

`?capture=1` renders the page as one flat static document suitable for a Figma
frame: main.js expands all six feature panels, hides the tablist, unpins the
journey so every step shows its own screen, disables scroll-reveal and forces
every lazy image to eager; the shared site shell (shell.css + shell.js) hides
the portfolio header, the section menu, "Explore more work" and the footer.

capture.html used to be maintained by hand, which meant it went stale the moment
index.html changed. Run this after every edit to index.html.
"""
import os
import pathlib
import re

FIGMA_CAPTURE = '<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>'

root = pathlib.Path(__file__).parent
src = (root / "index.html").read_text(encoding="utf-8")

# --- capture.html ---------------------------------------------------------- #
if FIGMA_CAPTURE in src:
    raise SystemExit("index.html already carries the Figma capture script — remove it.")

capture = src.replace("</body>", FIGMA_CAPTURE + "\n</body>", 1)
if capture == src:
    raise SystemExit("index.html has no </body> to insert the capture script before.")
(root / "capture.html").write_text(capture, encoding="utf-8")
print("capture.html       ", os.path.getsize(root / "capture.html"), "bytes")

# --- dist/artifact.html ---------------------------------------------------- #
title = re.search(r"<title>.*?</title>", src, re.S).group(0)
links = re.findall(r'<link rel="(?:preconnect|stylesheet)"[^>]*>', src)
body = re.search(r"<body>(.*)</body>", src, re.S).group(1).strip()

out = root / "dist"
out.mkdir(exist_ok=True)
(out / "artifact.html").write_text(
    title + "\n" + "\n".join(links) + "\n\n" + body + "\n", encoding="utf-8"
)
print("dist/artifact.html ", os.path.getsize(out / "artifact.html"), "bytes")
