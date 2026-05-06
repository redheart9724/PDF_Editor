// =============================================
//   PDF HANDLER - Processes PDF files
// =============================================

const PDFHandler = {

    // Store original PDF data
    originalPDF: null,
    originalMetadata: null,
    pdfText: null,

    // LOAD PDF FROM FILE
    loadPDF: async function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async function(e) {
                try {
                    const arrayBuffer = e.target.result;

                    // Store original
                    PDFHandler.originalPDF = arrayBuffer;

                    // Extract text and metadata using PDF.js
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;

                    // Get metadata
                    const metadata = await pdf.getMetadata();
                    PDFHandler.originalMetadata = metadata;

                    // Extract text from all pages
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                    }
                    PDFHandler.pdfText = fullText;

                    resolve({
                        numPages: pdf.numPages,
                        metadata: metadata,
                        text: fullText,
                        info: metadata.info
                    });

                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    // GENERATE PDF FROM REPORT DATA
    generatePDF: async function(reportData, options = {}) {
        try {
            // Import PDFLib
            const { PDFDocument, rgb, StandardFonts } = PDFLib;

            // Create new PDF
            const pdfDoc = await PDFDocument.create();

            // Embed fonts
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

            // SET METADATA (Preserve original if available)
            const meta = reportData.metadata || {};
            pdfDoc.setTitle(reportData.general?.report_title || 'Security Report');
            pdfDoc.setAuthor(reportData.general?.tester_name || reportData.general?.analyst_name || 'Security Team');
            pdfDoc.setSubject(meta.classification || 'Confidential Security Report');
            pdfDoc.setKeywords([
                'security', 'report', 'penetration testing',
                reportData.general?.client_name || '',
                meta.report_id || ''
            ]);
            pdfDoc.setCreator('SecReport Pro v2.0');
            pdfDoc.setProducer('SecReport Pro - Security Report Generator');
            pdfDoc.setCreationDate(new Date());
            pdfDoc.setModificationDate(new Date());

            // PAGE DIMENSIONS
            const pageWidth = 595;
            const pageHeight = 842;
            const margin = 60;

            // COLORS
            const colors = {
                primary: rgb(0.145, 0.388, 0.922),
                dark: rgb(0.059, 0.090, 0.165),
                text: rgb(0.2, 0.2, 0.2),
                light: rgb(0.945, 0.969, 0.980),
                border: rgb(0.878, 0.902, 0.918),
                white: rgb(1, 1, 1),
                critical: rgb(0.937, 0.267, 0.267),
                high: rgb(0.976, 0.451, 0.086),
                medium: rgb(0.961, 0.620, 0.043),
                low: rgb(0.133, 0.769, 0.369),
                info: rgb(0.231, 0.510, 0.965),
            };

            // ─── PAGE 1: COVER PAGE ───
            const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);

            // Background header
            coverPage.drawRectangle({
                x: 0, y: pageHeight - 200,
                width: pageWidth, height: 200,
                color: colors.dark,
            });

            // Primary bar
            coverPage.drawRectangle({
                x: 0, y: pageHeight - 210,
                width: pageWidth, height: 10,
                color: colors.primary,
            });

            // Company/Tool name
            coverPage.drawText('SecReport Pro', {
                x: margin, y: pageHeight - 60,
                size: 14,
                font: helveticaBold,
                color: colors.primary,
            });

            // Classification banner
            const classColor = this.getClassColor(meta.classification || 'Confidential', colors);
            coverPage.drawRectangle({
                x: margin, y: pageHeight - 100,
                width: 150, height: 25,
                color: classColor,
                borderRadius: 3,
            });
            coverPage.drawText((meta.classification || 'CONFIDENTIAL').toUpperCase(), {
                x: margin + 10, y: pageHeight - 92,
                size: 10,
                font: helveticaBold,
                color: colors.white,
            });

            // Report Title
            const title = reportData.general?.report_title || 'Security Report';
            coverPage.drawText(title, {
                x: margin, y: pageHeight - 270,
                size: 28,
                font: timesBold,
                color: colors.dark,
                maxWidth: pageWidth - (margin * 2),
            });

            // Divider line
            coverPage.drawLine({
                start: { x: margin, y: pageHeight - 310 },
                end: { x: pageWidth - margin, y: pageHeight - 310 },
                thickness: 2,
                color: colors.primary,
            });

            // Report meta info
            const metaItems = [
                { label: 'Client', value: reportData.general?.client_name || reportData.general?.organization || 'N/A' },
                { label: 'Date', value: reportData.general?.report_date || reportData.general?.assessment_date || new Date().toLocaleDateString() },
                { label: 'Version', value: meta.doc_version || '1.0' },
                { label: 'Report ID', value: meta.report_id || 'N/A' },
                { label: 'Prepared By', value: reportData.general?.tester_name || reportData.general?.analyst_name || 'N/A' },
                { label: 'Status', value: 'Final' },
            ];

            metaItems.forEach((item, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = margin + (col * 240);
                const y = pageHeight - 360 - (row * 60);

                // Box
                coverPage.drawRectangle({
                    x: x - 5, y: y - 30,
                    width: 220, height: 45,
                    color: colors.light,
                    borderRadius: 5,
                });

                // Label
                coverPage.drawText(item.label.toUpperCase(), {
                    x: x, y: y - 10,
                    size: 8, font: helveticaBold,
                    color: colors.primary,
                });

                // Value
                coverPage.drawText(String(item.value || 'N/A').substring(0, 25), {
                    x: x, y: y - 22,
                    size: 11, font: helvetica,
                    color: colors.dark,
                });
            });

            // Footer
            coverPage.drawRectangle({
                x: 0, y: 0,
                width: pageWidth, height: 60,
                color: colors.light,
            });
            coverPage.drawText('Generated by SecReport Pro | For Authorized Use Only', {
                x: margin, y: 25,
                size: 9, font: helvetica,
                color: rgb(0.5, 0.5, 0.5),
            });

            // ─── PAGE 2: EXECUTIVE SUMMARY ───
            const summaryPage = pdfDoc.addPage([pageWidth, pageHeight]);
            this.addPageHeader(summaryPage, 'Executive Summary', 2, helveticaBold, helvetica, colors, pageWidth, pageHeight, margin);

            let yPos = pageHeight - 120;

            // Executive summary text
            const summaryText = reportData.general?.executive_summary || 'No executive summary provided.';
            const summaryLines = this.wrapText(summaryText, 75);
            summaryLines.forEach(line => {
                if (yPos < 100) return;
                summaryPage.drawText(line, {
                    x: margin, y: yPos,
                    size: 11, font: helvetica,
                    color: colors.text,
                });
                yPos -= 18;
            });

            // Risk Summary Box
            yPos -= 20;
            summaryPage.drawRectangle({
                x: margin, y: yPos - 80,
                width: pageWidth - (margin * 2), height: 90,
                color: colors.light,
                borderRadius: 8,
            });

            summaryPage.drawText('OVERALL RISK RATING', {
                x: margin + 15, y: yPos - 20,
                size: 10, font: helveticaBold,
                color: colors.primary,
            });

            const risk = reportData.general?.overall_risk || 'Medium';
            const riskColor = this.getRiskColor(risk, colors);
            summaryPage.drawText(risk.toUpperCase(), {
                x: margin + 15, y: yPos - 55,
                size: 28, font: timesBold,
                color: riskColor,
            });

            // Vulnerability counts
            if (reportData.general?.critical_count !== undefined) {
                const counts = [
                    { label: 'Critical', value: reportData.general.critical_count, color: colors.critical },
                    { label: 'High', value: reportData.general.high_count, color: colors.high },
                    { label: 'Medium', value: reportData.general.medium_count, color: colors.medium },
                    { label: 'Low', value: reportData.general.low_count, color: colors.low },
                ];

                counts.forEach((item, i) => {
                    summaryPage.drawText(`${item.label}: ${item.value || 0}`, {
                        x: margin + 180 + (i * 90), y: yPos - 40,
                        size: 11, font: helveticaBold,
                        color: item.color,
                    });
                });
            }

            // ─── PAGE 3: FINDINGS ───
            if (reportData.findings && reportData.findings.length > 0) {
                const findingsPage = pdfDoc.addPage([pageWidth, pageHeight]);
                this.addPageHeader(findingsPage, 'Security Findings', 3, helveticaBold, helvetica, colors, pageWidth, pageHeight, margin);

                let fy = pageHeight - 120;
                let currentPage = findingsPage;

                reportData.findings.forEach((finding, index) => {
                    // Check if need new page
                    if (fy < 200) {
                        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                        this.addPageHeader(currentPage, 'Security Findings (cont.)', index + 3, helveticaBold, helvetica, colors, pageWidth, pageHeight, margin);
                        fy = pageHeight - 120;
                    }

                    const sevColor = colors[finding.severity] || colors.medium;

                    // Finding card background
                    currentPage.drawRectangle({
                        x: margin - 5, y: fy - 100,
                        width: pageWidth - (margin * 2) + 10, height: 110,
                        color: colors.light,
                        borderRadius: 6,
                    });

                    // Severity bar
                    currentPage.drawRectangle({
                        x: margin - 5, y: fy - 100,
                        width: 5, height: 110,
                        color: sevColor,
                    });

                    // Finding number and title
                    currentPage.drawText(`Finding ${index + 1}: ${finding.title || 'Untitled'}`, {
                        x: margin + 10, y: fy - 20,
                        size: 13, font: timesBold,
                        color: colors.dark,
                        maxWidth: 350,
                    });

                    // Severity badge
                    currentPage.drawText((finding.severity || 'medium').toUpperCase(), {
                        x: pageWidth - margin - 80, y: fy - 20,
                        size: 10, font: helveticaBold,
                        color: sevColor,
                    });

                    // CVSS Score
                    currentPage.drawText(`CVSS: ${finding.cvss_score || 'N/A'}`, {
                        x: pageWidth - margin - 80, y: fy - 38,
                        size: 9, font: helvetica,
                        color: colors.text,
                    });

                    // Description
                    const descLines = this.wrapText(finding.description || 'No description', 70);
                    descLines.slice(0, 2).forEach((line, li) => {
                        currentPage.drawText(line, {
                            x: margin + 10, y: fy - 45 - (li * 16),
                            size: 10, font: helvetica,
                            color: colors.text,
                        });
                    });

                    // Affected component
                    currentPage.drawText(`Affected: ${finding.affected_component || 'N/A'}`, {
                        x: margin + 10, y: fy - 85,
                        size: 9, font: helvetica,
                        color: rgb(0.4, 0.4, 0.4),
                    });

                    // Status
                    currentPage.drawText(`Status: ${finding.status || 'Open'}`, {
                        x: margin + 200, y: fy - 85,
                        size: 9, font: helveticaBold,
                        color: finding.status === 'Closed' ? colors.low : colors.high,
                    });

                    fy -= 125;
                });
            }

            // ─── PAGE 4: RECOMMENDATIONS ───
            if (reportData.recommendations && reportData.recommendations.length > 0) {
                const recPage = pdfDoc.addPage([pageWidth, pageHeight]);
                this.addPageHeader(recPage, 'Recommendations', 4, helveticaBold, helvetica, colors, pageWidth, pageHeight, margin);

                let ry = pageHeight - 120;

                reportData.recommendations.forEach((rec, index) => {
                    if (ry < 150) return;

                    recPage.drawText(`${index + 1}. ${rec.title || 'Recommendation'}`, {
                        x: margin, y: ry,
                        size: 12, font: timesBold,
                        color: colors.dark,
                    });

                    recPage.drawText(`Priority: ${rec.priority || 'Medium'} | Effort: ${rec.effort || 'Medium'} | Timeline: ${rec.timeline || 'N/A'}`, {
                        x: margin, y: ry - 18,
                        size: 9, font: helvetica,
                        color: colors.primary,
                    });

                    const recLines = this.wrapText(rec.description || '', 80);
                    recLines.slice(0, 2).forEach((line, li) => {
                        recPage.drawText(line, {
                            x: margin, y: ry - 35 - (li * 15),
                            size: 10, font: helvetica,
                            color: colors.text,
                        });
                    });

                    ry -= 90;
                });
            }

            // SAVE PDF
            const pdfBytes = await pdfDoc.save();
            return pdfBytes;

        } catch (error) {
            console.error('PDF Generation Error:', error);
            throw error;
        }
    },

    // ADD PAGE HEADER
    addPageHeader: function(page, title, pageNum, boldFont, regularFont, colors, pageWidth, pageHeight, margin) {
        page.drawRectangle({
            x: 0, y: pageHeight - 70,
            width: pageWidth, height: 70,
            color: colors.dark,
        });
        page.drawRectangle({
            x: 0, y: pageHeight - 74,
            width: pageWidth, height: 4,
            color: colors.primary,
        });
        page.drawText(title, {
            x: margin, y: pageHeight - 45,
            size: 16, font: boldFont,
            color: rgb(1, 1, 1),
        });
        page.drawText(`Page ${pageNum}`, {
            x: pageWidth - 80, y: pageHeight - 45,
            size: 10, font: regularFont,
            color: rgb(0.6, 0.6, 0.6),
        });
    },

    // WRAP TEXT UTILITY
    wrapText: function(text, maxChars) {
        if (!text) return [''];
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        words.forEach(word => {
            if ((currentLine + word).length > maxChars) {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        if (currentLine.trim()) lines.push(currentLine.trim());
        return lines.length > 0 ? lines : [''];
    },

    // GET CLASS COLOR
    getClassColor: function(classification, colors) {
        const map = {
            'Public': rgb(0.133, 0.769, 0.369),
            'Internal': rgb(0.231, 0.510, 0.965),
            'Confidential': rgb(0.961, 0.620, 0.043),
            'Top Secret': rgb(0.937, 0.267, 0.267),
        };
        return map[classification] || colors.primary;
    },

    // GET RISK COLOR
    getRiskColor: function(risk, colors) {
        const map = {
            'Critical': colors.critical,
            'High': colors.high,
            'Medium': colors.medium,
            'Low': colors.low,
            'Informational': colors.info,
        };
        return map[risk] || colors.medium;
    },

    // EXPORT AS HTML
    exportHTML: function(reportData) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportData.general?.report_title || 'Security Report'}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #333; }
        .header { background: #0f172a; color: white; padding: 40px; border-radius: 10px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        h1 { font-size: 28px; } h2 { color: #2563eb; }
        .finding { padding: 15px; margin: 10px 0; border-radius: 6px; }
        .critical { background: #fef2f2; border-left: 5px solid #ef4444; }
        .high { background: #fff7ed; border-left: 5px solid #f97316; }
        .medium { background: #fffbeb; border-left: 5px solid #f59e0b; }
        .low { background: #f0fdf4; border-left: 5px solid #22c55e; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .meta-item { padding: 10px; background: #f8fafc; border-radius: 6px; }
        .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; }
        .value { font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${reportData.general?.report_title || 'Security Report'}</h1>
        <p>${reportData.metadata?.classification || 'Confidential'} | Version ${reportData.metadata?.doc_version || '1.0'}</p>
    </div>
    <div class="section">
        <h2>Report Information</h2>
        <div class="meta-grid">
            ${Object.entries(reportData.general || {}).map(([key, value]) => `
                <div class="meta-item">
                    <div class="label">${key.replace(/_/g, ' ')}</div>
                    <div class="value">${value || 'N/A'}</div>
                </div>
            `).join('')}
        </div>
    </div>
    ${reportData.findings?.length > 0 ? `
    <div class="section">
        <h2>Security Findings</h2>
        ${reportData.findings.map((f, i) => `
            <div class="finding ${f.severity}">
                <h3>${i + 1}. ${f.title}</h3>
                <p><strong>Severity:</strong> ${f.severity} | <strong>CVSS:</strong> ${f.cvss_score}</p>
                <p>${f.description}</p>
                <p><strong>Remediation:</strong> ${f.remediation}</p>
            </div>
        `).join('')}
    </div>` : ''}
    <footer style="text-align:center;color:#94a3b8;margin-top:40px;font-size:12px;">
        Generated by SecReport Pro | ${new Date().toLocaleDateString()}
    </footer>
</body>
</html>`;
    },

    // EXPORT AS JSON
    exportJSON: function(reportData) {
        return JSON.stringify({
            generated_by: 'SecReport Pro v2.0',
            generated_at: new Date().toISOString(),
            ...reportData
        }, null, 2);
    }
};