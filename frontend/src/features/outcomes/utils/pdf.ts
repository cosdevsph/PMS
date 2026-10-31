import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1122;
const PDF_WIDTH_MM = 210;
const PDF_HEIGHT_MM = 297;

/** Renders a React element off-screen at A4 width and returns it as a (multi-page) PDF. */
export const renderToPdfBlob = async (element: ReactElement): Promise<Blob> => {
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:${A4_WIDTH_PX}px;background:white;z-index:-1;overflow:visible`;
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    root.render(element);
    await new Promise<void>((resolve) => setTimeout(resolve, 1200)); // let the content and chart draw
    await Promise.all(
      Array.from(container.querySelectorAll('img')).map((img) =>
        img.complete ? Promise.resolve() : new Promise<void>((done) => { img.onload = () => done(); img.onerror = () => done(); }),
      ),
    );

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: A4_WIDTH_PX,
      height: Math.max(container.scrollHeight, A4_HEIGHT_PX),
      windowWidth: A4_WIDTH_PX,
    });
    const image = canvas.toDataURL('image/jpeg', 0.95);
    const heightMm = (canvas.height * PDF_WIDTH_MM) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(image, 'JPEG', 0, 0, PDF_WIDTH_MM, heightMm);
    let left = heightMm - PDF_HEIGHT_MM;
    let offset = 0;
    while (left > 0) {
      offset -= PDF_HEIGHT_MM;
      pdf.addPage();
      pdf.addImage(image, 'JPEG', 0, offset, PDF_WIDTH_MM, heightMm);
      left -= PDF_HEIGHT_MM;
    }
    return pdf.output('blob');
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
};
