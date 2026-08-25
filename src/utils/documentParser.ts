import mammoth from 'mammoth';

export interface ParsedDocumentResult {
  fileName: string;
  fileSize: number; // in bytes
  fileCategory: 'pdf' | 'word' | 'html' | 'text' | 'image';
  extractedText?: string;
  base64?: string;
  mimeType: string;
  previewSnippet?: string;
}

/**
 * Format bytes to readable size string (e.g. "1.4 MB", "420 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Parses any uploaded radiology document or image:
 * - PDF documents (.pdf)
 * - Word documents (.docx, .doc)
 * - HTML files (.html, .htm)
 * - Text files (.txt, .rtf, .md)
 * - Images (.jpg, .jpeg, .png, .webp, .heic, .tiff, .bmp)
 */
export async function parseUploadedDocument(file: File): Promise<ParsedDocumentResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const lowerName = fileName.toLowerCase();
  const fileType = file.type;

  // 1. PDF Document
  if (fileType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const base64 = await readFileAsDataURL(file);
    return {
      fileName,
      fileSize,
      fileCategory: 'pdf',
      base64,
      mimeType: 'application/pdf',
      previewSnippet: 'Portable Document Format (PDF)',
    };
  }

  // 2. Word Document (.docx, .doc)
  if (
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc') ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileType === 'application/msword'
  ) {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value.trim();
      const base64 = await readFileAsDataURL(file);

      return {
        fileName,
        fileSize,
        fileCategory: 'word',
        extractedText,
        base64,
        mimeType: fileType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        previewSnippet: extractedText ? extractedText.slice(0, 200) : 'Word Document (.docx)',
      };
    } catch (err) {
      console.warn('Word document text extraction fallback:', err);
      const base64 = await readFileAsDataURL(file);
      return {
        fileName,
        fileSize,
        fileCategory: 'word',
        base64,
        mimeType: fileType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        previewSnippet: 'Microsoft Word Document (.docx)',
      };
    }
  }

  // 3. HTML File (.html, .htm)
  if (
    lowerName.endsWith('.html') ||
    lowerName.endsWith('.htm') ||
    fileType === 'text/html'
  ) {
    const rawHtml = await readFileAsText(file);
    let cleanText = rawHtml;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      doc.querySelectorAll('script, style, noscript, svg').forEach((el) => el.remove());
      cleanText = (doc.body.textContent || doc.body.innerText || rawHtml).trim();
    } catch {
      cleanText = rawHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return {
      fileName,
      fileSize,
      fileCategory: 'html',
      extractedText: cleanText,
      mimeType: 'text/html',
      previewSnippet: cleanText ? cleanText.slice(0, 200) : 'HTML Document',
    };
  }

  // 4. Plain Text / RTF / Markdown
  if (
    lowerName.endsWith('.txt') ||
    lowerName.endsWith('.rtf') ||
    lowerName.endsWith('.md') ||
    fileType.startsWith('text/')
  ) {
    const text = await readFileAsText(file);
    return {
      fileName,
      fileSize,
      fileCategory: 'text',
      extractedText: text.trim(),
      mimeType: 'text/plain',
      previewSnippet: text.trim().slice(0, 200),
    };
  }

  // 5. Image File
  if (
    fileType.startsWith('image/') ||
    lowerName.match(/\.(jpe?g|png|webp|heic|tiff?|bmp|gif)$/i)
  ) {
    const base64 = await readFileAsDataURL(file);
    return {
      fileName,
      fileSize,
      fileCategory: 'image',
      base64,
      mimeType: fileType || 'image/jpeg',
      previewSnippet: 'Radiology Report Image',
    };
  }

  // Fallback / Unknown file: try reading as text first, then data URL
  try {
    const text = await readFileAsText(file);
    if (text && text.length > 10 && /^[\x20-\x7E\s\n\r\t]+$/.test(text.slice(0, 100))) {
      return {
        fileName,
        fileSize,
        fileCategory: 'text',
        extractedText: text.trim(),
        mimeType: 'text/plain',
        previewSnippet: text.trim().slice(0, 200),
      };
    }
  } catch {
    // Continue to binary fallback
  }

  const base64 = await readFileAsDataURL(file);
  return {
    fileName,
    fileSize,
    fileCategory: 'pdf',
    base64,
    mimeType: fileType || 'application/octet-stream',
    previewSnippet: fileName,
  };
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
