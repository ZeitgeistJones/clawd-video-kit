import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const CLAWD_TOKEN = '0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07'
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD'
const BURN_AMOUNT = BigInt('1000000000000000000000') // 1000 CLAWD in wei
const BASE_CHAIN_ID = 8453

async function generateThumbnailPrompt(repoName: string, notebookDoc: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Based on this repo "${repoName}" and its description below, write a short creative scene description for the CLAWD mascot (a red crystalline lobster in a tuxedo) that captures the vibe of this project. Keep it under 20 words, visual and fun. Examples: "wearing a hoodie coding on a glowing laptop", "as a pirate captain on a blockchain ship", "presenting a smart contract on a giant screen".

Repo context: ${notebookDoc.slice(0, 500)}

Return ONLY the scene description, nothing else.`
    }]
  })
  return response.content[0].type === 'text' ? response.content[0].text.trim() : 'as a cool developer with a glowing screen'
}

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

  // wait for confirmation
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  })
  await publicClient.waitForTransactionReceipt({ hash })

  return hash
}

export async function POST(req: Request) {
  try {
    const { repoName, notebookDoc } = await req.json()

    const walletAddress = process.env.WALLET_ADDRESS
    if (!process.env.WALLET_PRIVATE_KEY || !walletAddress) {
      throw new Error('Wallet not configured')
    }

    // generate scene prompt from repo context
    const prompt = await generateThumbnailPrompt(repoName, notebookDoc)

    // burn 1000 CLAWD
    const txHash = await burnClawd()

    // call pfp generator
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
