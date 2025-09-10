# DENDRO_FBB

**Autor:** DENDRO – Keith Fernández  
**Propiedad:** DENDRO | Intelligence  
**Eslogan:** *“Transformamos datos en decisiones.”*

**Recolecta todos los permalinks (posts / fotos / videos) del timeline de Facebook** hasta una **fecha de corte** específica, con **URLs limpias** y, cuando sea posible, en **formato canónico `pfbid…`** (un solo ID codificado).  
Incluye controles para pausar / reanudar / detener, exportar a CSV y heurísticas para no perder publicaciones (especialmente **fotos** y **videos**).

> ⚠️ **Uso responsable:** Emplea este snippet únicamente en tu propio contenido o con autorización expresa. Respeta las Condiciones de servicio de Facebook y la privacidad de terceros.

---

## ✨ Características

- Extrae permalinks desde tarjetas de feed: `div[role="article"]`, `article`, `div[data-pagelet*="FeedUnit"]`.
- Detecta anclas de fecha/hora y hace **scroll descendente** hasta alcanzar la **fecha de corte**.
- **Limpia** parámetros de tracking y navegación: `__cft__`, `__tn__`, `mibextid`, `ref`, `sfnsn`, `idorvanity`, `__eep__`, `__xts__`, `hoisted_section_ref`, `lst`, `comment_id`, `reply_comment_id`, `sk`, `locale`.
- Normaliza a **URL canónica** (en orden de preferencia):
  - `https://www.facebook.com/pfbid…` (ID único).
  - `…/posts/NUM`, `…/videos/NUM`, `…/reel/NUM`, `photo/?fbid=NUM`, o `?story_fbid=…`.
  - Compacta `/posts/{id}:{id} → /posts/{id}`.
  - Convierte `photo.php?fbid=… → /photo/?fbid=…`.
- Maneja fechas en español (incluye “setiembre”), corrige **años** al cruzar dic→ene durante el scroll.
- **Tecla `Esc`**: detiene y **descarga** CSV.
- Exporta CSV con: `date_iso`, `date_local`, `url`, `raw_label`.
- Heurísticas reforzadas para **fotos** y **videos** (varios selectores de _fallback_).
- Elimina caracteres de espacio fino/raros (evita casos tipo `15 de agosto a las 4:39â€¯pm` → se limpia a `15 de agosto a las 4:39 pm`).

---

## 📦 Salida

Se genera automáticamente un CSV llamado:
facebook_posts_hasta_YYYY-MM-DD.csv

---

Columnas:

- `date_iso` – ISO 8601 (UTC).
- `date_local` – Fecha/hora local del navegador.
- `url` – Permalink limpio/canónico.
- `raw_label` – Texto original de la etiqueta de fecha (sanitizado sin espacios raros - base58).

Puedes forzar la descarga manual con `fbScrape.dump()`.

---

## 🚀 Uso rápido

1. Abre el **timeline** del perfil/página en Facebook (mejor en `m.facebook.com` si el scroll va lento).
2. Abre **DevTools** → pestaña **Console**.
3. **Copia y pega** el snippet (abajo) y presiona **Enter**.
4. Espera a que alcance la fecha de corte (por defecto: **2025-03-30 23:59:59** hora local).  
   - El script hará **scrolls extra** tras alcanzar el cutoff para no perder publicaciones borde.
5. Al terminar, descarga el CSV automáticamente (o presiona `Esc` para detener y guardar en cualquier momento).

---

## 🕹️ Controles (Cheat-Sheet)

Estos comandos quedan expuestos en `window.fbScrape`:

```js
fbScrape.help();              // Ayuda breve en consola
fbScrape.status();            // Estado actual (contadores, año heurístico, etc.)

fbScrape.pause();             // Pausa el scroll/escaneo
fbScrape.resume();            // Reanuda si estaba en pausa
fbScrape.stop();              // Detiene y descarga CSV al instante
fbScrape.dump();              // Fuerza descarga del CSV (lo recolectado hasta ahora)

fbScrape.setCutoff("2025-03-30T23:59:59"); // Cambia fecha de corte (hora local)
fbScrape.setPause(2250);       // Cambia SCROLL_PAUSE_MS (ms) durante la ejecución
fbScrape.setMaxScrolls(1500);  // Límite duro de scrolls
fbScrape.setExtraAfterCutoff(50); // Scrolls extra tras alcanzar el cutoff

fbScrape.getRows();           // Obtiene el arreglo de filas acumuladas
fbScrape.getSeenCount();      // Cantidad de URLs únicas vistas

// Atajo de teclado:
Esc                           // Detiene y descarga el CSV

```

---

🔧 Configuración recomendada

- SCROLL_PAUSE_MS: 2100–2300 ms (redes lentas: sube hasta 2600–3000).
- EXTRA_AFTER_CUTOFF_SCROLLS: 35–60 (garantiza no perder posts borde).
- MAX_SCROLLS: 1200–1800 (dependiendo de la densidad del feed).
- Fecha de corte: por defecto 2025-03-30T23:59:59 (local). Modifícala con fbScrape.setCutoff().
- Variables de integración:
  window.dendro_ad y window.dendro_db se exponen como objetos para que puedas registrar metadatos/telemetría propios.

---

❓ FAQ / Troubleshooting

Q: No captura algunas publicaciones de foto/video.
- A:Prueba en m.facebook.com (a veces el DOM es más simple y estable).
- Sube SCROLL_PAUSE_MS con fbScrape.setPause(2600) o más (da tiempo a cargar).
- Aumenta EXTRA_AFTER_CUTOFF_SCROLLS con fbScrape.setExtraAfterCutoff(60).
- Asegúrate de estar en el timeline (no dentro de un post individual).
- Haz un pequeño scroll manual al inicio para disparar el primer lote del feed.

Q: Quiero detener manualmente y guardar.
- Presiona Esc, o ejecuta fbScrape.stop().

Q: Veo â€¯ en la etiqueta de hora.
- El script lo sanitiza automáticamente (ver cleanSpaces()).

Q: El script se detuvo antes del 30-Mar-2025.
- Ajusta el cutoff en caliente: fbScrape.setCutoff("2025-03-30T23:59:59")
- Sube MAX_SCROLLS y los scrolls extra: fbScrape.setMaxScrolls(1800); fbScrape.setExtraAfterCutoff(60);

---

📘 LECTURA RECOMENDADA CIBERCRIMINALIDAD Y DELITOS INFORMÁTICOS

- Aspectos sustantivos, probatorios y jurisprudenciales; Protección penal de la información y sistemas informáticos
- ISBN: 978-612-322-449-3
- Editorial: Instituto Pacífico S.A.C.
- Edición/Páginas: 1ª ed., 670 págs
- Encuadernación: Tapa dura
- Publicación: 2023-06-15
- Materia: Derecho penal
- Público: Profesional/Académico
- Co-Autor: Keith Fernández

Una obra integral para comprender riesgos, evidencias digitales y la tutela penal de la información. Ideal si trabajas en cumplimiento, forense digital o ciberseguridad.


---
Nota legal y ética

Este proyecto se ofrece con fines educativos. Al usarlo, aceptas cumplir las Condiciones de Servicio de Facebook y todas las leyes aplicables. No remitas datos personales de terceros sin base legal válida. Los autores no se responsabilizan por usos indebidos.


---
