import { sql } from '@vercel/postgres'

export const PFP_BURN_APP = 'clawd-video-kit'
/** Ash Ledger tag: payment destination / service — NOT the burner. */
export const PFP_BURN_PRODUCT_TAG = 'leftclaw-pfp'
export const PFP_BURN_AMOUNT_CLAWD = '1000'
export const PFP_BURN_CHAIN = 'base'

export type PfpBurnLog = {
  txHash: string
  app: string
  productTag: string
  burnedAt: string
  address: string
  amountClawd: string
  chain: string
  prompt: string | null
  repoName: string | null
  leftclawOk: boolean | null
  leftclawError: string | null
  note: string
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS pfp_burns (
      tx_hash TEXT PRIMARY KEY,
      app TEXT NOT NULL,
      product_tag TEXT NOT NULL,
      burned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      address TEXT NOT NULL,
      amount_clawd TEXT NOT NULL,
      chain TEXT NOT NULL,
      prompt TEXT,
      repo_name TEXT,
      leftclaw_ok BOOLEAN,
      leftclaw_error TEXT,
      note TEXT NOT NULL
    )
  `
}

const CREDIT_NOTE =
  'LeftClaw PFP payment. Burner = Transfer.from wallet. LeftClaw is payment tag only — do not credit LeftClaw as CLAWD burner.'

export async function logPfpBurn(input: {
  txHash: string
  address: string
  prompt?: string
  repoName?: string
}): Promise<void> {
  await ensureTable()
  await sql`
    INSERT INTO pfp_burns (
      tx_hash, app, product_tag, address, amount_clawd, chain,
      prompt, repo_name, leftclaw_ok, leftclaw_error, note
    )
    VALUES (
      ${input.txHash},
      ${PFP_BURN_APP},
      ${PFP_BURN_PRODUCT_TAG},
      ${input.address},
      ${PFP_BURN_AMOUNT_CLAWD},
      ${PFP_BURN_CHAIN},
      ${input.prompt || null},
      ${input.repoName || null},
      ${null},
      ${null},
      ${CREDIT_NOTE}
    )
    ON CONFLICT (tx_hash) DO NOTHING
  `
}

export async function updatePfpBurnLeftclaw(
  txHash: string,
  ok: boolean,
  error?: string,
): Promise<void> {
  await ensureTable()
  await sql`
    UPDATE pfp_burns
    SET leftclaw_ok = ${ok},
        leftclaw_error = ${error || null}
    WHERE tx_hash = ${txHash}
  `
}

export async function listPfpBurns(limit = 200): Promise<PfpBurnLog[]> {
  await ensureTable()
  const capped = Math.min(Math.max(limit, 1), 1000)
  const result = await sql`
    SELECT
      tx_hash, app, product_tag, burned_at, address, amount_clawd, chain,
      prompt, repo_name, leftclaw_ok, leftclaw_error, note
    FROM pfp_burns
    ORDER BY burned_at DESC
    LIMIT ${capped}
  `
  return result.rows.map((r) => ({
    txHash: r.tx_hash,
    app: r.app,
    productTag: r.product_tag,
    burnedAt: r.burned_at,
    address: r.address,
    amountClawd: r.amount_clawd,
    chain: r.chain,
    prompt: r.prompt,
    repoName: r.repo_name,
    leftclawOk: r.leftclaw_ok,
    leftclawError: r.leftclaw_error,
    note: r.note,
  }))
}
