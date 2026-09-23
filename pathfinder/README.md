# PRDUCT Data Pathfinder engine

Pure JS capability model + adaptive router. **No production quiz swap.**

Brand: **Prduct / PRDUCT** (never “Product” as the company name).

## Layout

| File | Role |
|------|------|
| `evidence.js` | Strength 0–4 → score 0–100 bands |
| `dimensions.js` | 13 capabilities + derived signals |
| `scenarios.js` | Situation library + persona variants |
| `router.js` | Adaptive stage machine / branching |
| `model.js` | `createState` / `answer` / `getSituation` |
| `landscape.js` | Foundation / fracture / next / opportunity |
| `calculator-bridge.js` | Calculator-compatible timeline inputs |
| `index.js` | Public API (`walk`, `runPath`, re-exports) |
| `tests/pathfinder.test.mjs` | Deterministic Node tests |

## Run tests

```bash
node --test pathfinder/tests/pathfinder.test.mjs
```

## Minimal usage

```js
import { walk, finalize, getSituation, answer, createState } from "./index.js";

const { landscape } = walk("sales", (situation) => situation.options[0].id);
// landscape.foundation | fragmentation | nextCapability | opportunities | …
```

## UI

Production quiz at `/` is unchanged. Pathfinder preview shell is owned separately
(e.g. `pathfinder.html` → `/pathfinder`); do not wire this engine into `app.js` quiz render.
