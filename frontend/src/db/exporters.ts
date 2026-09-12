import { getDb } from './client';
import { downloadText, downloadBlob } from './download';

/**
 * Client-side ports of the old server-side PDF/Excel/CSV export routes — same content,
 * generated in the browser. jsPDF/xlsx are dynamically imported so their ~150KB isn't
 * part of every page load — only Reports page visitors who actually tap export pay for it.
 */

async function loadExportData() {
  const db = await getDb();
  const [expenses, categories, loans, salaries] = await Promise.all([
    db.getAll('expenses'),
    db.getAll('categories'),
    db.getAll('loans'),
    db.getAll('salaries'),
  ]);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const expensesWithCategory = expenses
    .map((e) => ({ ...e, categoryName: catMap.get(e.categoryId)?.name || 'General' }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return { expenses: expensesWithCategory, loans, salaries: salaries.slice(0, 12) };
}

export async function exportPdf(currency = '₹') {
  const [{ expenses, loans, salaries }, { default: jsPDF }, { default: autoTable }] = await Promise.all([
    loadExportData(),
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Smart Expense & Loan Manager Report', 105, 16, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });
  doc.setTextColor(0);

  let y = 32;
  doc.setFontSize(13);
  doc.text('Salary Summary', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Month', 'Company', 'In-Hand', 'Gross']],
    body: salaries.map((s) => [s.month, s.companyName, `${currency}${s.inHandSalary.toLocaleString('en-IN')}`, `${currency}${s.monthlySalary.toLocaleString('en-IN')}`]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [17, 134, 172] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(13);
  doc.text('Active Loans Summary', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Loan', 'Bank', 'Outstanding', 'Original', 'EMI']],
    body: loans.map((l) => [
      l.name,
      l.bankName || 'N/A',
      `${currency}${l.outstandingBalance.toLocaleString('en-IN')}`,
      `${currency}${l.amount.toLocaleString('en-IN')}`,
      `${currency}${l.emiAmount.toLocaleString('en-IN')}`,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [17, 134, 172] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(13);
  doc.text('Recent Expenses', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Title', 'Category', 'Method', 'Amount']],
    body: expenses.slice(0, 100).map((e) => [
      new Date(e.date).toLocaleDateString('en-IN'),
      e.title,
      e.categoryName,
      e.paymentMethod,
      `${currency}${e.amount.toLocaleString('en-IN')}`,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [17, 134, 172] },
    margin: { left: 14, right: 14 },
  });

  doc.save('SmartFinance_Report.pdf');
}

export async function exportExcel() {
  const [{ expenses, loans }, XLSX] = await Promise.all([loadExportData(), import('xlsx')]);
  const wb = XLSX.utils.book_new();

  const expenseSheet = XLSX.utils.json_to_sheet(
    expenses.map((e) => ({
      ID: e.id,
      Title: e.title,
      Category: e.categoryName,
      Amount: e.amount,
      'Payment Method': e.paymentMethod,
      Date: new Date(e.date).toLocaleDateString('en-IN'),
    }))
  );
  XLSX.utils.book_append_sheet(wb, expenseSheet, 'Expenses');

  const loanSheet = XLSX.utils.json_to_sheet(
    loans.map((l) => ({
      'Loan Name': l.name,
      Type: l.type,
      Bank: l.bankName || 'N/A',
      Amount: l.amount,
      Outstanding: l.outstandingBalance,
      EMI: l.emiAmount,
      Status: l.status,
    }))
  );
  XLSX.utils.book_append_sheet(wb, loanSheet, 'Loans');

  const buf: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'SmartFinance_Export.xlsx');
}

export async function exportCsv() {
  const { expenses } = await loadExportData();
  let csv = 'Date,Title,Category,Payment Method,Amount,Notes\n';
  for (const e of expenses) {
    const dateStr = new Date(e.date).toLocaleDateString('en-IN');
    const title = (e.title || '').replace(/,/g, ' ');
    const category = e.categoryName.replace(/,/g, ' ');
    const notes = (e.notes || '').replace(/,/g, ' ');
    csv += `${dateStr},"${title}","${category}",${e.paymentMethod},${e.amount},"${notes}"\n`;
  }
  downloadText(csv, 'Expenses_Export.csv', 'text/csv');
}
