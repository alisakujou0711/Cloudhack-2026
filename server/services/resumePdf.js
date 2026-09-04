const PDFDocument = require('pdfkit');

// Builds a formatted resume PDF from resolved (post-review) sections — plain bullet strings,
// not the diff {original, suggestion} shape used during review.
function buildResumePdf({ name, contact, sections }) {
  const doc = new PDFDocument({ margin: 54, size: 'A4' });

  doc.font('Helvetica-Bold').fontSize(18).text(name || 'Resume');
  if (contact) {
    doc.moveDown(0.15);
    doc.font('Helvetica').fontSize(9.5).fillColor('#444').text(contact);
    doc.fillColor('black');
  }

  for (const section of sections || []) {
    if (!(section.entries || []).length) continue;
    doc.moveDown(0.6);
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#333366')
      .text((section.name || '').toUpperCase());
    doc.fillColor('black');
    doc
      .moveTo(doc.x, doc.y + 2)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
      .strokeColor('#333366')
      .lineWidth(0.75)
      .stroke();
    doc.moveDown(0.3);

    for (const entry of section.entries || []) {
      const headerLine = [entry.title, entry.subtitle].filter(Boolean).join('  —  ');
      const dateSuffix = entry.dateRange ? `    (${entry.dateRange})` : '';
      if (headerLine) {
        doc.font('Helvetica-Bold').fontSize(10).text(headerLine, { continued: Boolean(dateSuffix) });
        if (dateSuffix) {
          doc.font('Helvetica').fontSize(9).fillColor('#666').text(dateSuffix);
          doc.fillColor('black');
        }
      }
      for (const bullet of entry.bullets || []) {
        if (!bullet) continue;
        doc.font('Helvetica').fontSize(9.5).text(`•  ${bullet}`, { indent: 10, lineGap: 1 });
      }
      doc.moveDown(0.35);
    }
  }

  return doc;
}

module.exports = { buildResumePdf };
