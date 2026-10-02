# DPP Assessment — Code handoff

2 Oct 2026 · For Stefan, from the sprint

This is the code for Friday. It is on `main`. The film at the top of the repository is the same camera the page uses.

## Where it is

| | |
| --- | --- |
| Page | https://demosprint.vercel.app |
| Repository | https://github.com/gvitolocs/prduct_sprint |
| Branch | `main` |
| Film | [`docs/github/journey.mp4`](../docs/github/journey.mp4) — also playing on the repository home |

## How to run it

```bash
git clone https://github.com/gvitolocs/prduct_sprint.git
cd prduct_sprint
python3 server.py
```

Open http://127.0.0.1:8787/. Checks: `node --test pathfinder/tests/*.test.mjs`.

## What is in the tree

| Path | What it is |
| --- | --- |
| `index.html`, `styles.css`, `journey/` | The page: prototype bar, journey, result |
| `pathfinder/lifecycle.js` | Questions, routing, ladders |
| `docs/journey/` | Question catalogue |
| `docs/qualification/` | The four passes and the Friday plan, as received |
| `inbox.html`, `api/` | Responses. The list is not public |
| `server.py` | Local server, same rule |
| `docs/PROJECT.md` | The logic: stack, files, and how one answer chooses the next question |
| `docs/github/` | The film for the repository page: the page itself, questions included |

Media for the journey sits in `journey/media/`. It is part of the page.

## The inbox

`/inbox.html` can list what the form receives. That list is not public. Posting an answer stays open.

Privacy note and consent checkbox are after Friday, as you said.
