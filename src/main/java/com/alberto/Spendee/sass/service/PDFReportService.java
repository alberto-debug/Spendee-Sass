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

    // Professional palette and typography
    private static final BaseColor TEXT_DARK = new BaseColor(45, 55, 72);          // slate-800
    private static final BaseColor TEXT_MUTED = new BaseColor(100, 116, 139);      // slate-500
    private static final BaseColor ACCENT_GREEN = new BaseColor(16, 185, 129);     // emerald-500
    private static final BaseColor ACCENT_RED = new BaseColor(220, 38, 38);        // red-600
    private static final BaseColor TABLE_HEADER_BG = new BaseColor(248, 250, 252); // slate-50
    private static final BaseColor CARD_BG = new BaseColor(247, 249, 252);         // subtle card bg
    private static final BaseColor BORDER_LIGHT = new BaseColor(226, 232, 240);    // slate-200

    // Fonts (more conservative for a statement look)
    private static final Font COMPANY_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, TEXT_DARK);
    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, TEXT_DARK);
    private static final Font HEADING_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, TEXT_DARK);
    private static final Font SUBHEADING_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, TEXT_DARK);
    private static final Font NORMAL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.BLACK);
    private static final Font SMALL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_MUTED);
    private static final Font WHITE_ICON_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE);

    public byte[] generatePDFReport(ReportDataDTO reportData, User user) throws Exception {
        Document document = new Document(PageSize.A4, 40, 40, 60, 60);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, baos);

        // Add header and footer
        HeaderFooter headerFooter = new HeaderFooter(user);
        writer.setPageEvent(headerFooter);

        document.open();

        // Add company logo/title section
        addHeader(document, user, writer);

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

    // Header now includes a compact money icon and smaller company name
    private void addHeader(Document document, User user, PdfWriter writer) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setSpacingAfter(12);
        headerTable.setWidths(new float[]{3f, 2f});

        // Left side: icon + company
        PdfPCell left = new PdfPCell();
        left.setBorder(Rectangle.NO_BORDER);

        // Build a small inline table with icon and company texts
        PdfPTable brand = new PdfPTable(2);
        brand.setWidthPercentage(100);
        brand.setWidths(new float[]{0.4f, 4.6f});

        // Money icon - simple green circle with $
        PdfPCell iconCell = new PdfPCell(new Phrase("$", WHITE_ICON_FONT));
        iconCell.setFixedHeight(20f);
        iconCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        iconCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        iconCell.setBackgroundColor(ACCENT_GREEN);
        iconCell.setBorder(Rectangle.NO_BORDER);
        iconCell.setPadding(0);
        iconCell.setUseAscender(true);
        iconCell.setUseDescender(true);

        PdfPCell companyCell = new PdfPCell();
        companyCell.setBorder(Rectangle.NO_BORDER);
        Paragraph companyName = new Paragraph("Spendee Financial", COMPANY_FONT);
        Paragraph tagline = new Paragraph("Financial Management System", SMALL_FONT);
        companyName.setSpacingAfter(0);
        companyCell.addElement(companyName);
        companyCell.addElement(tagline);

        brand.addCell(iconCell);
        brand.addCell(companyCell);
        left.addElement(brand);

        // Right side: user info aligned right
        PdfPCell right = new PdfPCell();
        right.setBorder(Rectangle.NO_BORDER);
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph userName = new Paragraph(user.getFirstName() + " " + user.getLastName(), SUBHEADING_FONT);
        userName.setAlignment(Element.ALIGN_RIGHT);
        Paragraph userEmail = new Paragraph(user.getEmail(), SMALL_FONT);
        userEmail.setAlignment(Element.ALIGN_RIGHT);
        right.addElement(userName);
        right.addElement(userEmail);

        headerTable.addCell(left);
        headerTable.addCell(right);
        document.add(headerTable);

        // Thin professional divider line
        PdfContentByte cb = writer.getDirectContent();
        cb.saveState();
        cb.setLineWidth(0.5f);
        cb.setColorStroke(BORDER_LIGHT);
        cb.moveTo(document.left(), document.top() - 5);
        cb.lineTo(document.right(), document.top() - 5);
        cb.stroke();
        cb.restoreState();

        document.add(Chunk.NEWLINE);
    }

    private void addReportTitle(Document document, ReportDataDTO reportData) throws DocumentException {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy");

        Paragraph title = new Paragraph("Financial Report", TITLE_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(6);
        document.add(title);

        Paragraph dateRange = new Paragraph(
            reportData.getStartDate().format(formatter) + " - " + reportData.getEndDate().format(formatter),
            NORMAL_FONT
        );
        dateRange.setAlignment(Element.ALIGN_CENTER);
        dateRange.setSpacingAfter(16);
        document.add(dateRange);
    }

    private void addExecutiveSummary(Document document, ReportDataDTO reportData) throws DocumentException {
        Paragraph heading = new Paragraph("Executive Summary", HEADING_FONT);
        heading.setSpacingBefore(6);
        heading.setSpacingAfter(10);
        document.add(heading);

        PdfPTable summaryTable = new PdfPTable(3);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingAfter(14);

        addSummaryCard(summaryTable, "Total Income", reportData.getTotalIncome(), ACCENT_GREEN);
        addSummaryCard(summaryTable, "Total Expenses", reportData.getTotalExpense(), ACCENT_RED);
        addSummaryCard(summaryTable, "Net Savings", reportData.getNetSavings(),
            reportData.getNetSavings().compareTo(BigDecimal.ZERO) >= 0 ? ACCENT_GREEN : ACCENT_RED);

        document.add(summaryTable);
    }

    private void addSummaryCard(PdfPTable table, String label, BigDecimal amount, BaseColor color) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(12);
        cell.setBackgroundColor(CARD_BG);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(BORDER_LIGHT);
        cell.setBorderWidth(1f);

        Paragraph labelPara = new Paragraph(label, SMALL_FONT);
        labelPara.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(labelPara);

        Font amountFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, color);
        Paragraph amountPara = new Paragraph("$" + String.format("%,.2f", amount), amountFont);
        amountPara.setAlignment(Element.ALIGN_CENTER);
        amountPara.setSpacingBefore(4);
        cell.addElement(amountPara);

        table.addCell(cell);
    }

    private void addFinancialOverview(Document document, ReportDataDTO reportData) throws DocumentException {
        if (reportData.getTimeSeriesData().isEmpty()) {
            return;
        }

        Paragraph heading = new Paragraph("Financial Overview", HEADING_FONT);
        heading.setSpacingBefore(6);
        heading.setSpacingAfter(10);
        document.add(heading);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

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
        heading.setSpacingBefore(6);
        heading.setSpacingAfter(10);
        document.add(heading);

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);
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
        heading.setSpacingBefore(6);
        heading.setSpacingAfter(10);
        document.add(heading);

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new int[]{2, 3, 2, 2, 2});
        table.setSpacingAfter(16);

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
        Phrase phrase = new Phrase(text, SUBHEADING_FONT);
        PdfPCell cell = new PdfPCell(phrase);
        cell.setBackgroundColor(TABLE_HEADER_BG);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(8);
        cell.setBorderColor(BORDER_LIGHT);
        cell.setBorderWidth(1f);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, NORMAL_FONT));
        cell.setHorizontalAlignment(alignment);
        cell.setPadding(8);
        cell.setBorderColor(BORDER_LIGHT);
        table.addCell(cell);
    }

    private void addFooterNote(Document document) throws DocumentException {
        Paragraph footer = new Paragraph(
            "This report is generated automatically by Spendee Financial Management System. " +
            "All amounts are displayed in your selected currency.",
            SMALL_FONT
        );
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(24);
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

