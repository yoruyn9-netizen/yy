import JSZip from 'jszip';
import { ProjectState } from '../types';

/**
 * Export the current modular project files as a downloadable ZIP package.
 */
export async function exportProjectToZip(projectState: ProjectState, projectName = 'vibe-project'): Promise<void> {
  const zip = new JSZip();

  const files = Object.values(projectState.files);
  if (files.length === 0) {
    throw new Error('Tidak ada file di dalam proyek untuk diekspor.');
  }

  // Add all project files into the zip archive
  for (const file of files) {
    const cleanPath = file.path.replace(/^\/+/, '');
    zip.file(cleanPath, file.content);
  }

  // Add helpful README.md if not already present
  if (!projectState.files['README.md'] && !projectState.files['readme.md']) {
    const readmeContent = `# ${projectState.title || projectName}

Generated via AI Studio Vibe Coding Engine.

## Structure
${files.map((f) => `- \`${f.path}\` (${f.language})`).join('\n')}

## How to Run
1. Simply double click \`index.html\` in any modern browser (Chrome, Safari, Edge, Firefox).
2. Or run a local dev server:
   \`\`\`bash
   npx serve .
   # or
   python3 -m http.server 8000
   \`\`\`
`;
    zip.file('README.md', readmeContent);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const cleanName = (projectState.title || projectName)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
