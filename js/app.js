// =============================================
//   APP.JS - Main Application Logic
// =============================================

// APP STATE
const AppState = {
    currentTemplate: null,
    currentFile: null,
    fields: {},
    findings: [],
    recommendations: [],
    metadata: {},
    zoom: 100,
    activeTab: 'general',
    pdfData: null,
};

// ─── INITIALIZATION ───
document.addEventListener('DOMContentLoaded', function() {
    initDropzone();
    initPDFJS();
    console.log('✅ SecReport Pro initialized');
    showNotification('SecReport Pro ready!', 'success');
});

// INIT PDF.JS
function initPDFJS() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
}

// ─── DROPZONE ───
function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const input = document.getElementById('pdf-input');

    // Click to upload
    dropzone.addEventListener('click', () => input.click());

    // File selected
    input.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFileUpload(e.target.files[0]);
    });

    // Drag events
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            handleFileUpload(file);
        } else {
            showNotification('Please upload a PDF file', 'error');
        }
    });

    // Remove file
    document.getElementById('remove-file').addEventListener('click', removeFile);
}

// ─── HANDLE FILE UPLOAD ───
async function handleFileUpload(file) {
    if (file.size > 50 * 1024 * 1024) {
        showNotification('File too large! Maximum 50MB', 'error');
        return;
    }

    AppState.currentFile = file;

    // Show file info
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = formatFileSize(file.size);
    document.getElementById('file-info').classList.remove('hidden');
    document.getElementById('dropzone-content').style.opacity = '0.5';

    showNotification('Processing PDF...', 'info');

    try {
        // Process PDF
        const result = await PDFHandler.loadPDF(file);
        AppState.pdfData = result;

        // Extract fields from PDF text
        const extractedFields = extractFieldsFromText(result.text);
        AppState.fields = extractedFields;

        // Auto-detect template type
        const detectedTemplate = detectTemplateType(result.text);
        loadTemplate(detectedTemplate, false);

        // Populate with extracted data
        populateExtractedData(extractedFields);

        showNotification(`PDF loaded! ${result.numPages} pages detected.`, 'success');
        completeStep(1);
        activateStep(2);

    } catch (error) {
        console.error('PDF Error:', error);
        showNotification('Error reading PDF. Using blank template.', 'warning');
        loadTemplate('pentest', false);
        completeStep(1);
        activateStep(2);
    }
}

// ─── EXTRACT FIELDS FROM PDF TEXT ───
function extractFieldsFromText(text) {
    if (!text) return {};

    const fields = {};
    const patterns = {
        client_name: /client[:\s]+([^\n]+)/i,
        report_date: /(?:report\s*date|date)[:\s]+(\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4})/i,
        tester_name: /(?:prepared\s*by|author|tester)[:\s]+([^\n]+)/i,
        organization: /(?:organization|company|client)[:\s]+([^\n]+)/i,
        report_title: /(?:title|report\s*title)[:\s]+([^\n]+)/i,
        version: /(?:version|ver)[:\s]+([0-9.]+)/i,
        classification: /(confidential|public|internal|top\s*secret)/i,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
        const match = text.match(pattern);
        if (match) fields[key] = match[1].trim();
    });

    return fields;
}

// ─── DETECT TEMPLATE TYPE ───
function detectTemplateType(text) {
    if (!text) return 'pentest';
    const t = text.toLowerCase();
    if (t.includes('incident') || t.includes('breach')) return 'incident';
    if (t.includes('audit') || t.includes('compliance')) return 'audit';
    if (t.includes('vulnerability') || t.includes('vuln')) return 'vulnerability';
    return 'pentest';
}

// ─── LOAD TEMPLATE ───
function loadTemplate(type, notify = true) {
    AppState.currentTemplate = type;
    const template = FieldMapper.getTemplate(type);

    // Update state
    AppState.findings = [FieldMapper.defaultFinding()];
    AppState.recommendations = [FieldMapper.defaultRecommendation()];

    // Render all sections
    renderGeneralFields(template.general);
    renderMetadataFields(template.metadata);
    renderFindings();
    renderRecommendations();

    // Show fields panel
    document.getElementById('fields-panel').classList.remove('hidden');

    // Update preview
    updatePreview();

    if (notify) {
        showNotification(`${template.name} template loaded!`, 'success');
    }

    completeStep(1);
    activateStep(2);
}

// ─── RENDER GENERAL FIELDS ───
function renderGeneralFields(fields) {
    const container = document.getElementById('general-fields');
    container.innerHTML = '';

    fields.forEach(field => {
        const el = createFieldElement(field);
        container.appendChild(el);
    });
}

// ─── RENDER METADATA FIELDS ───
function renderMetadataFields(fields) {
    const container = document.getElementById('metadata-fields');
    container.innerHTML = '';

    fields.forEach(field => {
        const el = createFieldElement(field, 'metadata');
        container.appendChild(el);
    });
}

// ─── CREATE FIELD ELEMENT ───
function createFieldElement(field, section = 'general') {
    const wrapper = document.createElement('div');
    wrapper.className = 'field-item';
    wrapper.setAttribute('data-field-id', field.id);
    wrapper.setAttribute('data-search-label', field.label.toLowerCase());

    let inputHTML = '';

    if (field.type === 'textarea') {
        inputHTML = `<textarea 
            class="field-input" 
            id="field_${field.id}"
            placeholder="Enter ${field.label.toLowerCase()}..."
            rows="3"
            oninput="updateField('${section}', '${field.id}', this.value)"
        >${field.default || ''}</textarea>`;

    } else if (field.type === 'select') {
        const options = field.options?.map(opt =>
            `<option value="${opt}" ${opt === field.default ? 'selected' : ''}>${opt}</option>`
        ).join('');
        inputHTML = `<select 
            class="field-input" 
            id="field_${field.id}"
            onchange="updateField('${section}', '${field.id}', this.value)"
        >${options}</select>`;

    } else {
        inputHTML = `<input 
            type="${field.type}" 
            class="field-input"
            id="field_${field.id}"
            placeholder="Enter ${field.label.toLowerCase()}..."
            value="${field.default || ''}"
            oninput="updateField('${section}', '${field.id}', this.value)"
        >`;
    }

    wrapper.innerHTML = `
        <div class="field-label">
            <label for="field_${field.id}">${field.label}</label>
            ${field.required ? '<span class="field-required">* Required</span>' : ''}
        </div>
        ${inputHTML}
    `;

    // Initialize state
    if (!AppState[section === 'metadata' ? 'metadata' : 'fields']) {
        AppState[section === 'metadata' ? 'metadata' : 'fields'] = {};
    }

    if (section === 'metadata') {
        AppState.metadata[field.id] = field.default || '';
    } else {
        AppState.fields[field.id] = field.default || '';
    }

    return wrapper;
}

// ─── UPDATE FIELD ───
function updateField(section, fieldId, value) {
    if (section === 'metadata') {
        AppState.metadata[fieldId] = value;
    } else {
        AppState.fields[fieldId] = value;
    }
    updatePreview();
}

// ─── POPULATE EXTRACTED DATA ───
function populateExtractedData(extractedFields) {
    Object.entries(extractedFields).forEach(([key, value]) => {
        const el = document.getElementById(`field_${key}`);
        if (el && value) {
            el.value = value;
            AppState.fields[key] = value;
        }
    });
    updatePreview();
}

// ─── RENDER FINDINGS ───
function renderFindings() {
    const container = document.getElementById('findings-container');
    container.innerHTML = '';

    AppState.findings.forEach((finding, index) => {
        const card = createFindingCard(finding, index);
        container.appendChild(card);
    });
}

// ─── CREATE FINDING CARD ───
function createFindingCard(finding, index) {
    const card = document.createElement('div');
    card.className = `finding-card ${finding.severity}`;
    card.id = `finding_${finding.id}`;

    card.innerHTML = `
        <div class="finding-header">
            <input 
                type="text"
                class="finding-title-input"
                value="${finding.title}"
                placeholder="Finding title..."
                oninput="updateFinding(${finding.id}, 'title', this.value)"
            >
            <div class="finding-controls">
                <select class="field-input" style="width:100px;padding:4px 8px;font-size:11px;"
                        onchange="updateFinding(${finding.id}, 'severity', this.value);
                                  this.closest('.finding-card').className='finding-card '+this.value">
                    <option value="critical" ${finding.severity === 'critical' ? 'selected' : ''}>Critical</option>
                    <option value="high" ${finding.severity === 'high' ? 'selected' : ''}>High</option>
                    <option value="medium" ${finding.severity === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="low" ${finding.severity === 'low' ? 'selected' : ''}>Low</option>
                    <option value="info" ${finding.severity === 'info' ? 'selected' : ''}>Info</option>
                </select>
                <button class="btn-small" style="color:#ef4444;" 
                        onclick="removeFinding(${finding.id})">🗑️</button>
            </div>
        </div>
        <div class="fields-grid" style="gap:10px;">
            <div class="field-item" style="margin:0;">
                <div class="field-label"><label>CVSS Score</label></div>
                <input type="text" class="field-input" placeholder="0.0 - 10.0"
                       value="${finding.cvss_score}"
                       oninput="updateFinding(${finding.id}, 'cvss_score', this.value)">
            </div>
            <div class="field-item" style="margin:0;">
                <div class="field-label"><label>CVE ID</label></div>
                <input type="text" class="field-input" placeholder="CVE-YYYY-XXXXX"
                       value="${finding.cve_id}"
                       oninput="updateFinding(${finding.id}, 'cve_id', this.value)">
            </div>
            <div class="field-item" style="margin:0;grid-column:span 2;">
                <div class="field-label"><label>Affected Component</label></div>
                <input type="text" class="field-input" placeholder="e.g., Login Form, API Endpoint"
                       value="${finding.affected_component}"
                       oninput="updateFinding(${finding.id}, 'affected_component', this.value)">
            </div>
            <div class="field-item" style="margin:0;grid-column:span 2;">
                <div class="field-label"><label>Description</label></div>
                <textarea class="field-input" rows="3" placeholder="Describe the vulnerability..."
                          oninput="updateFinding(${finding.id}, 'description', this.value)">${finding.description}</textarea>
            </div>
            <div class="field-item" style="margin:0;grid-column:span 2;">
                <div class="field-label"><label>Impact</label></div>
                <textarea class="field-input" rows="2" placeholder="What is the business impact?"
                          oninput="updateFinding(${finding.id}, 'impact', this.value)">${finding.impact}</textarea>
            </div>
            <div class="field-item" style="margin:0;grid-column:span 2;">
                <div class="field-label"><label>Proof of Concept</label></div>
                <textarea class="field-input" rows="2" placeholder="Steps to reproduce..."
                          oninput="updateFinding(${finding.id}, 'proof_of_concept', this.value)">${finding.proof_of_concept}</textarea>
            </div>
            <div class="field-item" style="margin:0;grid-column:span 2;">
                <div class="field-label"><label>Remediation</label></div>
                <textarea class="field-input" rows="2" placeholder="How to fix this vulnerability..."
                          oninput="updateFinding(${finding.id}, 'remediation', this.value)">${finding.remediation}</textarea>
            </div>
            <div class="field-item" style="margin:0;">
                <div class="field-label"><label>Status</label></div>
                <select class="field-input"
                        onchange="updateFinding(${finding.id}, 'status', this.value)">
                    <option ${finding.status === 'Open' ? 'selected' : ''}>Open</option>
                    <option ${finding.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option ${finding.status === 'Closed' ? 'selected' : ''}>Closed</option>
                    <option ${finding.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                </select>
            </div>
            <div class="field-item" style="margin:0;">
                <div class="field-label"><label>References</label></div>
                <input type="text" class="field-input" placeholder="https://..."
                       value="${finding.references}"
                       oninput="updateFinding(${finding.id}, 'references', this.value)">
            </div>
        </div>
    `;

    return card;
}

// ─── ADD FINDING ───
function addFinding() {
    const finding = FieldMapper.defaultFinding();
    AppState.findings.push(finding);
    renderFindings();
    updatePreview();
    showNotification('New finding added!', 'success');
}

// ─── REMOVE FINDING ───
function removeFinding(id) {
    AppState.findings = AppState.findings.filter(f => f.id !== id);
    renderFindings();
    updatePreview();
    showNotification('Finding removed', 'info');
}

// ─── UPDATE FINDING ───
function updateFinding(id, field, value) {
    const finding = AppState.findings.find(f => f.id === id);
    if (finding) {
        finding[field] = value;
        updatePreview();
    }
}

// ─── RENDER RECOMMENDATIONS ───
function renderRecommendations() {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = '';
    AppState.recommendations.forEach((rec, i) => {
        container.appendChild(createRecommendationCard(rec, i));
    });
}

// ─── CREATE RECOMMENDATION CARD ───
function createRecommendationCard(rec, index) {
    const card = document.createElement('div');
    card.className = 'finding-card low';
    card.innerHTML = `
        <div class="finding-header">
            <input type="text" class="finding-title-input" 
                   value="${rec.title}" placeholder="Recommendation title..."
                   oninput="updateRecommendation(${rec.id}, 'title', this.value)">
            <button class="btn-small" style="color:#ef4444;"
                    onclick="removeRecommendation(${rec.id})">🗑️</button>
        </div>
        <div class="fields-grid" style="gap:10px;">
            <div class="field-item" style="margin:0;">
                <div class="field-label"><label>Priority</label></div>
                <select class="field-input" onchange="updateRecommendation(${rec.id}, 'priority', this.value)">
                    <option ${rec.priority === 'critical' ? 'selected' : ''}>Critical</option>
                    <option ${rec.priority === 'high' ? 'selected' : ''}>High</option>
                    <option ${rec.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option ${rec.priority === 'low' ? 'selected' : ''}>Low</option>
                </select>
            </div>
            <div class="field-item" style="margin:0;">
                <div class="field-label"><label>Timeline</label></div>
                <input type="text" class="field-input" placeholder="e.g., 30 days"
                       value="${rec.timeline}"
                       oninput="updateRecommendation(${rec.id}, 'timeline', this.value)">
            </div>
            <div class="field-item" style="margin:0;grid-column:span 2;">
                <div class="field-label"><label>Description</label></div>
                <textarea class="field-input" rows="3"
                          oninput="updateRecommendation(${rec.id}, 'description', this.value)">${rec.description}</textarea>
            </div>
        </div>
    `;
    return card;
}

function addRecommendation() {
    AppState.recommendations.push(FieldMapper.defaultRecommendation());
    renderRecommendations();
    showNotification('Recommendation added!', 'success');
}

function removeRecommendation(id) {
    AppState.recommendations = AppState.recommendations.filter(r => r.id !== id);
    renderRecommendations();
}

function updateRecommendation(id, field, value) {
    const rec = AppState.recommendations.find(r => r.id === id);
    if (rec) { rec[field] = value; updatePreview(); }
}

// ─── UPDATE LIVE PREVIEW ───
function updatePreview() {
    const placeholder = document.getElementById('preview-placeholder');
    const preview = document.getElementById('report-preview');
    const content = document.getElementById('report-content');

    placeholder.classList.add('hidden');
    preview.classList.remove('hidden');

    const general = AppState.fields;
    const meta = AppState.metadata;
    const conf = meta.classification || 'Confidential';

    const severityCount = {
        critical: AppState.findings.filter(f => f.severity === 'critical').length,
        high: AppState.findings.filter(f => f.severity === 'high').length,
        medium: AppState.findings.filter(f => f.severity === 'medium').length,
        low: AppState.findings.filter(f => f.severity === 'low').length,
    };

    content.innerHTML = `
        <!-- COVER PAGE -->
        <div class="report-page" style="position:relative;min-height:800px;">
            <div class="conf-watermark">${conf}</div>
            <div class="report-cover">
                <div class="report-logo">🛡️</div>
                <div class="report-title">${general.report_title || 'Security Report'}</div>
                <div class="report-subtitle">Security Assessment Report</div>
                <div class="report-meta-grid">
                    <div class="report-meta-item">
                        <div class="meta-label">Client</div>
                        <div class="meta-value">${general.client_name || general.organization || '—'}</div>
                    </div>
                    <div class="report-meta-item">
                        <div class="meta-label">Date</div>
                        <div class="meta-value">${general.report_date || general.assessment_date || new Date().toLocaleDateString()}</div>
                    </div>
                    <div class="report-meta-item">
                        <div class="meta-label">Version</div>
                        <div class="meta-value">${meta.doc_version || '1.0'}</div>
                    </div>
                    <div class="report-meta-item">
                        <div class="meta-label">Classification</div>
                        <div class="meta-value" style="color:#f59e0b;">${conf}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- EXECUTIVE SUMMARY -->
        <div class="report-section">
            <h2>Executive Summary</h2>
            <p>${general.executive_summary || '<em>No executive summary provided.</em>'}</p>
            
            <!-- Risk Overview -->
            <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:8px;">
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center;">
                    <div style="padding:15px;background:#fef2f2;border-radius:8px;">
                        <div style="font-size:28px;font-weight:900;color:#ef4444;">${severityCount.critical}</div>
                        <div style="font-size:11px;color:#ef4444;font-weight:700;">CRITICAL</div>
                    </div>
                    <div style="padding:15px;background:#fff7ed;border-radius:8px;">
                        <div style="font-size:28px;font-weight:900;color:#f97316;">${severityCount.high}</div>
                        <div style="font-size:11px;color:#f97316;font-weight:700;">HIGH</div>
                    </div>
                    <div style="padding:15px;background:#fffbeb;border-radius:8px;">
                        <div style="font-size:28px;font-weight:900;color:#f59e0b;">${severityCount.medium}</div>
                        <div style="font-size:11px;color:#f59e0b;font-weight:700;">MEDIUM</div>
                    </div>
                    <div style="padding:15px;background:#f0fdf4;border-radius:8px;">
                        <div style="font-size:28px;font-weight:900;color:#22c55e;">${severityCount.low}</div>
                        <div style="font-size:11px;color:#22c55e;font-weight:700;">LOW</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- FINDINGS -->
        ${AppState.findings.length > 0 ? `
        <div class="report-section">
            <h2>Security Findings (${AppState.findings.length})</h2>
            ${AppState.findings.map((f, i) => `
                <div class="finding-report-card ${f.severity}">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <strong>${i + 1}. ${f.title || 'Untitled Finding'}</strong>
                        <div style="display:flex;gap:10px;">
                            ${f.cvss_score ? `<span style="font-size:11px;color:#64748b;">CVSS: ${f.cvss_score}</span>` : ''}
                            <span class="severity-badge severity-${f.severity}">${(f.severity || 'medium').toUpperCase()}</span>
                        </div>
                    </div>
                    ${f.affected_component ? `<p style="font-size:12px;color:#64748b;margin-bottom:8px;">📍 ${f.affected_component}</p>` : ''}
                    <p style="font-size:13px;margin-bottom:8px;">${f.description || '<em>No description</em>'}</p>
                    ${f.remediation ? `
                        <div style="background:rgba(255,255,255,0.6);padding:8px;border-radius:6px;">
                            <strong style="font-size:11px;color:#22c55e;">🔧 REMEDIATION:</strong>
                            <p style="font-size:12px;margin:4px 0 0;">${f.remediation}</p>
                        </div>` : ''}
                    <div style="margin-top:8px;font-size:11px;color:#94a3b8;">
                        Status: <strong>${f.status || 'Open'}</strong>
                        ${f.cve_id ? ` | CVE: <strong>${f.cve_id}</strong>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>` : ''}

        <!-- RECOMMENDATIONS -->
        ${AppState.recommendations.length > 0 ? `
        <div class="report-section">
            <h2>Recommendations</h2>
            ${AppState.recommendations.map((r, i) => `
                <div style="padding:15px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;">
                        <strong>${i + 1}. ${r.title || 'Recommendation'}</strong>
                        <span style="font-size:11px;color:#64748b;">Timeline: ${r.timeline || 'N/A'}</span>
                    </div>
                    <p style="font-size:12px;color:#64748b;margin:5px 0;">Priority: ${r.priority || 'Medium'}</p>
                    <p style="font-size:13px;">${r.description || ''}</p>
                </div>
            `).join('')}
        </div>` : ''}

        <!-- FOOTER -->
        <div style="padding:20px;text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;">
            <p>Generated by SecReport Pro | ${conf} | ${new Date().toLocaleDateString()}</p>
            <p>${meta.report_id ? `Report ID: ${meta.report_id}` : ''}</p>
        </div>
    `;

    completeStep(2);
    activateStep(3);
}

// ─── EXPORT REPORT ───
async function exportReport() {
    const format = document.querySelector('input[name="export-format"]:checked').value;
    const name = document.getElementById('report-name').value || 'Security_Report';

    showProgress(true);
    updateProgress(10, 'Starting export...');

    const reportData = {
        general: AppState.fields,
        metadata: AppState.metadata,
        findings: AppState.findings,
        recommendations: AppState.recommendations,
    };

    try {
        if (format === 'pdf') {
            updateProgress(30, 'Building PDF...');
            const pdfBytes = await PDFHandler.generatePDF(reportData);
            updateProgress(80, 'Saving...');
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            saveAs(blob, `${name}.pdf`);
            updateProgress(100, 'Done!');
            showNotification('PDF exported successfully!', 'success');

        } else if (format === 'html') {
            updateProgress(50, 'Building HTML...');
            const html = PDFHandler.exportHTML(reportData);
            const blob = new Blob([html], { type: 'text/html' });
            saveAs(blob, `${name}.html`);
            updateProgress(100, 'Done!');
            showNotification('HTML exported successfully!', 'success');

        } else if (format === 'json') {
            updateProgress(50, 'Building JSON...');
            const json = PDFHandler.exportJSON(reportData);
            const blob = new Blob([json], { type: 'application/json' });
            saveAs(blob, `${name}.json`);
            updateProgress(100, 'Done!');
            showNotification('JSON exported successfully!', 'success');
        }

        completeStep(4);

    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed: ' + error.message, 'error');
    }

    setTimeout(() => showProgress(false), 2000);
}

// ─── SAVE TEMPLATE ───
function saveTemplate() {
    const data = {
        template: AppState.currentTemplate,
        fields: AppState.fields,
        metadata: AppState.metadata,
        findings: AppState.findings,
        recommendations: AppState.recommendations,
        saved_at: new Date().toISOString(),
    };
    localStorage.setItem('secreport_template', JSON.stringify(data));
    showNotification('Template saved!', 'success');
}

// ─── LOAD SAVED TEMPLATE ───
function loadSavedTemplate() {
    const saved = localStorage.getItem('secreport_template');
    if (!saved) {
        showNotification('No saved template found!', 'warning');
        return;
    }
    try {
        const data = JSON.parse(saved);
        AppState.fields = data.fields || {};
        AppState.metadata = data.metadata || {};
        AppState.findings = data.findings || [];
        AppState.recommendations = data.recommendations || [];
        loadTemplate(data.template || 'pentest', false);
        populateSavedData(data.fields);
        showNotification('Template loaded!', 'success');
    } catch (e) {
        showNotification('Error loading template!', 'error');
    }
}

// ─── POPULATE SAVED DATA ───
function populateSavedData(fields) {
    Object.entries(fields || {}).forEach(([key, value]) => {
        const el = document.getElementById(`field_${key}`);
        if (el) el.value = value;
    });
    updatePreview();
}

// ─── ADD CUSTOM FIELD ───
function addCustomField() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="fields-grid">
            <div class="field-item">
                <div class="field-label"><label>Field Label</label></div>
                <input type="text" class="field-input" id="new-field-label" placeholder="e.g., Project Manager">
            </div>
            <div class="field-item">
                <div class="field-label"><label>Field Type</label></div>
                <select class="field-input" id="new-field-type">
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                </select>
            </div>
            <div class="field-item">
                <div class="field-label"><label>Default Value</label></div>
                <input type="text" class="field-input" id="new-field-default" placeholder="Optional default">
            </div>
            <div class="field-item">
                <div class="field-label"><label>Required?</label></div>
                <select class="field-input" id="new-field-required">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
            </div>
        </div>
    `;
    document.getElementById('modal-title').textContent = 'Add Custom Field';
    document.getElementById('modal').classList.remove('hidden');
}

// ─── CONFIRM MODAL ───
function confirmModal() {
    const label = document.getElementById('new-field-label')?.value;
    if (!label) {
        showNotification('Please enter a field label!', 'error');
        return;
    }

    const newField = {
        id: `custom_${Date.now()}`,
        label: label,
        type: document.getElementById('new-field-type')?.value || 'text',
        default: document.getElementById('new-field-default')?.value || '',
        required: document.getElementById('new-field-required')?.value === 'true',
    };

    const container = document.getElementById('general-fields');
    const el = createFieldElement(newField);
    container.appendChild(el);

    closeModal();
    showNotification(`Field "${label}" added!`, 'success');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// ─── SEARCH FIELDS ───
function searchFields(query) {
    const items = document.querySelectorAll('.field-item[data-search-label]');
    items.forEach(item => {
        const label = item.getAttribute('data-search-label') || '';
        item.style.display = label.includes(query.toLowerCase()) ? 'block' : 'none';
    });
}

// ─── SWITCH TAB ───
function switchTab(tab) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    event.target.classList.add('active');
    AppState.activeTab = tab;
}

// ─── ZOOM ───
function zoomIn() {
    AppState.zoom = Math.min(AppState.zoom + 10, 150);
    applyZoom();
}

function zoomOut() {
    AppState.zoom = Math.max(AppState.zoom - 10, 60);
    applyZoom();
}

function applyZoom() {
    document.getElementById('report-content').style.transform = `scale(${AppState.zoom / 100})`;
    document.getElementById('report-content').style.transformOrigin = 'top left';
    document.getElementById('zoom-level').textContent = `${AppState.zoom}%`;
}

// ─── REMOVE FILE ───
function removeFile() {
    AppState.currentFile = null;
    AppState.pdfData = null;
    document.getElementById('file-info').classList.add('hidden');
    document.getElementById('dropzone-content').style.opacity = '1';
    document.getElementById('pdf-input').value = '';
    document.getElementById('fields-panel').classList.add('hidden');
}

// ─── PROGRESS ───
function showProgress(show) {
    document.getElementById('progress-container').classList.toggle('hidden', !show);
}

function updateProgress(percent, text) {
    document.getElementById('progress-fill').style.width = `${percent}%`;
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('progress-text').textContent = text;
}

// ─── STEPS ───
function activateStep(num) {
    document.getElementById(`step${num}-indicator`)?.classList.add('active');
}

function completeStep(num) {
    const step = document.getElementById(`step${num}-indicator`);
    if (step) {
        step.classList.remove('active');
        step.classList.add('completed');
        step.querySelector('.step-number').textContent = '✓';
    }
}

// ─── NOTIFICATIONS ───
function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(notif);

    setTimeout(() => notif.remove(), 3500);
}

// ─── UTILITIES ───
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}