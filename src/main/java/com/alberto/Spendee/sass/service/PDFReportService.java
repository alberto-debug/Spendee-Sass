package com.alberto.Spendee.sass.service;

import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.ReportDataDTO;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PDFReportService {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, BaseColor.DARK_GRAY);
    private static final Font HEADING_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.DARK_GRAY);
    private static final Font SUBHEADING_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.DARK_GRAY);
    private static final Font NORMAL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
    private static final Font SMALL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, BaseColor.GRAY);

    public byte[] generatePDFReport(ReportDataDTO reportData, User user) throws Exception {
        Document document = new Document(PageSize.A4, 40, 40, 60, 60);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, baos);

        // Add header and footer
        HeaderFooter headerFooter = new HeaderFooter(user);
        writer.setPageEvent(headerFooter);

        document.open();

        // Add company logo/title section
        addHeader(document, user);

        // Add report title and date range
        addReportTitle(document, reportData);

        // Add executive summary
        addExecutiveSummary(document, reportData);

        // Add financial overview chart section
        addFinancialOverview(document, reportData);

        // Add category breakdown
        if (!reportData.getCategoryBreakdown().isEmpty()) {
            addCategoryBreakdown(document, reportData);
        }

        // Add transactions table
        addTransactionsTable(document, reportData);

        // Add footer note
        addFooterNote(document);

        document.close();
        return baos.toByteArray();
    }

    private void addHeader(Document document, User user) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(20);

        // Company name/logo
        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.NO_BORDER);
        Paragraph companyName = new Paragraph("Spendee Financial", TITLE_FONT);
        companyName.setAlignment(Element.ALIGN_LEFT);
        logoCell.addElement(companyName);
        Paragraph tagline = new Paragraph("Financial Management System", SMALL_FONT);
        logoCell.addElement(tagline);

        // User info
        PdfPCell userCell = new PdfPCell();
        userCell.setBorder(Rectangle.NO_BORDER);
        userCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph userName = new Paragraph(user.getFirstName() + " " + user.getLastName(), SUBHEADING_FONT);
        userName.setAlignment(Element.ALIGN_RIGHT);
        userCell.addElement(userName);
        Paragraph userEmail = new Paragraph(user.getEmail(), SMALL_FONT);
        userEmail.setAlignment(Element.ALIGN_RIGHT);
        userCell.addElement(userEmail);

        headerTable.addCell(logoCell);
        headerTable.addCell(userCell);

        document.add(headerTable);

        // Add horizontal line using Chunk with underline
        Chunk linebreak = new Chunk(new String(new char[100]).replace('\0', '_'));
        linebreak.setFont(FontFactory.getFont(FontFactory.HELVETICA, 1, new BaseColor(99, 102, 241)));
        document.add(linebreak);
        document.add(Chunk.NEWLINE);
    }

    private void addReportTitle(Document document, ReportDataDTO reportData) throws DocumentException {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        Paragraph title = new Paragraph("Financial Report", HEADING_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(10);
        document.add(title);

        Paragraph dateRange = new Paragraph(
            reportData.getStartDate().format(formatter) + " - " + reportData.getEndDate().format(formatter),
            NORMAL_FONT
        );
        dateRange.setAlignment(Element.ALIGN_CENTER);
        dateRange.setSpacingAfter(20);
        document.add(dateRange);
    }

    private void addExecutiveSummary(Document document, ReportDataDTO reportData) throws DocumentException {
        Paragraph heading = new Paragraph("Executive Summary", HEADING_FONT);
        heading.setSpacingBefore(10);
        heading.setSpacingAfter(15);
        document.add(heading);

        PdfPTable summaryTable = new PdfPTable(3);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingAfter(20);

        // Header cells with background color
        BaseColor headerColor = new BaseColor(99, 102, 241);

        addSummaryCard(summaryTable, "Total Income", reportData.getTotalIncome(), new BaseColor(16, 185, 129));
        addSummaryCard(summaryTable, "Total Expenses", reportData.getTotalExpense(), new BaseColor(239, 68, 68));
        addSummaryCard(summaryTable, "Net Savings", reportData.getNetSavings(),
            reportData.getNetSavings().compareTo(BigDecimal.ZERO) >= 0 ?
            new BaseColor(16, 185, 129) : new BaseColor(239, 68, 68));

        document.add(summaryTable);
    }

    private void addSummaryCard(PdfPTable table, String label, BigDecimal amount, BaseColor color) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(15);
        cell.setBackgroundColor(new BaseColor(245, 247, 250));
        cell.setBorder(Rectangle.NO_BORDER);

        Paragraph labelPara = new Paragraph(label, SMALL_FONT);
        labelPara.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(labelPara);

        Font amountFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, color);
        Paragraph amountPara = new Paragraph("$" + String.format("%,.2f", amount), amountFont);
        amountPara.setAlignment(Element.ALIGN_CENTER);
        amountPara.setSpacingBefore(5);
        cell.addElement(amountPara);

        table.addCell(cell);
    }

    private void addFinancialOverview(Document document, ReportDataDTO reportData) throws DocumentException {
        if (reportData.getTimeSeriesData().isEmpty()) {
            return;
        }

        Paragraph heading = new Paragraph("Financial Overview", HEADING_FONT);
        heading.setSpacingBefore(10);
        heading.setSpacingAfter(15);
        document.add(heading);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setSpacingAfter(20);

        // Headers
        addTableHeader(table, "Period");
        addTableHeader(table, "Income");
        addTableHeader(table, "Expenses");

        // Data rows
        for (ReportDataDTO.TimeSeriesDataDTO data : reportData.getTimeSeriesData()) {
            addTableCell(table, data.getPeriod(), Element.ALIGN_LEFT);
            addTableCell(table, "$" + String.format("%,.2f", data.getIncome()), Element.ALIGN_RIGHT);
            addTableCell(table, "$" + String.format("%,.2f", data.getExpense()), Element.ALIGN_RIGHT);
        }

        document.add(table);
    }

    private void addCategoryBreakdown(Document document, ReportDataDTO reportData) throws DocumentException {
        Paragraph heading = new Paragraph("Category Breakdown", HEADING_FONT);
        heading.setSpacingBefore(10);
        heading.setSpacingAfter(15);
        document.add(heading);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(20);
        table.setWidths(new int[]{3, 1});

        addTableHeader(table, "Category");
        addTableHeader(table, "Amount");

        reportData.getCategoryBreakdown().entrySet().stream()
            .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
            .forEach(entry -> {
                addTableCell(table, entry.getKey(), Element.ALIGN_LEFT);
                addTableCell(table, "$" + String.format("%,.2f", entry.getValue()), Element.ALIGN_RIGHT);
            });

        document.add(table);
    }

    private void addTransactionsTable(Document document, ReportDataDTO reportData) throws DocumentException {
        Paragraph heading = new Paragraph("Transaction Details", HEADING_FONT);
        heading.setSpacingBefore(10);
        heading.setSpacingAfter(15);
        document.add(heading);

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new int[]{2, 3, 2, 2, 2});
        table.setSpacingAfter(20);

        addTableHeader(table, "Date");
        addTableHeader(table, "Description");
        addTableHeader(table, "Category");
        addTableHeader(table, "Type");
        addTableHeader(table, "Amount");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        for (ReportDataDTO.TransactionSummaryDTO transaction : reportData.getTransactions()) {
            addTableCell(table, transaction.getDate().format(formatter), Element.ALIGN_LEFT);
            addTableCell(table, transaction.getDescription(), Element.ALIGN_LEFT);
            addTableCell(table, transaction.getCategory(), Element.ALIGN_LEFT);
            addTableCell(table, transaction.getType(), Element.ALIGN_CENTER);

            String amountStr = (transaction.getType().equals("EXPENSE") ? "-" : "+") +
                             "$" + String.format("%,.2f", transaction.getAmount());
            addTableCell(table, amountStr, Element.ALIGN_RIGHT);
        }

        document.add(table);
    }

    private void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, SUBHEADING_FONT));
        cell.setBackgroundColor(new BaseColor(99, 102, 241));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(10);
        cell.setBorderColor(BaseColor.WHITE);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(8);
        cell.setBorderColor(new BaseColor(220, 220, 220));
        table.addCell(cell);
    }

    private void addFooterNote(Document document) throws DocumentException {
        Paragraph footer = new Paragraph(
            "This report is generated automatically by Spendee Financial Management System. " +
            "All amounts are displayed in your selected currency.",
            SMALL_FONT
        );
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(30);
        document.add(footer);
    }

    // Header and Footer event handler
    static class HeaderFooter extends PdfPageEventHelper {
        private final User user;

        public HeaderFooter(User user) {
            this.user = user;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();

            // Add page number
            Phrase pageNumber = new Phrase("Page " + writer.getPageNumber(), SMALL_FONT);
            ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                pageNumber,
                (document.right() - document.left()) / 2 + document.leftMargin(),
                document.bottom() - 20, 0);
        }
    }
}

