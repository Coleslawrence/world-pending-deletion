"""Bundle the game into one self-contained HTML file (for sharing as a single file or a Claude artifact).

Usage: python3 tools/build-single.py   ->   dist/world-pending-deletion.html
"""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda p: open(os.path.join(ROOT, p), encoding='utf-8').read()
html = read('index.html')
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + read('css/style.css') + '</style>')
# the content files, then the engine
html = re.sub(r'<script src="(js/content/[^"]+|js/core\.js)"></script>', lambda m: '<script>\n' + read(m.group(1)) + '</script>', html)
html = html.replace('<script src="js/notes.js"></script>', '<script>\n' + read('js/notes.js') + '</script>')
html = html.replace('<script src="js/ui.js"></script>', '<script>\n' + read('js/ui.js') + '</script>')
# drop the web-app-only parts
html = re.sub(r'<link rel="manifest"[^>]*>\n', '', html)
html = re.sub(r'<link rel="(icon|apple-touch-icon)"[^>]*>\n', '', html)
html = re.sub(r'<script>\n  // Installable web app.*?</script>\n', '', html, flags=re.S)
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'world-pending-deletion.html')
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html))
