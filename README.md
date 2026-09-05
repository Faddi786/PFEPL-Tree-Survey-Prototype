# GreenWatch

Field governance prototype for **Social Forestry Division, Pune** — tree inventory, field patrol, watering cycles, and officer-verified health/encroachment reporting.

Aligned to the GreenWatch technical proposal: QR-tagged trees, photo height/crown using the QR card as scale, structured digital forms, patrol scheduling, and alerts.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- OpenLayers 10

## Quick start

```bash
npm install
npm run dev
```

## Modules (as in the proposal)

1. **Inventory portal** — map workbench, Database Explorer, patrol monitoring, spatial tools, audit, reports
2. **Field patrol app** — QR scan, officer forms, QR-scale measure, offline sync, SOS, GNSS rover pairing
3. **Measurement & analyst** — QR-scale height/crown with Accept/override, conversational queries, alerting
