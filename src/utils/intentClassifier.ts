import { SelectedElementInfo } from '../types';

/**
 * Intelligent Intent Classifier for Vesper AI
 * Accurately determines if a user message is a genuine Web/App development/revision request
 * versus a general inquiry (Q&A, homework/soal, math, explanation, writing, website recommendation, etc.).
 */
export function isExplicitCodingRequest(
  text: string,
  elementInfo?: SelectedElementInfo | null
): boolean {
  // If the user actively selected a DOM element in focus mode, it's definitely a revision request
  if (elementInfo) {
    return true;
  }

  const raw = (text || '').trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();

  // If user explicitly asks NOT to code or clarifies it's general
  if (
    lower.includes('bukan koding') ||
    lower.includes('bukan coding') ||
    lower.includes('ga usah koding') ||
    lower.includes('ga usah coding') ||
    lower.includes('tanpa koding') ||
    lower.includes('tanpa coding') ||
    lower.includes('ga semua tentang coding') ||
    lower.includes('tidak semua coding') ||
    lower.includes('jangan koding') ||
    lower.includes('jangan coding') ||
    lower.includes('jangan buat web') ||
    lower.includes('hanya teks') ||
    lower.includes('jawab biasa')
  ) {
    return false;
  }

// Explicit negative triggers: user explicitly asks NOT to code or says plain text
  if (
    lower.includes('bukan koding') ||
    lower.includes('bukan coding') ||
    lower.includes('ga usah koding') ||
    lower.includes('ga usah coding') ||
    lower.includes('tanpa koding') ||
    lower.includes('tanpa coding') ||
    lower.includes('ga semua tentang coding') ||
    lower.includes('tidak semua coding') ||
    lower.includes('jangan koding') ||
    lower.includes('jangan coding') ||
    lower.includes('jangan buat web') ||
    lower.includes('jangan buat aplikasi') ||
    lower.includes('hanya teks') ||
    lower.includes('jawab biasa') ||
    lower.includes('penjelasan saja')
  ) {
    return false;
  }

  // Common Question, Homework, Exam, Academic, and Informational triggers
  const isQuestionOrAcademic =
    /^(apa|apakah|siapa|mengapa|kenapa|bagaimana|gimana|kapan|di mana|dimana|tolong jelaskan|jelaskan|terangkan|uraikan|bantu jawab|jawablah|jawab dong|soal|pr|tugas|latihan|ujian|hitunglah|hitung|berikan contoh|rekomendasi|rekomendasikan|menurutmu|pendapatmu|ceritakan|tuliskan esai|tuliskan artikel|tuliskan puisi|buatkan puisi|buat puisi|buatkan cerita|buat cerita|ringkaslah|ringkaskan|terjemahkan|analisis|bedah|apa itu|siapakah)\b/i.test(
      lower
    ) ||
    lower.includes('jawaban soal') ||
    lower.includes('kunci jawaban') ||
    lower.includes('soal nomor') ||
    lower.includes('soal no') ||
    lower.includes('tanya soal') ||
    lower.includes('penyelesaian soal') ||
    lower.includes('cara menyelesaikan') ||
    lower.includes('website apa') ||
    lower.includes('web apa') ||
    lower.includes('situs apa') ||
    lower.includes('rekomendasi web') ||
    lower.includes('rekomendasi situs');

  if (isQuestionOrAcademic) {
    // Only treat as coding if they explicitly ask to write a program/web app/code to solve it
    const explicitlyDemandsCoding =
      /\b(buatkan|buat|bikin|buatin|tuliskan|tulis|kodingkan|koding|coding|develop|create|build)\s+(sebuah\s+|suatu\s+)?(program|kode|script|kodingan|aplikasi|app|web|website|halaman\s+web)\b/i.test(
        lower
      ) ||
      /\b(dalam\s+bentuk\s+kodingan|dalam\s+kode|dalam\s+script|jadikan\s+aplikasi|jadikan\s+web)\b/i.test(
        lower
      );
    if (!explicitlyDemandsCoding) {
      return false;
    }
  }

  // 1. Website / Web App creation & Vibe Coding Requests
  const isWebOrAppBuild =
    /\b(buat|buatkan|bikin|buatin|develop|create|build|rancang|desain)\s+(sebuah\s+|suatu\s+)?(web|website|web\s*app|aplikasi|app|landing\s*page|dashboard|game|ui|antarmuka|situs\s+web|situs|portofolio|sistem)\b/i.test(
      lower
    ) ||
    lower.includes('vibe coding') ||
    lower.includes('vibe code') ||
    lower.includes('buat web') ||
    lower.includes('bikin web') ||
    lower.includes('bikin website') ||
    lower.includes('buat website') ||
    lower.includes('website gede') ||
    lower.includes('aplikasi web');

  // 2. Multi-file & Architecture feedback (e.g. "jangan only html", "create banyak", "html main app/")
  const isMultiFileOrArchitecture =
    lower.includes('only html') ||
    lower.includes('jangan only html') ||
    lower.includes('create banyak') ||
    lower.includes('bikin banyak file') ||
    lower.includes('banyak file') ||
    lower.includes('multi file') ||
    lower.includes('multifile') ||
    lower.includes('struktur berkas') ||
    lower.includes('dummy') ||
    lower.includes('fake file') ||
    (lower.includes('html') && lower.includes('main') && (lower.includes('app') || lower.includes('css') || lower.includes('js')));

  // 3. Specific features or components
  const isFeatureOrComponent =
    /\b(buat|buatkan|bikin|buatin|tambah|tambahkan|pasang|pasangkan)\s+(fitur|komponen|tombol|navbar|header|footer|sidebar|modal|halaman|form|calculator|kalkulator|tampilan|tema|animasi|table|tabel|card|carousel|dropdown|slider)\b/i.test(
      lower
    );

  // 4. Coding terms, languages & tools
  const isExplicitCodingTerms =
    /\b(coding|koding|kodingan|ngoding|source\s*code|kode\s*program|script\s*(js|ts|python|bash)?)\b/i.test(
      lower
    ) ||
    /\b(berkaitan\s+dengan\s+coding|tentang\s+coding|soal\s+coding|ranah\s+coding)\b/i.test(
      lower
    ) ||
    /\b(index\.html|src\/main\.js|styles\/theme\.css|style\.css|app\.jsx|app\.tsx)\b/i.test(
      lower
    ) ||
    /\b(jalankan di sandbox|live sandbox|preview code|preview aplikasi|preview web)\b/i.test(
      lower
    );

  // 5. Debugging, fixing, refactoring code & Console Error Fixes
  const isBugOrRefactor =
    /\b(perbaiki|fix|debug|solve|selesaikan|difix|dibenerin|benerin)\s*(error|bug|console|kode|kodingan|script|fungsi|logic|berkas|file|syntax|runtime|browser)?\b/i.test(
      lower
    ) ||
    lower.includes('console error') ||
    lower.includes('runtime error') ||
    lower.includes('fix dari console') ||
    lower.includes('difix dri console') ||
    lower.includes('fix with ai') ||
    lower.includes('fix all ai') ||
    lower.includes('benerin error') ||
    /\b(refactor|optimasi|restrukturisasi)\s+(kode|code|arsitektur|project|proyek|file)\b/i.test(
      lower
    );

  // 6. Common interactive app types (kalkulator, todo list, timer, game, quiz, stopwatch, e-commerce, clone)
  const isCommonAppType =
    /\b(buat|buatkan|bikin|buatin)\s+(kalkulator|calculator|todo\s*list|catatan|notes|stopwatch|timer|countdown|game\s+[a-z0-9_-]+|clone\s+[a-z0-9_-]+|galeri\s+foto|media\s+player|music\s+player)\b/i.test(
      lower
    );

  return (
    isWebOrAppBuild ||
    isMultiFileOrArchitecture ||
    isFeatureOrComponent ||
    isExplicitCodingTerms ||
    isBugOrRefactor ||
    isCommonAppType
  );
}
