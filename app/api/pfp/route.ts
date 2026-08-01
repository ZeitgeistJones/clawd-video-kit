import { NextResponse } from 'next/server'
import { generateMascotScene } from '@/lib/mascot-scene'

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

    // Prefer the shared scene from generate (aligned with thumbnail); otherwise invent one.
    const prompt =
      typeof providedPrompt === 'string' && providedPrompt.trim()
        ? providedPrompt.trim()
        : await generateMascotScene(repoName, notebookDoc || '')

    const txHash = await burnClawd()

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
      throw new Error(`PFP generation failed: ${err}`)
    }

    const data = await pfpRes.json()

    return NextResponse.json({
      imageData: data.image || data.imageData || data.data,
      prompt,
      txHash,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
