#!/usr/bin/env python3
"""Actualiza las coreografías del sitio a partir de un JSON exportado del editor.

Uso:  python3 tools/actualizar_coreografias.py ruta/al/archivo.json [editor.html]

- Saca las músicas incrustadas (base64) a coreografias/musica/*.mp3
- Escribe coreografias/coreo.json, liviano, que apunta a esos archivos
- Si se pasa un editor.html nuevo, lo copia como coreografias/index.html
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "coreografias")
BOOT = "<script>/* Che, on danse!: carga automática */window.addEventListener('load',()=>{fetch('coreo.json',{cache:'no-cache'}).then(r=>r.json()).then(d=>{if(d&&d.figures&&d.figures.length)restoreExportData(d);}).catch(e=>console.error(e));});</script>"

def main(src, editor=None):
    data = json.load(open(src, encoding="utf-8"))
    os.makedirs(os.path.join(OUT, "musica"), exist_ok=True)
    refs = data.setdefault("mediaRefs", {}).setdefault("audio", {})
    for idx, url in (data.get("media", {}).get("audio") or {}).items():
        m = re.match(r"data:audio/([\w.+-]+);base64,(.*)", url, re.S)
        if not m:
            continue
        ext = {"mpeg": "mp3", "mp3": "mp3", "ogg": "ogg", "wav": "wav", "x-wav": "wav", "mp4": "m4a", "aac": "aac", "webm": "webm"}.get(m.group(1), "mp3")
        name = f"musica/figura_{int(idx) + 1}.{ext}"
        open(os.path.join(OUT, name), "wb").write(base64.b64decode(m.group(2)))
        refs[idx] = name
    # referencias locales del editor (media/...) que no existen aquí: se quitan
    for idx in list(refs):
        if not refs[idx].startswith(("musica/", "http")):
            del refs[idx]
    data.pop("media", None)
    data.pop("workingState", None)
    json.dump(data, open(os.path.join(OUT, "coreo.json"), "w", encoding="utf-8"), ensure_ascii=False)
    if editor:
        html = open(editor, encoding="utf-8").read()
        html = html.replace("</body>", BOOT + "\n</body>", 1) if "</body>" in html else html + BOOT
        open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(html)
    print("Figuras:", [f.get("name") for f in data["figures"]])
    print("Músicas:", refs)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
