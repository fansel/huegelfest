# Digital Stamp Card – Nachteule

Dieses Feature ermöglicht es Nutzern, digitale Stempel durch das Scannen von visuellen Mustern (Pattern) zu sammeln. Der erste Stempel ist die "Nachteule".

## Struktur
- `components/PatternScanner.tsx`: Kamera-Scanner für Pattern
- `components/StampCard.tsx`: UI für die Stempelkarte
- `components/StampBadge.tsx`: Einzelner Stempel (z.B. Nachteule)
- `hooks/useStampCard.ts`: Logik für das Sammeln und Anzeigen von Stempeln (Server Actions)

## ToDo
- Pattern-Scanner (ArUco/AprilTag oder Custom)
- Stempelkarte mit Nachteule-Badge
- Server Action für Stempelspeicherung
- PWA-Integration 