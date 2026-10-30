"""Convierte el export CSV de Tally («¿Quién viene a la clase del sábado?») en SQL para Supabase.

Solo importa a las personas con un DNI válido y su fecha de nacimiento: son las que
el formulario nuevo encuentra con «Ya tienen mis datos». Si una persona respondió
varias veces, queda la respuesta más reciente. Tally tenía un solo campo «Nombre y
apellido»: la última palabra se toma como apellido (revisar el CSV de control).

Uso:
    python3 tools/importar_tally.py export.csv salida.sql revisar.csv

El SQL y el CSV de revisión contienen DNI: no se suben al repositorio.
"""
import csv
import datetime
import re
import sys

COL_FECHA_ENVIO = "Submitted at"
COLS_NOMBRE = ["Nombre y apellido completo", "Nombre y apellido", "Nombre y apellido (2)"]
COL_DNI = "DNI"
COL_NACIMIENTO = "Fecha de nacimiento *"
PREFIJO_CONTACTO = "Dejanos un teléfono"


def limpiar(s):
    return re.sub(r"\s+", " ", (s or "").strip())


def dni_valido(s):
    d = re.sub(r"[^0-9A-Za-z]", "", s or "").upper()
    # DNI argentino (7-8 cifras) o pasaporte (letras y cifras, al menos 6 cifras)
    if re.fullmatch(r"\d{7,9}", d) or (6 <= len(d) <= 12 and len(re.sub(r"\D", "", d)) >= 6):
        return d
    return None


def nacimiento_valido(s):
    """aaaa-mm-dd entre 1915 y hace 3 años; si no, None."""
    try:
        d = datetime.date.fromisoformat(s.strip())
    except ValueError:
        return None
    hoy = datetime.date.today()
    return s.strip() if datetime.date(1915, 1, 1) <= d <= hoy.replace(year=hoy.year - 3) else None


def es_prueba(nombre_completo):
    return re.match(r"(essai|test|gpt)", nombre_completo.lower().replace(" ", "")) is not None


def separar(nombre_completo):
    """«María Inés Cámara» → («María Inés», «Cámara»). La última palabra es el apellido."""
    partes = limpiar(nombre_completo).split(" ")
    if len(partes) == 1:
        nombre, apellido = partes[0], ""
    else:
        nombre, apellido = " ".join(partes[:-1]), partes[-1]
    arreglar = lambda t: t.title() if t.islower() or t.isupper() else t
    return arreglar(nombre), arreglar(apellido)


def sql(s):
    return "null" if s in (None, "") else "'" + s.replace("'", "''") + "'"


def main(entrada, salida_sql, salida_revisar):
    filas = list(csv.DictReader(open(entrada, encoding="utf-8-sig")))
    col_contacto = next((c for c in filas[0] if c.startswith(PREFIJO_CONTACTO)), None)

    personas, descartadas = {}, []
    for f in sorted(filas, key=lambda f: f[COL_FECHA_ENVIO]):
        if not f.get(COL_DNI, "").strip():
            continue
        nombre_completo = next((limpiar(f[c]) for c in COLS_NOMBRE if limpiar(f.get(c))), "")
        dni = dni_valido(f[COL_DNI])
        nacimiento = nacimiento_valido(f.get(COL_NACIMIENTO, ""))
        if es_prueba(nombre_completo):
            descartadas.append((nombre_completo, f[COL_DNI], "Respuesta de prueba"))
            continue
        if not dni or not nacimiento or not nombre_completo:
            descartadas.append((nombre_completo, f[COL_DNI], "DNI, fecha de nacimiento o nombre inválido"))
            continue
        nombre, apellido = separar(nombre_completo)
        anterior = personas.get(dni, {})
        personas[dni] = {
            "nombre": nombre, "apellido": apellido, "dni": dni, "nacimiento": nacimiento,
            "contacto": limpiar(f.get(col_contacto)) or anterior.get("contacto", ""),
        }

    with open(salida_sql, "w", encoding="utf-8") as out:
        out.write("-- Che, on danse! · Paso 4: personas importadas de Tally\n")
        out.write("-- Se puede volver a ejecutar: no duplica a nadie (se reconoce por el DNI).\n")
        out.write("insert into public.personas (nombre, apellido, dni, fecha_nacimiento, contacto) values\n")
        out.write(",\n".join(
            f"  ({sql(p['nombre'])}, {sql(p['apellido'] or '?')}, {sql(p['dni'])}, "
            f"{sql(p['nacimiento'])}, {sql(p['contacto'])})"
            for p in personas.values()))
        out.write("\non conflict (dni) do update set\n"
                  "  nombre = excluded.nombre, apellido = excluded.apellido,\n"
                  "  fecha_nacimiento = excluded.fecha_nacimiento,\n"
                  "  contacto = coalesce(excluded.contacto, public.personas.contacto);\n")

    with open(salida_revisar, "w", encoding="utf-8-sig", newline="") as out:
        w = csv.writer(out, delimiter=";")
        w.writerow(["Importar", "Nombre", "Apellido", "DNI", "Fecha de nacimiento", "Contacto", "Nota"])
        repetidos = {}
        for p in personas.values():
            clave = (p["nombre"].lower(), p["apellido"][:1].lower())
            repetidos[clave] = repetidos.get(clave, 0) + 1
        for p in personas.values():
            nota = "Falta el apellido" if not p["apellido"] else ""
            if repetidos[(p["nombre"].lower(), p["apellido"][:1].lower())] > 1:
                nota = "Mismo nombre con otro DNI: ¿misma persona?"
            d = p["nacimiento"].split("-")
            w.writerow(["sí", p["nombre"], p["apellido"], p["dni"], f"{d[2]}/{d[1]}/{d[0]}", p["contacto"], nota])
        for nombre, dni, nota in descartadas:
            w.writerow(["no", nombre, "", dni, "", "", nota])

    print(f"{len(personas)} personas importadas, {len(descartadas)} respuestas descartadas.")


if __name__ == "__main__":
    main(*sys.argv[1:4])
