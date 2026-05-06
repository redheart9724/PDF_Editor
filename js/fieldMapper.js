// =============================================
//   FIELD MAPPER - Defines all report fields
// =============================================

const FieldMapper = {

    // ALL TEMPLATES
    templates: {

        // PENTEST REPORT TEMPLATE
        pentest: {
            name: "Penetration Test Report",
            icon: "🔴",
            general: [
                { id: "report_title", label: "Report Title", type: "text", required: true, default: "Penetration Testing Report" },
                { id: "client_name", label: "Client Name", type: "text", required: true, default: "" },
                { id: "client_contact", label: "Client Contact", type: "text", required: false, default: "" },
                { id: "client_email", label: "Client Email", type: "email", required: false, default: "" },
                { id: "engagement_type", label: "Engagement Type", type: "select", required: true, options: ["Black Box", "White Box", "Grey Box"], default: "Black Box" },
                { id: "test_start_date", label: "Test Start Date", type: "date", required: true, default: "" },
                { id: "test_end_date", label: "Test End Date", type: "date", required: true, default: "" },
                { id: "report_date", label: "Report Date", type: "date", required: true, default: "" },
                { id: "tester_name", label: "Lead Tester", type: "text", required: true, default: "" },
                { id: "tester_email", label: "Tester Email", type: "email", required: false, default: "" },
                { id: "scope", label: "Scope / Target Systems", type: "textarea", required: true, default: "" },
                { id: "out_of_scope", label: "Out of Scope", type: "textarea", required: false, default: "" },
                { id: "methodology", label: "Methodology Used", type: "select", required: true, options: ["OWASP", "PTES", "OSSTMM", "NIST", "Custom"], default: "OWASP" },
                { id: "executive_summary", label: "Executive Summary", type: "textarea", required: true, default: "" },
                { id: "overall_risk", label: "Overall Risk Rating", type: "select", required: true, options: ["Critical", "High", "Medium", "Low", "Informational"], default: "Medium" },
            ],
            metadata: [
                { id: "doc_version", label: "Document Version", type: "text", default: "1.0" },
                { id: "classification", label: "Classification", type: "select", options: ["Public", "Internal", "Confidential", "Top Secret"], default: "Confidential" },
                { id: "report_id", label: "Report ID", type: "text", default: "" },
                { id: "project_code", label: "Project Code", type: "text", default: "" },
                { id: "review_date", label: "Review Date", type: "date", default: "" },
                { id: "approved_by", label: "Approved By", type: "text", default: "" },
                { id: "company_name", label: "Testing Company", type: "text", default: "" },
                { id: "company_address", label: "Company Address", type: "textarea", default: "" },
            ]
        },

        // VULNERABILITY ASSESSMENT
        vulnerability: {
            name: "Vulnerability Assessment Report",
            icon: "🟡",
            general: [
                { id: "report_title", label: "Report Title", type: "text", required: true, default: "Vulnerability Assessment Report" },
                { id: "organization", label: "Organization Name", type: "text", required: true, default: "" },
                { id: "assessment_date", label: "Assessment Date", type: "date", required: true, default: "" },
                { id: "analyst_name", label: "Security Analyst", type: "text", required: true, default: "" },
                { id: "systems_scanned", label: "Systems Scanned", type: "textarea", required: true, default: "" },
                { id: "tools_used", label: "Tools Used", type: "textarea", required: false, default: "Nessus, OpenVAS, Nmap" },
                { id: "total_vulns", label: "Total Vulnerabilities Found", type: "number", required: true, default: "0" },
                { id: "critical_count", label: "Critical", type: "number", required: true, default: "0" },
                { id: "high_count", label: "High", type: "number", required: true, default: "0" },
                { id: "medium_count", label: "Medium", type: "number", required: true, default: "0" },
                { id: "low_count", label: "Low", type: "number", required: true, default: "0" },
                { id: "summary", label: "Assessment Summary", type: "textarea", required: true, default: "" },
            ],
            metadata: [
                { id: "doc_version", label: "Document Version", type: "text", default: "1.0" },
                { id: "classification", label: "Classification", type: "select", options: ["Public", "Internal", "Confidential", "Top Secret"], default: "Confidential" },
                { id: "report_id", label: "Report ID", type: "text", default: "" },
            ]
        },

        // INCIDENT RESPONSE
        incident: {
            name: "Incident Response Report",
            icon: "🔵",
            general: [
                { id: "report_title", label: "Report Title", type: "text", required: true, default: "Incident Response Report" },
                { id: "incident_id", label: "Incident ID", type: "text", required: true, default: "" },
                { id: "incident_date", label: "Incident Date", type: "date", required: true, default: "" },
                { id: "detection_date", label: "Detection Date", type: "date", required: true, default: "" },
                { id: "containment_date", label: "Containment Date", type: "date", required: false, default: "" },
                { id: "resolution_date", label: "Resolution Date", type: "date", required: false, default: "" },
                { id: "incident_type", label: "Incident Type", type: "select", required: true, options: ["Data Breach", "Ransomware", "DDoS", "Phishing", "Malware", "Insider Threat", "Other"], default: "Data Breach" },
                { id: "severity", label: "Severity", type: "select", required: true, options: ["P1 - Critical", "P2 - High", "P3 - Medium", "P4 - Low"], default: "P2 - High" },
                { id: "affected_systems", label: "Affected Systems", type: "textarea", required: true, default: "" },
                { id: "affected_users", label: "Affected Users/Records", type: "text", required: false, default: "" },
                { id: "attack_vector", label: "Attack Vector", type: "textarea", required: true, default: "" },
                { id: "timeline", label: "Incident Timeline", type: "textarea", required: true, default: "" },
                { id: "impact", label: "Business Impact", type: "textarea", required: true, default: "" },
                { id: "response_actions", label: "Response Actions Taken", type: "textarea", required: true, default: "" },
                { id: "root_cause", label: "Root Cause Analysis", type: "textarea", required: true, default: "" },
                { id: "lessons_learned", label: "Lessons Learned", type: "textarea", required: false, default: "" },
                { id: "responder_name", label: "Incident Responder", type: "text", required: true, default: "" },
            ],
            metadata: [
                { id: "doc_version", label: "Document Version", type: "text", default: "1.0" },
                { id: "classification", label: "Classification", type: "select", options: ["Public", "Internal", "Confidential", "Top Secret"], default: "Top Secret" },
                { id: "report_id", label: "Report ID", type: "text", default: "" },
                { id: "ticket_number", label: "Ticket Number", type: "text", default: "" },
            ]
        },

        // SECURITY AUDIT
        audit: {
            name: "Security Audit Report",
            icon: "🟢",
            general: [
                { id: "report_title", label: "Report Title", type: "text", required: true, default: "Security Audit Report" },
                { id: "organization", label: "Organization", type: "text", required: true, default: "" },
                { id: "audit_type", label: "Audit Type", type: "select", required: true, options: ["Internal Audit", "External Audit", "Compliance Audit", "Technical Audit"], default: "External Audit" },
                { id: "audit_start", label: "Audit Start Date", type: "date", required: true, default: "" },
                { id: "audit_end", label: "Audit End Date", type: "date", required: true, default: "" },
                { id: "auditor_name", label: "Lead Auditor", type: "text", required: true, default: "" },
                { id: "audit_scope", label: "Audit Scope", type: "textarea", required: true, default: "" },
                { id: "frameworks", label: "Frameworks/Standards", type: "select", required: true, options: ["ISO 27001", "SOC 2", "NIST CSF", "PCI DSS", "HIPAA", "GDPR", "CIS Controls"], default: "ISO 27001" },
                { id: "compliance_score", label: "Compliance Score (%)", type: "number", required: true, default: "0" },
                { id: "controls_reviewed", label: "Total Controls Reviewed", type: "number", required: true, default: "0" },
                { id: "controls_passed", label: "Controls Passed", type: "number", required: true, default: "0" },
                { id: "controls_failed", label: "Controls Failed", type: "number", required: true, default: "0" },
                { id: "audit_opinion", label: "Audit Opinion", type: "textarea", required: true, default: "" },
            ],
            metadata: [
                { id: "doc_version", label: "Document Version", type: "text", default: "1.0" },
                { id: "classification", label: "Classification", type: "select", options: ["Public", "Internal", "Confidential", "Top Secret"], default: "Confidential" },
                { id: "report_id", label: "Report ID", type: "text", default: "" },
                { id: "audit_period", label: "Audit Period", type: "text", default: "" },
            ]
        }
    },

    // DEFAULT FINDINGS TEMPLATE
    defaultFinding: () => ({
        id: Date.now(),
        title: "New Finding",
        severity: "medium",
        cvss_score: "0.0",
        cve_id: "",
        affected_component: "",
        description: "",
        impact: "",
        proof_of_concept: "",
        remediation: "",
        references: "",
        status: "Open"
    }),

    // DEFAULT RECOMMENDATION
    defaultRecommendation: () => ({
        id: Date.now(),
        title: "New Recommendation",
        priority: "medium",
        effort: "medium",
        description: "",
        implementation: "",
        timeline: "30 days"
    }),

    // SEVERITY COLORS
    severityColors: {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#f59e0b',
        low: '#22c55e',
        info: '#3b82f6'
    },

    // GET TEMPLATE FIELDS
    getTemplate: function(type) {
        return this.templates[type] || this.templates.pentest;
    }
};