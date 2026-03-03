import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

// Xuất CSV (Excel)
export const exportToCSV = (data, filename = 'report.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Xuất PDF
export const exportToPDF = (headers, data, title = 'Bao cao') => {
  const doc = new jsPDF();
  doc.text(title, 14, 22);
  
  doc.autoTable({
    head: [headers],
    body: data.map(obj => Object.values(obj)),
    startY: 30,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10 }
  });

  doc.save(`${title}.pdf`);
};