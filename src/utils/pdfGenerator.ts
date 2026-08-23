import { jsPDF } from 'jspdf';
import { InterpretationResponse } from '../types';

export function generateInterpretationPDF(
  data: InterpretationResponse,
  language: 'sw' | 'en' | 'both' = 'both'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 15;
      drawTanzaniaHeaderStripe();
    }
  };

  const drawTanzaniaHeaderStripe = () => {
    // Tanzanian flag banner accents (Green, Yellow, Black, Yellow, Blue)
    const stripeHeight = 3;
    const w = contentWidth / 4;
    doc.setFillColor(30, 181, 58); // Tanzania Green
    doc.rect(margin, y, w, stripeHeight, 'F');
    doc.setFillColor(252, 209, 22); // Tanzania Yellow
    doc.rect(margin + w, y, w, stripeHeight, 'F');
    doc.setFillColor(15, 23, 42); // Black
    doc.rect(margin + w * 2, y, w, stripeHeight, 'F');
    doc.setFillColor(0, 163, 221); // Tanzania Blue
    doc.rect(margin + w * 3, y, w, stripeHeight, 'F');
    y += stripeHeight + 5;
  };

  // Initial header banner
  drawTanzaniaHeaderStripe();

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('TANZANIA PATIENT RADIOLOGY INTERPRETATION', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('Ufafanuzi wa Ripoti ya Eksirei, Ultrasound & Picha za Kitabibu', margin, y);
  y += 7;

  // Metadata badge box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
  
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(`Modality / Aina ya Kipimo:`, margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.modality} (${data.modality_sw || ''})`, margin + 45, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text(`Body Region / Sehemu:`, margin + 4, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.bodyRegion} (${data.bodyRegion_sw || ''})`, margin + 45, y + 10);

  const dateStr = new Date().toLocaleDateString('sw-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.setFont('helvetica', 'italic');
  doc.text(`Tarehe: ${dateStr}`, margin + contentWidth - 35, y + 5);
  y += 18;

  // Privacy Notice
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(6, 95, 70);
  doc.setFont('helvetica', 'bold');
  doc.text('FARAGHA / PRIVACY: Ripoti hii haihifadhiwi kwenye mfumo wowote (Zero Data Storage).', margin + 4, y + 5.5);
  y += 13;

  // Section 1: Plain Language Summary
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 181, 58); // Tanzania Green
  doc.text('1. MUHTASARI KWA LUGHA RAHISI / PLAIN LANGUAGE SUMMARY', margin, y);
  y += 6;

  if (language === 'sw' || language === 'both') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Kiswahili (Maelezo Rahisi):', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const swLines = doc.splitTextToSize(data.overallSummary_sw, contentWidth);
    doc.text(swLines, margin, y);
    y += swLines.length * 4.5 + 4;
  }

  if (language === 'en' || language === 'both') {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('English (Plain Summary):', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const enLines = doc.splitTextToSize(data.overallSummary_en, contentWidth);
    doc.text(enLines, margin, y);
    y += enLines.length * 4.5 + 6;
  }

  // Section 2: Key Findings
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 163, 221); // Tanzania Blue
  doc.text('2. MATOKEO MUHIMU / KEY FINDINGS', margin, y);
  y += 6;

  data.keyFindings.forEach((finding, idx) => {
    checkPageBreak(25);
    const isNormal = finding.status === 'normal';
    doc.setFillColor(isNormal ? 240 : 254, isNormal ? 253 : 243, isNormal ? 244 : 242);
    doc.setDrawColor(isNormal ? 187 : 252, isNormal ? 247 : 165, isNormal ? 208 : 165);
    
    // Status text
    const statusLabel = isNormal ? 'KAWAIDA / NORMAL' : 'JADILIANA NA DAKTARI / DISCUSS WITH DOCTOR';
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${finding.title_sw} (${finding.title_en})`, margin, y);
    
    doc.setFontSize(7.5);
    doc.setTextColor(isNormal ? 22 : 194, isNormal ? 101 : 65, isNormal ? 52 : 12);
    doc.text(`[${statusLabel}]`, margin + contentWidth - 45, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const findingDesc = language === 'sw' 
      ? finding.explanation_sw 
      : language === 'en' 
        ? finding.explanation_en 
        : `Kiswahili: ${finding.explanation_sw}\nEnglish: ${finding.explanation_en}`;
    const descLines = doc.splitTextToSize(findingDesc, contentWidth - 4);
    doc.text(descLines, margin + 2, y);
    y += descLines.length * 4 + 4;
  });

  // Section 3: Medical Terms Glossary
  if (data.medicalTermsGlossary && data.medicalTermsGlossary.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('3. KAMUSI YA MANENO YA KITABIBU / MEDICAL GLOSSARY', margin, y);
    y += 6;

    data.medicalTermsGlossary.forEach((termItem) => {
      checkPageBreak(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${termItem.term}:`, margin, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const meaningText = language === 'sw'
        ? termItem.meaning_sw
        : language === 'en'
          ? termItem.meaning_en
          : `SW: ${termItem.meaning_sw} | EN: ${termItem.meaning_en}`;
      const meaningLines = doc.splitTextToSize(meaningText, contentWidth - 6);
      doc.text(meaningLines, margin + 4, y);
      y += meaningLines.length * 3.8 + 2.5;
    });
    y += 3;
  }

  // Section 4: Questions for Doctor
  if (data.questionsForDoctor_sw && data.questionsForDoctor_sw.length > 0) {
    checkPageBreak(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 181, 58);
    doc.text('4. MASWALI YA KUMUULIZA DAKTARI / QUESTIONS FOR YOUR DOCTOR', margin, y);
    y += 6;

    data.questionsForDoctor_sw.forEach((qSw, i) => {
      checkPageBreak(16);
      const qEn = data.questionsForDoctor_en[i] || '';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Q${i + 1}: ${qSw}`, margin, y);
      y += 4;

      if (qEn && language !== 'sw') {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const enQ = doc.splitTextToSize(`(${qEn})`, contentWidth - 6);
        doc.text(enQ, margin + 4, y);
        y += enQ.length * 3.5 + 2;
      }
    });
    y += 4;
  }

  // Section 5: Mandatory Disclaimer Box
  checkPageBreak(35);
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(248, 113, 113);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28);
  doc.text('TAHADHARI YA KISHERIA & KITABIBU / MANDATORY MEDICAL DISCLAIMER:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(127, 29, 29);
  const disclaimerSw = doc.splitTextToSize(
    'Ufafanuzi huu umetolewa na AI ili kukusaidia kuelewa maneno ya ripoti yako. SI mbadala wa ushauri wa daktari, HAUTOI utabiri wa maisha/ugonjwa (prognosis), na unaweza kuwa na makosa. Daima muone daktari wako.',
    contentWidth - 8
  );
  doc.text(disclaimerSw, margin + 4, y + 10);

  const disclaimerEn = doc.splitTextToSize(
    'This interpretation is generated by AI to help explain medical terminology. It is NOT a substitute for a qualified doctor\'s consultation, provides NO prognosis, and may contain errors. Please consult your physician.',
    contentWidth - 8
  );
  doc.text(disclaimerEn, margin + 4, y + 17);

  return doc;
}
