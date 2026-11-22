"""
PDF Report Generator for GeoFlood AI.
Uses ReportLab to produce publication-grade evaluation & assessment reports.
"""

import os
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)

def generate_prediction_pdf(prediction_record: dict, output_dir=None) -> str:
    if output_dir is None:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
        output_dir = os.path.join(base_dir, "reports", "generated_pdfs")
    os.makedirs(output_dir, exist_ok=True)
    
    pred_id = prediction_record["prediction_id"]
    pdf_path = os.path.join(output_dir, f"geoflood_report_{pred_id}.pdf")
    
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#0f172a") # Navy Dark
    accent_color = colors.HexColor("#0284c7")  # Cyan / Blue
    teal_color = colors.HexColor("#0d9488")    # Teal
    text_dark = colors.HexColor("#1e293b")
    bg_light = colors.HexColor("#f8fafc")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=12
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_dark
    )
    
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=text_dark
    )
    
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )
    
    story = []
    
    # Title & Metadata Banner
    story.append(Paragraph("GeoFlood AI: Flood Severity Assessment Report", title_style))
    story.append(Paragraph(
        f"<b>Machine Learning-Based Flood Severity Prediction & Explainability System</b><br/>"
        f"Prediction ID: <code>{pred_id}</code> | Generated: {prediction_record['timestamp']} UTC",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceAfter=10))
    
    # Executive Summary Card
    predicted_class = prediction_record["predicted_class"]
    best_model = prediction_record["best_model"]
    conf = prediction_record["confidence"]
    tot_models = prediction_record.get("total_models", 5)
    agr_count = prediction_record.get("agreement_count", 1)
    agr_pct = prediction_record.get("agreement_percentage", round((agr_count / tot_models)*100.0, 1))
    agreement = f"{agr_count}/{tot_models} Models ({agr_pct}%)"
    
    alert_bg = colors.HexColor("#fef2f2") if predicted_class == "Severe Flood" else colors.HexColor("#f0fdf4")
    alert_border = colors.HexColor("#ef4444") if predicted_class == "Severe Flood" else colors.HexColor("#22c55e")
    
    summary_data = [
        [
            Paragraph(f"<b>FINAL PREDICTION</b><br/><font size='16' color='{alert_border.hexval()}'><b>{predicted_class.upper()}</b></font>", body_style),
            Paragraph(f"<b>BEST ALGORITHM</b><br/><font size='11'><b>{best_model}</b></font>", body_style),
            Paragraph(f"<b>CONFIDENCE</b><br/><font size='11'><b>{conf*100:.1f}%</b></font>", body_style),
            Paragraph(f"<b>CONSENSUS</b><br/><font size='11'><b>{agreement}</b></font>", body_style),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[150, 130, 110, 140])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), alert_bg),
        ('BOX', (0,0), (-1,-1), 1, alert_border),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 12))
    
    # Section 1: Location & Input Summary
    story.append(Paragraph("1. Assessment Location & Input Characteristics", section_heading))
    inputs = prediction_record["inputs"]
    
    station_txt = inputs.get("station_name") or inputs.get("gauge_id") or "Manual Assessment"
    state_txt = inputs.get("state") or "N/A"
    basin_txt = inputs.get("basin") or "N/A"
    
    meta_table_data = [
        [
            Paragraph(f"<b>Station / Gauge:</b> {station_txt}", body_style),
            Paragraph(f"<b>River Basin:</b> {basin_txt}", body_style),
            Paragraph(f"<b>State:</b> {state_txt}", body_style),
        ],
        [
            Paragraph(f"<b>Drainage Area:</b> {inputs.get('Drainage Area')} km²", body_style),
            Paragraph(f"<b>Catchment Relief:</b> {inputs.get('Catchment Relief')} m", body_style),
            Paragraph(f"<b>Drainage Density:</b> {inputs.get('Drainage Density')} km/km²", body_style),
        ],
        [
            Paragraph(f"<b>Soil Type:</b> {inputs.get('Soil type')}", body_style),
            Paragraph(f"<b>Land Cover:</b> {inputs.get('Land cover')}", body_style),
            Paragraph(f"<b>Climate Type:</b> {inputs.get('KoppenGeiger Climate Type')}", body_style),
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[180, 180, 170])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))
    
    # Antecedent Rainfall Summary Table (T1d to T10d)
    precip_row1_h = [Paragraph(f"<b>T{i}d (mm)</b>", table_header) for i in range(1, 11)]
    precip_row1_v = [Paragraph(f"{inputs.get(f'T{i}d', 0):.1f}", table_cell) for i in range(1, 11)]
    precip_table = Table([precip_row1_h, precip_row1_v], colWidths=[53]*10)
    precip_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BACKGROUND', (0,1), (-1,1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(precip_table)
    story.append(Spacer(1, 12))
    
    # Section 2: Five Machine Learning Algorithms Comparison
    story.append(Paragraph("2. Multi-Algorithm Prediction & Evaluation Comparison", section_heading))
    algo_headers = [
        Paragraph("<b>Algorithm</b>", table_header),
        Paragraph("<b>Predicted Class</b>", table_header),
        Paragraph("<b>Confidence</b>", table_header),
        Paragraph("<b>Test Accuracy</b>", table_header),
        Paragraph("<b>Macro F1</b>", table_header),
        Paragraph("<b>ROC-AUC</b>", table_header),
    ]
    algo_rows = [algo_headers]
    for p in prediction_record["all_predictions"]:
        is_best = p.get("is_best_model", False)
        prefix = "★ " if is_best else ""
        algo_rows.append([
            Paragraph(f"<b>{prefix}{p['algorithm']}</b>", table_cell),
            Paragraph(f"<b>{p['predicted_class']}</b>", table_cell),
            Paragraph(f"{p['confidence']*100:.1f}%", table_cell),
            Paragraph(f"{p.get('accuracy', 0)*100:.1f}%", table_cell),
            Paragraph(f"{p.get('f1_macro', 0):.3f}", table_cell),
            Paragraph(f"{p.get('roc_auc', 0):.3f}" if p.get('roc_auc') else "N/A", table_cell),
        ])
    algo_table = Table(algo_rows, colWidths=[150, 100, 70, 70, 70, 70])
    algo_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
    ]))
    story.append(algo_table)
    story.append(Spacer(1, 12))
    
    # Section 3: Explainable AI & SHAP Risk Analysis
    story.append(Paragraph("3. Explainable AI: Feature Attribution Analysis", section_heading))
    expl = prediction_record.get("explanation", {})
    summary_text = expl.get("summary_text", "No explanation text available.")
    story.append(Paragraph(f"<b>Hydrologic Risk Synthesis:</b> {summary_text}", body_style))
    story.append(Spacer(1, 6))
    
    top_factors = expl.get("top_factors", [])[:6]
    if top_factors:
        shap_h = [
            Paragraph("<b>Top Influential Feature</b>", table_header),
            Paragraph("<b>Value</b>", table_header),
            Paragraph("<b>SHAP Attribution</b>", table_header),
            Paragraph("<b>Risk Direction</b>", table_header),
        ]
        shap_rows = [shap_h]
        for f in top_factors:
            impact_color = colors.HexColor("#dc2626") if "Increases" in f["impact"] else colors.HexColor("#16a34a")
            shap_rows.append([
                Paragraph(f["feature"], table_cell),
                Paragraph(str(f["value"]) if f["value"] is not None else "-", table_cell),
                Paragraph(f"{f['shap_value']:+.4f}", table_cell),
                Paragraph(f"<font color='{impact_color.hexval()}'><b>{f['impact']}</b></font>", table_cell),
            ])
        shap_table = Table(shap_rows, colWidths=[180, 80, 100, 170])
        shap_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), teal_color),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 4),
            ('ALIGN', (1,0), (2,-1), 'CENTER'),
        ]))
        story.append(shap_table)
    story.append(Spacer(1, 12))
    
    # Section 4: Performance Comparison Chart
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
    chart_path = os.path.join(base_dir, "reports", "model_comparison_chart.png")
    if os.path.exists(chart_path):
        story.append(Paragraph("4. Benchmark Performance Visualization", section_heading))
        img = Image(chart_path, width=500, height=200)
        story.append(img)
        story.append(Spacer(1, 8))
        
    # Section 5: Academic Disclaimer & Methodology Notes
    disclaimer = (
        "<b>Academic Evaluation & Operational Disclaimer:</b> GeoFlood AI is trained on historical records "
        "from the INDOFLOODS national database (1965–2020) with strict gauge-group-aware validation to prevent "
        "spatial leakage. Warning/danger level thresholds and post-event variables were strictly excluded as predictive "
        "inputs. This report is intended for scientific decision support, risk analysis, and academic demonstration."
    )
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
    story.append(Paragraph(disclaimer, ParagraphStyle('Disc', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=colors.HexColor("#64748b"))))
    
    doc.build(story)
    return pdf_path
