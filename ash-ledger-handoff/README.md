# clawd-video-kit → Ash Ledger handoff

LeftClaw PFP burns from **clawd-video-kit**. Read this first.

## Credit model (do not reverse)

| Role | Who | Ash treatment |
|------|-----|----------------|
| **Burner** | Kit wallet (`WALLET_ADDRESS` / `Transfer.from`) | Counts in totals / source table |
| **Payment tag** | `productTag: leftclaw-pfp` (LeftClaw service) | Note only — **not** the CLAWD burner |

Flow: kit burns 1000 CLAWD → dead → calls LeftClaw `/api/pfp/generate-payment` with `{ prompt, txHash, address }`.

## Burner address

Public Base address = env `WALLET_ADDRESS` on the clawd-video-kit deploy (same key as `WALLET_PRIVATE_KEY` signer).

Fill in after copy from Vercel:

```
BURNER_ADDRESS=
```

**Shared wallet:** yes — also used by other products. On-chain burns have no app tag; use this log’s `app` + `txHash` for attribution.

## Burn log (going forward)

- Postgres table: `pfp_burns` (created on first burn after deploy of burn-log commit)
- Written **at burn time** (before LeftClaw returns)
- Export live:
  - `GET /api/pfp-burns` → JSON
  - `GET /api/pfp-burns?format=csv` → CSV

See:

- `schema.json` — field definitions
- `sample-burn.json` — one example row
- `sample-export.json` — shape of `GET /api/pfp-burns`
- `sample-export.csv` — CSV header + example row

## History before log

**None** in clawd-video-kit. No CSV of past txHashes from this app.

Past shared-wallet burns: Base scan by `from = BURNER_ADDRESS` + manual/other-app labels, or LeftClaw if they stored `txHash`.

## LeftClaw persistence

Unknown. They receive `txHash` on generate-payment. Ask LeftClaw whether they store generations by tx long-term. No on-chain memos.

## Repo / commit

- App: `clawd-video-kit`
- `app`: `clawd-video-kit`
- `productTag`: `leftclaw-pfp`
- Burn log landed: commit `04d3b05` (Log LeftClaw PFP burns for Ash Ledger attribution)
