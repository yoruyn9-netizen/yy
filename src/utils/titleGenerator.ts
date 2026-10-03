/**
 * Generates concise, meaningful Indonesian titles from user prompts
 */
export function generateSmartSessionTitle(prompt: string): string {
  let cleaned = prompt
    .replace(/^perbarui elemen.*?:\s*/i, '')
    .replace(/\[AIS_METADATA_SECTION_START\][\s\S]*?\[AIS_METADATA_SECTION_END\]/g, '')
    .trim();

  // Strip command prefixes
  cleaned = cleaned.replace(
    /^(tolong|buatkan|buat|bikin|buatlah|create|build|make|design|generate|desain|rancang|mohon)\s+(sebuah\s+|a\s+|an\s+|the\s+)?/i,
    ''
  );

  if (/^\/image/i.test(cleaned) || /\b(gambar|ilustrasi|image|lukisan)\b/i.test(cleaned)) {
    const topic = cleaned.replace(/^\/image|\b(buatkan|buat|gambar|ilustrasi|image)\b/gi, '').trim();
    return topic ? `Ilustrasi: ${capitalizeWords(topic.slice(0, 24))}` : 'Generator Gambar AI';
  }

  if (/game|shooter|arcade|snake|tetris|flappy|asteroid/i.test(cleaned)) {
    return 'Game Arcade 2D';
  }

  if (/kalkulator|calculator/i.test(cleaned)) {
    return 'Kalkulator Modular';
  }

  if (/keuangan|finance|crypto|ledger|transaksi/i.test(cleaned)) {
    return 'Dashboard Keuangan';
  }

  if (/synth|audio|suara|musik|sound|oscillator/i.test(cleaned)) {
    return 'Audio Synthesizer';
  }

  if (/landing\s*page|portofolio|portfolio/i.test(cleaned)) {
    return 'Landing Page Portofolio';
  }

  if (/todo|catatan|task|tugas|reminder/i.test(cleaned)) {
    return 'Aplikasi Catatan & Tugas';
  }

  if (/rest|api|endpoint|http/i.test(cleaned)) {
    return 'REST API Tester';
  }

  // Fallback: take first 3-4 significant words
  const words = cleaned
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);

  if (words.length > 0) {
    return capitalizeWords(words.join(' '));
  }

  return 'Proyek Vibe Baru';
}

function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
