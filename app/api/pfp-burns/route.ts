import { NextResponse } from 'next/server'
import { listPfpBurns, PFP_BURN_APP, PFP_BURN_PRODUCT_TAG } from '@/lib/pfp-burn-log'

/**
 * Export LeftClaw PFP payment burns for Ash Ledger.
 * Burner = WALLET_ADDRESS (Transfer.from). productTag = leftclaw-pfp (note only).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Number(searchParams.get('limit') || '200')
    const format = searchParams.get('format') || 'json'
    const burns = await listPfpBurns(Number.isFinite(limit) ? limit : 200)

    const burnerAddress = process.env.WALLET_ADDRESS || null

    if (format === 'csv') {
      const header = [
        'txHash',
        'app',
        'productTag',
        'burnedAt',
        'address',
        'amountClawd',
        'chain',
        'repoName',
        'leftclawOk',
        'note',
      ].join(',')
      const rows = burns.map((b) =>
        [
          b.txHash,
          b.app,
          b.productTag,
          b.burnedAt,
          b.address,
          b.amountClawd,
          b.chain,
          JSON.stringify(b.repoName || ''),
          b.leftclawOk === null ? '' : String(b.leftclawOk),
          JSON.stringify(b.note),
        ].join(','),
      )
      return new NextResponse([header, ...rows].join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="pfp-burns.csv"',
        },
      })
    }

    return NextResponse.json({
      burnerAddress,
      app: PFP_BURN_APP,
      productTag: PFP_BURN_PRODUCT_TAG,
      creditModel:
        'Burner = Transfer.from (WALLET_ADDRESS). productTag leftclaw-pfp is a payment note only — do not credit LeftClaw as CLAWD burner.',
      sharedWallet: true,
      sharedWith: 'other products using the same WALLET_ADDRESS (confirm in Ash chat)',
      historyBeforeLog: 'none persisted in clawd-video-kit before pfp_burns table',
      leftclawPersistUnknown:
        'LeftClaw generate-payment receives txHash; whether they store it long-term is unknown from this repo — ask LeftClaw.',
      burns,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
