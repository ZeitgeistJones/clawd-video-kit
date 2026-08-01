import { generateText } from '@/lib/llm'

/** Short LeftClaw scene used for both PFP generation and thumbnail lock-in. */
export async function generateMascotScene(
  repoName: string,
  context: string,
): Promise<string> {
  try {
    const scene = await generateText({
      prompt: `Based on this repo "${repoName}" and its description below, write a short creative scene description for the CLAWD mascot (a red crystalline lobster in a tuxedo) that captures the vibe of this project. Keep it under 20 words, visual and fun. Examples: "wearing a hoodie coding on a glowing laptop", "as a pirate captain on a blockchain ship", "presenting a smart contract on a giant screen".

Repo context: ${context.slice(0, 800)}

Return ONLY the scene description, nothing else.`,
      maxOutputTokens: 200,
    })
    const cleaned = scene.trim().replace(/^["']|["']$/g, '')
    return cleaned || 'as a cool developer with a glowing screen'
  } catch {
    return 'as a cool developer with a glowing screen'
  }
}

/** Instructions that lock the YouTube thumbnail to a specific LeftClaw PFP image. */
export function thumbnailMascotLockNotes(
  mascotScene: string,
  aspect: '16:9' | '9:16',
): string {
  const format =
    aspect === '9:16'
      ? 'Specify 9:16 vertical YouTube Shorts format'
      : 'Specify 16:9 YouTube thumbnail format'

  return `The prompt should:
- Start by telling the AI that the user will attach a LeftClaw-generated CLAWD mascot image — a red crystalline lobster character. The attached image specifically shows the mascot ${mascotScene}. That attached file is the exact character asset to use.
- Instruct the AI to place THAT attached mascot as the central character — keep the mascot's look, outfit, pose, and expression from the attachment. Do NOT redesign, re-outfit, or invent a different mascot pose.
- Build background, props, lighting, and composition AROUND that attached mascot so the overall thumbnail fits the repo topic — funny, energetic, attention-grabbing, not generic
- ONE continuous scene only — never split-screen, side-by-side panels, comparison layouts, or collages
- Suggest bold title text to overlay (short, punchy, relevant) — one overlay max
- Describe background, color palette, and visual style — vary the style to fit the vibe (comic book, cinematic, cartoon, anime, pop art, retro, etc)
- ${format}
- Explicitly restate the attached image description once ("attached LeftClaw image: CLAWD mascot ${mascotScene}") so the image model does not ignore it
- Keep it under 150 words, be specific — no vague or stock-photo aesthetics`
}

export function thumbnailMascotOpenNotes(aspect: '16:9' | '9:16'): string {
  const format =
    aspect === '9:16'
      ? 'Specify 9:16 vertical YouTube Shorts format'
      : 'Specify 16:9 YouTube thumbnail format'

  return `The prompt should:
- Start by telling the AI that the user will attach an image of the CLAWD mascot (a red crystalline lobster character — tuxedo or other outfit depending on the attached file)
- Instruct the AI to incorporate the attached mascot as the central character, preserving the look of the attachment
- Describe a specific creative scene around the mascot that fits the repo topic — funny, energetic, attention-grabbing, not generic — without contradicting a typical LeftClaw PFP (front-facing character portrait)
- ONE continuous scene only — never split-screen, side-by-side panels, comparison layouts, or collages
- Suggest bold title text to overlay (short, punchy, relevant) — one overlay max
- Describe background, color palette, and visual style — vary the style to fit the vibe (comic book, cinematic, cartoon, anime, pop art, retro, etc)
- ${format}
- Keep it under 150 words, be specific — no vague or stock-photo aesthetics`
}
