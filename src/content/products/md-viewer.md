---
name: "md-viewer"
headline: "md-viewer — Markdown sofort lesen, gerendert und im Quelltext zugleich."
definition: "md-viewer öffnet eine Markdown-Datei in einer geteilten Ansicht: links das gerenderte Dokument, rechts der Quelltext mit Syntax-Hervorhebung. Als Finder-Quick-Action für macOS und als Web-Zwilling unter md.neckarshore.ai, der die Datei vollständig im Browser verarbeitet."
metaDescription: "Markdown sofort lesen: Finder-Quick-Action für macOS plus Web-Zwilling — gerendert und Quelltext nebeneinander, komplett lokal im Browser."
liveUrl: "https://md.neckarshore.ai"
applicationCategory: "DeveloperApplication"
---

## Das Problem

Markdown-Dateien liegen überall: READMEs, Notizen, Exporte, Protokolle. Um eine davon kurz zu lesen, öffnet man einen Editor, der für etwas ganz anderes gebaut wurde — und bekommt dann entweder die formatierte Ansicht oder die rohe Quelle. Meistens will man aber beides: die Formatierung, um den Text zu erfassen, und die Quelle, um zu sehen, wie er gemacht ist.

## Was md-viewer tut

Rechtsklick auf eine `.md`-Datei im Finder, **Quick Actions → View Markdown** — die Datei öffnet sich im Standardbrowser in geteilter Ansicht. Links das gerenderte Dokument, rechts der Quelltext mit farblich hervorgehobenen Überschriften, Listen, Links und Code-Blöcken. Die Trennlinie in der Mitte lässt sich ziehen, hell und dunkel folgen der Systemeinstellung.

Dasselbe Werkzeug läuft als Web-Zwilling unter [md.neckarshore.ai](https://md.neckarshore.ai): Datei hineinziehen, Text einfügen oder auswählen — dieselbe geteilte Ansicht, ohne Installation.

## Was mit deiner Datei passiert

Nichts verlässt deinen Rechner. Der Web-Zwilling ist eine statische Seite, die die Datei vollständig im Browser verarbeitet — es gibt keinen Upload und keinen Server, der den Inhalt zu sehen bekäme. Lokal ist der Viewer eine einzelne HTML-Datei mit eingebettetem CSS und JavaScript: keine Laufzeit-Abhängigkeiten, kein Internet nötig.

Gerendertes HTML wird vor der Anzeige bereinigt (DOMPurify), damit eine heruntergeladene Markdown-Datei mit eingebettetem Skript keinen Code ausführen kann.

## Open Source

Der Quellcode liegt offen unter MIT-Lizenz: [github.com/neckarshore-mmps/md-viewer](https://github.com/neckarshore-mmps/md-viewer). Die Quick Action wird über ein Installationsskript im Repository eingerichtet; der Web-Zwilling braucht nichts davon.
