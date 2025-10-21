package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.dto.ReportDataDTO;
import com.alberto.Spendee.sass.dto.ReportFilterDTO;
import com.alberto.Spendee.sass.service.PDFReportService;
import com.alberto.Spendee.sass.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final PDFReportService pdfReportService;

    @PostMapping("/generate")
    public ResponseEntity<ReportDataDTO> generateReport(
            @RequestBody ReportFilterDTO filter,
            @AuthenticationPrincipal User user) {
        try {
            ReportDataDTO report = reportService.generateReport(filter, user);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/download-pdf")
    public ResponseEntity<byte[]> downloadPDF(
            @RequestBody ReportFilterDTO filter,
            @AuthenticationPrincipal User user) {
        try {
            ReportDataDTO reportData = reportService.generateReport(filter, user);
            byte[] pdfBytes = pdfReportService.generatePDFReport(reportData, user);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "financial-report.pdf");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

