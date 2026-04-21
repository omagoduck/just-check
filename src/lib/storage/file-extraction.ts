import mammoth from 'mammoth';
import PDFParser, { type Output, type Page } from 'pdf2json';

export const TEXT_EXTRACTABLE_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/tab-separated-values',
  'application/json',
  'application/xml',
  'text/xml',
] as const;

export const PDF_MIME_TYPE = 'application/pdf';
export const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const STRUCTURED_EXTRACTABLE_MIME_TYPES = [
  PDF_MIME_TYPE,
  DOCX_MIME_TYPE,
] as const;

const TEXT_EXTENSION_MIME_TYPES: Record<string, (typeof TEXT_EXTRACTABLE_MIME_TYPES)[number]> = {
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  json: 'application/json',
  xml: 'application/xml',
};

const STRUCTURED_EXTENSION_MIME_TYPES: Record<string, (typeof STRUCTURED_EXTRACTABLE_MIME_TYPES)[number]> = {
  pdf: PDF_MIME_TYPE,
  docx: DOCX_MIME_TYPE,
};

export type ExtractedPage = {
  pageNumber: number;
  text: string;
};

export type FileExtractionMetadata = {
  status: 'extracted' | 'not_applicable' | 'failed' | 'unsupported';
  strategy: 'text' | 'image' | 'pdf' | 'docx' | 'none';
  text?: string;
  pages?: ExtractedPage[];
  error?: string;
};

export function isTextExtractableMimeType(mimeType: string): boolean {
  return TEXT_EXTRACTABLE_MIME_TYPES.includes(
    mimeType as (typeof TEXT_EXTRACTABLE_MIME_TYPES)[number]
  );
}

export function isStructuredExtractableMimeType(mimeType: string): boolean {
  return STRUCTURED_EXTRACTABLE_MIME_TYPES.includes(
    mimeType as (typeof STRUCTURED_EXTRACTABLE_MIME_TYPES)[number]
  );
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function inferProcessableMimeTypeFromFilename(filename: string): string | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) {
    return null;
  }

  return TEXT_EXTENSION_MIME_TYPES[extension] ?? STRUCTURED_EXTENSION_MIME_TYPES[extension] ?? null;
}

export function getModelProcessableMimeType(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }

  return inferProcessableMimeTypeFromFilename(file.name) ?? file.type;
}

async function extractPdf(file: File): Promise<FileExtractionMetadata> {
  const parser = new PDFParser(null, false);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<Output>((resolve, reject) => {
      parser.once('pdfParser_dataError', (errorData: { parserError: Error } | Error) => {
        reject(errorData instanceof Error ? errorData : errorData.parserError);
      });
      parser.once('pdfParser_dataReady', resolve);
      parser.parseBuffer(buffer, 0);
    });

    const pages = result.Pages.map((page, index) => ({
      pageNumber: index + 1,
      text: extractTextFromPdfPage(page),
    }));

    return {
      status: 'extracted',
      strategy: 'pdf',
      pages,
    };
  } finally {
    parser.destroy();
  }
}

function extractTextFromPdfPage(page: Page): string {
  return page.Texts
    .map((text) => text.R.map((run) => run.T).join(''))
    .map((text) => text.replace(/\u0000/g, '').trim())
    .filter(Boolean)
    .join('\n');
}

async function extractDocx(file: File): Promise<FileExtractionMetadata> {
  const result = await mammoth.extractRawText({
    buffer: Buffer.from(await file.arrayBuffer()),
  });
  const text = result.value.replace(/\u0000/g, '');

  return {
    status: 'extracted',
    strategy: 'docx',
    text,
  };
}

export async function extractFileForModel(
  file: File,
  mimeType = getModelProcessableMimeType(file)
): Promise<FileExtractionMetadata> {
  if (isImageMimeType(mimeType)) {
    return {
      status: 'not_applicable',
      strategy: 'image',
    };
  }

  if (!isTextExtractableMimeType(mimeType) && !isStructuredExtractableMimeType(mimeType)) {
    return {
      status: 'unsupported',
      strategy: 'none',
      error: `Unsupported file type for text extraction: ${mimeType || 'unknown'}`,
    };
  }

  try {
    if (mimeType === PDF_MIME_TYPE) {
      return await extractPdf(file);
    }

    if (mimeType === DOCX_MIME_TYPE) {
      return await extractDocx(file);
    }

    const rawText = await file.text();
    const normalizedText = rawText.replace(/\u0000/g, '');

    return {
      status: 'extracted',
      strategy: 'text',
      text: normalizedText,
    };
  } catch (error) {
    return {
      status: 'failed',
      strategy: 'text',
      error: error instanceof Error ? error.message : 'Unknown extraction error',
    };
  }
}

export function formatExtractedFileForModel(params: {
  filename: string;
  mimeType: string;
  extraction: FileExtractionMetadata | undefined;
}): string {
  const { filename, mimeType, extraction } = params;

  if (!extraction || extraction.status !== 'extracted' || typeof extraction.text !== 'string') {
    if (extraction?.status === 'extracted' && extraction.pages) {
      return [
        '<attached_file>',
        `name: ${filename}`,
        `mime_type: ${mimeType}`,
        '<content>',
        ...extraction.pages.flatMap((page) => [
          `<page=${page.pageNumber}>`,
          page.text,
          '</page>',
        ]),
        '</content>',
        '</attached_file>',
      ].join('\n');
    }

    return [
      '<attached_file>',
      `name: ${filename}`,
      `mime_type: ${mimeType}`,
      'status: unavailable',
      extraction?.error ? `error: ${extraction.error}` : undefined,
      '</attached_file>',
    ].filter(Boolean).join('\n');
  }

  return [
    '<attached_file>',
    `name: ${filename}`,
    `mime_type: ${mimeType}`,
    '<content>',
    extraction.text,
    '</content>',
    '</attached_file>',
  ].join('\n');
}
