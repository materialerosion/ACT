import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { AnalysisReport, PreferenceAnalysis, Concept, ConsumerProfile } from '@/types';

export class ReportService {
  static async generatePDFReport(report: AnalysisReport): Promise<void> {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Consumer Profile Analysis Report', margin, yPosition);
    yPosition += 15;

    // Report metadata
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${report.timestamp.toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;
    pdf.text(`Total Profiles: ${report.profiles.length}`, margin, yPosition);
    yPosition += 10;
    pdf.text(`Total Concepts: ${report.concepts.length}`, margin, yPosition);
    yPosition += 20;

    // Demographics Section
    checkNewPage(40);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Target Demographics', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Age Ranges: ${report.demographics.ageRanges.join(', ')}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Genders: ${report.demographics.genders.join(', ')}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Locations: ${report.demographics.locations.join(', ')}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Income Ranges: ${report.demographics.incomeRanges.join(', ')}`, margin, yPosition);
    yPosition += 8;
    pdf.text(`Education Levels: ${report.demographics.educationLevels.join(', ')}`, margin, yPosition);
    yPosition += 20;

    // Summary Section
    checkNewPage(60);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Analysis Summary', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const summaryData = [
      [`Average Preference Score`, `${report.summary.averagePreference.toFixed(2)}/10`],
      [`Average Innovation Score`, `${report.summary.averageInnovativeness.toFixed(2)}/10`],
      [`Average Differentiation Score`, `${report.summary.averageDifferentiation.toFixed(2)}/10`],
      [`Top Performing Concept`, report.summary.topPerformingConcept]
    ];

    summaryData.forEach(([label, value]) => {
      pdf.text(`${label}: ${value}`, margin, yPosition);
      yPosition += 10;
    });
    yPosition += 10;

    // Concepts Performance
    checkNewPage(40);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Concepts Performance', margin, yPosition);
    yPosition += 15;

    report.concepts.forEach((concept, index) => {
      checkNewPage(30);
      
      const conceptAnalyses = report.analyses.filter(a => a.conceptId === concept.id);
      const avgPref = conceptAnalyses.reduce((sum, a) => sum + a.preference, 0) / conceptAnalyses.length;
      const avgInno = conceptAnalyses.reduce((sum, a) => sum + a.innovativeness, 0) / conceptAnalyses.length;
      const avgDiff = conceptAnalyses.reduce((sum, a) => sum + a.differentiation, 0) / conceptAnalyses.length;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${concept.title}`, margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Preference: ${avgPref.toFixed(2)}/10`, margin + 10, yPosition);
      yPosition += 8;
      pdf.text(`Innovation: ${avgInno.toFixed(2)}/10`, margin + 10, yPosition);
      yPosition += 8;
      pdf.text(`Differentiation: ${avgDiff.toFixed(2)}/10`, margin + 10, yPosition);
      yPosition += 15;
    });

    // Key Insights
    checkNewPage(40);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Insights', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    report.summary.insights.forEach((insight, index) => {
      checkNewPage(20);
      
      const lines = pdf.splitTextToSize(`${index + 1}. ${insight}`, 170);
      lines.forEach((line: string) => {
        pdf.text(line, margin, yPosition);
        yPosition += 8;
      });
      yPosition += 5;
    });

    // Save the PDF
    pdf.save(`consumer-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static generateExcelReport(report: AnalysisReport): void {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Consumer Profile Analysis Report'],
      [''],
      ['Report Information'],
      ['Generated Date', report.timestamp.toLocaleDateString()],
      ['Total Profiles', report.profiles.length],
      ['Total Concepts', report.concepts.length],
      ['Total Analyses', report.analyses.length],
      ['Target Consumer Count', report.demographics.consumerCount],
      [''],
      ['Demographics'],
      ['Age Ranges', report.demographics.ageRanges.join(', ')],
      ['Genders', report.demographics.genders.join(', ')],
      ['Locations', report.demographics.locations.join(', ')],
      ['Income Ranges', report.demographics.incomeRanges.join(', ')],
      ['Education Levels', report.demographics.educationLevels.join(', ')],
      [''],
      ['Summary Scores'],
      ['Average Preference', report.summary.averagePreference.toFixed(2)],
      ['Average Innovation', report.summary.averageInnovativeness.toFixed(2)],
      ['Average Differentiation', report.summary.averageDifferentiation.toFixed(2)],
      ['Top Performing Concept', report.summary.topPerformingConcept],
      [''],
      ['Key Insights'],
      ...report.summary.insights.map((insight, index) => [`${index + 1}`, insight])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Concepts Performance Sheet
    const conceptsHeaders = ['Concept ID', 'Title', 'Description', 'Avg Preference', 'Avg Innovation', 'Avg Differentiation', 'Overall Score'];
    const conceptsData = report.concepts.map(concept => {
      const conceptAnalyses = report.analyses.filter(a => a.conceptId === concept.id);
      const avgPref = conceptAnalyses.reduce((sum, a) => sum + a.preference, 0) / conceptAnalyses.length;
      const avgInno = conceptAnalyses.reduce((sum, a) => sum + a.innovativeness, 0) / conceptAnalyses.length;
      const avgDiff = conceptAnalyses.reduce((sum, a) => sum + a.differentiation, 0) / conceptAnalyses.length;
      const overall = (avgPref + avgInno + avgDiff) / 3;

      return [
        concept.id,
        concept.title,
        concept.description,
        avgPref.toFixed(2),
        avgInno.toFixed(2),
        avgDiff.toFixed(2),
        overall.toFixed(2)
      ];
    });

    const conceptsSheet = XLSX.utils.aoa_to_sheet([conceptsHeaders, ...conceptsData]);
    XLSX.utils.book_append_sheet(workbook, conceptsSheet, 'Concepts Performance');

    // Consumer Profiles Sheet
    const profilesHeaders = ['Profile ID', 'Age', 'Gender', 'Location', 'Income', 'Education', 'Lifestyle', 'Interests', 'Shopping Behavior', 'Tech Savviness', 'Environmental Awareness', 'Brand Loyalty', 'Price Sensitivity'];
    const profilesData = report.profiles.map(profile => [
      profile.id,
      profile.age,
      profile.gender,
      profile.location,
      profile.income,
      profile.education,
      profile.lifestyle,
      profile.interests.join('; '),
      profile.shoppingBehavior,
      profile.techSavviness,
      profile.environmentalAwareness,
      profile.brandLoyalty,
      profile.pricesensitivity
    ]);

    const profilesSheet = XLSX.utils.aoa_to_sheet([profilesHeaders, ...profilesData]);
    XLSX.utils.book_append_sheet(workbook, profilesSheet, 'Consumer Profiles');

    // Detailed Analysis Sheet
    const analysisHeaders = ['Profile ID', 'Concept ID', 'Concept Title', 'Preference', 'Innovation', 'Differentiation', 'Reasoning'];
    const analysisData = report.analyses.map(analysis => {
      const concept = report.concepts.find(c => c.id === analysis.conceptId);
      return [
        analysis.profileId,
        analysis.conceptId,
        concept?.title || 'Unknown',
        analysis.preference,
        analysis.innovativeness,
        analysis.differentiation,
        analysis.reasoning
      ];
    });

    const analysisSheet = XLSX.utils.aoa_to_sheet([analysisHeaders, ...analysisData]);
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Detailed Analysis');

    // Save the workbook
    XLSX.writeFile(workbook, `consumer-analysis-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  static generateCSVReport(report: AnalysisReport): void {
    // Prepare summary data for CSV
    const summaryData = report.analyses.map(analysis => {
      const profile = report.profiles.find(p => p.id === analysis.profileId);
      const concept = report.concepts.find(c => c.id === analysis.conceptId);
      
      return {
        'Report Date': report.timestamp.toISOString().split('T')[0],
        'Profile ID': analysis.profileId,
        'Profile Age': profile?.age || '',
        'Profile Gender': profile?.gender || '',
        'Profile Location': profile?.location || '',
        'Profile Income': profile?.income || '',
        'Profile Education': profile?.education || '',
        'Concept ID': analysis.conceptId,
        'Concept Title': concept?.title || '',
        'Concept Description': concept?.description || '',
        'Preference Score': analysis.preference,
        'Innovation Score': analysis.innovativeness,
        'Differentiation Score': analysis.differentiation,
        'Reasoning': analysis.reasoning
      };
    });

    // Convert to CSV
    const headers = Object.keys(summaryData[0]);
    const csvContent = [
      headers.join(','),
      ...summaryData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value).replace(/"/g, '""');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `consumer-analysis-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}