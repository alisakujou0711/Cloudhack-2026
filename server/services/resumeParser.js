const path = require('path');
const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');

async function extractText(buffer, filename, mimetype) {
  const ext = path.extname(filename || '').toLowerCase();

  if (ext === '.pdf' || mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (
    ext === '.docx' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === '.txt' || ext === '.md' || (mimetype || '').startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type "${ext || mimetype}". Please upload a PDF, DOCX, or TXT file.`);
}

module.exports = { extractText };
