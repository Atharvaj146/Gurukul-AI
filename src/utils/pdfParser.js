/**
 * pdfParser.js — Client-side PDF text extraction using pdf.js
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}

export default { extractTextFromPDF };
