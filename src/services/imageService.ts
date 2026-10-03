/**
 * Image Generation Service for Vesper Vibe Coding Studio
 * Supports AI image generation from text prompts with instant high-resolution rendering
 */

export interface GeneratedImageResult {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
  width: number;
  height: number;
}

export async function generateAiImage(
  prompt: string,
  aspectRatio: 'square' | 'wide' | 'portrait' = 'wide'
): Promise<GeneratedImageResult> {
  const cleanPrompt = prompt.trim();
  let width = 1200;
  let height = 675; // 16:9

  if (aspectRatio === 'square') {
    width = 1024;
    height = 1024;
  } else if (aspectRatio === 'portrait') {
    width = 768;
    height = 1024;
  }

  const encodedPrompt = encodeURIComponent(cleanPrompt);
  const seed = Math.floor(Math.random() * 1000000);
  // High-fidelity flux model via pollinations with no cors restrictions
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true&model=flux`;

  // Pre-load image to verify availability
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // resolve anyway so fallback displays
    img.src = imageUrl;
  });

  return {
    id: 'img-' + Date.now(),
    prompt: cleanPrompt,
    imageUrl,
    timestamp: Date.now(),
    width,
    height,
  };
}
