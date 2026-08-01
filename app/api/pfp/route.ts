import { NextResponse } from 'next/server'
import { generateMascotScene } from '@/lib/mascot-scene'
import { logPfpBurn, updatePfpBurnLeftclaw } from '@/lib/pfp-burn-log'

const CLAWD_TOKEN = '0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07'
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD'
const BURN_AMOUNT = BigInt('1000000000000000000000') // 1000 CLAWD in wei

async function burnClawd(): Promise<string> {
  const { createWalletClient, createPublicClient, http, parseAbi } = await import('viem')
  const { base } = await import('viem/chains')
  const { privateKeyToAccount } = await import('viem/accounts')

  const privateKey = process.env.WALLET_PRIVATE_KEY as `0x${string}`
  const account = privateKeyToAccount(privateKey)

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  })

  const abi = parseAbi([
    'function transfer(address to, uint256 amount) returns (bool)'
  ])

  const hash = await walletClient.writeContract({
    address: CLAWD_TOKEN as `0x${string}`,
    abi,
    functionName: 'transfer',
    args: [DEAD_ADDRESS as `0x${string}`, BURN_AMOUNT],
  })

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  })
  await publicClient.waitForTransactionReceipt({ hash })

  return hash
}

export async function POST(req: Request) {
  try {
    const { repoName, notebookDoc, prompt: providedPrompt } = await req.json()

    const walletAddress = process.env.WALLET_ADDRESS
    if (!process.env.WALLET_PRIVATE_KEY || !walletAddress) {
      throw new Error('Wallet not configured')
    }

    const prompt =
      typeof providedPrompt === 'string' && providedPrompt.trim()
        ? providedPrompt.trim()
        : await generateMascotScene(repoName, notebookDoc || '')

    const txHash = await burnClawd()

    // Persist for Ash Ledger before LeftClaw call — burn already happened on-chain.
    try {
      await logPfpBurn({
        txHash,
        address: walletAddress,
        prompt,
        repoName: typeof repoName === 'string' ? repoName : undefined,
      })
    } catch (logErr: any) {
      console.error('pfp burn log failed:', logErr?.message || logErr)
    }

    const pfpRes = await fetch('https://leftclaw-services-nextjs.vercel.app/api/pfp/generate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        txHash,
        address: walletAddress,
      }),
    })

    if (!pfpRes.ok) {
      const err = await pfpRes.text()
      try {
        await updatePfpBurnLeftclaw(txHash, false, err.slice(0, 500))
      } catch {}
      throw new Error(`PFP generation failed: ${err}`)
    }

    const data = await pfpRes.json()
    try {
      await updatePfpBurnLeftclaw(txHash, true)
    } catch {}

    return NextResponse.json({
      imageData: data.image || data.imageData || data.data,
      prompt,
      txHash,
      app: 'clawd-video-kit',
      productTag: 'leftclaw-pfp',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
