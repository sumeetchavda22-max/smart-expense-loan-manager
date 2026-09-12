import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();
const router = Router();

// 1. PDF Export
router.get('/pdf', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { category: true, account: true },
      orderBy: { date: 'desc' },
      take: 100,
    });

    const loans = await prisma.loan.findMany();
    const salaries = await prisma.salary.findMany({ take: 12 });

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=SmartFinance_Report.pdf');

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Smart Expense & Loan Manager Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(14).text('Salary Summary', { underline: true });
    doc.moveDown(0.5);
    salaries.forEach((s) => {
      doc.fontSize(10).text(`${s.month} - ${s.companyName}: In-Hand ₹${s.inHandSalary.toLocaleString()} (Gross: ₹${s.monthlySalary.toLocaleString()})`);
    });

    doc.moveDown(2);
    doc.fontSize(14).text('Active Loans Summary', { underline: true });
    doc.moveDown(0.5);
    loans.forEach((l) => {
      doc.fontSize(10).text(`${l.name} (${l.bankName || 'N/A'}): Outstanding ₹${l.outstandingBalance.toLocaleString()} / Original ₹${l.amount.toLocaleString()} - Monthly EMI: ₹${l.emiAmount.toLocaleString()}`);
    });

    doc.moveDown(2);
    doc.fontSize(14).text('Recent Expenses', { underline: true });
    doc.moveDown(0.5);
    expenses.forEach((e) => {
      const dateStr = new Date(e.date).toLocaleDateString();
      doc.fontSize(9).text(`${dateStr} | ${e.title} | ${e.category?.name || 'General'} | ${e.paymentMethod} | ₹${e.amount.toLocaleString()}`);
    });

    doc.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Excel Export
router.get('/excel', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Expenses Sheet
    const expenseSheet = workbook.addWorksheet('Expenses');
    expenseSheet.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Title', key: 'title', width: 20 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Amount', key: 'amount', width: 12 },
      { header: 'Payment Method', key: 'method', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
    ];

    const expenses = await prisma.expense.findMany({ include: { category: true } });
    expenses.forEach((e) => {
      expenseSheet.addRow({
        id: e.id,
        title: e.title,
        category: e.category?.name || 'N/A',
        amount: e.amount,
        method: e.paymentMethod,
        date: new Date(e.date).toLocaleDateString(),
      });
    });

    // Loans Sheet
    const loanSheet = workbook.addWorksheet('Loans');
    loanSheet.columns = [
      { header: 'Loan Name', key: 'name', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Bank', key: 'bank', width: 15 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Outstanding', key: 'outstanding', width: 15 },
      { header: 'EMI', key: 'emi', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    const loans = await prisma.loan.findMany();
    loans.forEach((l) => {
      loanSheet.addRow({
        name: l.name,
        type: l.type,
        bank: l.bankName || 'N/A',
        amount: l.amount,
        outstanding: l.outstandingBalance,
        emi: l.emiAmount,
        status: l.status,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=SmartFinance_Export.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CSV Export
router.get('/csv', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({ include: { category: true } });
    let csv = 'Date,Title,Category,Payment Method,Amount,Notes\n';

    expenses.forEach((e) => {
      const dateStr = new Date(e.date).toLocaleDateString();
      const titleClean = e.title.replace(/,/g, ' ');
      const catClean = (e.category?.name || 'General').replace(/,/g, ' ');
      const notesClean = (e.notes || '').replace(/,/g, ' ');
      csv += `${dateStr},"${titleClean}","${catClean}",${e.paymentMethod},${e.amount},"${notesClean}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=Expenses_Export.csv');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
