import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { AnalysisReport, PreferenceAnalysis, Concept } from '@/types';

// ─── Helper utilities for reading from questionResponses ───

function getNumericResponse(analysis: PreferenceAnalysis, questionId: string): number {
  if (!analysis.questionResponses) return 0;
  const val = Number(analysis.questionResponses[questionId]);
  return isNaN(val) ? 0 : val;
}

function getStringResponse(analysis: PreferenceAnalysis, questionId: string): string {
  if (!analysis.questionResponses) return '';
  const val = analysis.questionResponses[questionId];
  if (val === undefined || val === null) return '';
  return Array.isArray(val) ? val.join(', ') : String(val);
}

function computeAverage(analyses: PreferenceAnalysis[], questionId: string): number {
  const values = analyses.map(a => getNumericResponse(a, questionId)).filter(v => v > 0);
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

function findTopConcept(concepts: Concept[], analyses: PreferenceAnalysis[]): string {
  let topTitle = 'N/A';
  let topScore = 0;

  for (const concept of concepts) {
    const conceptAnalyses = analyses.filter(a => a.conceptId === concept.id);
    if (conceptAnalyses.length === 0) continue;

    const scoreComponents = ['preference', 'innovativeness', 'differentiation']
      .map(qId => computeAverage(conceptAnalyses, qId))
      .filter(s => s > 0);

    if (scoreComponents.length === 0) continue;
    const avgScore = scoreComponents.reduce((s, v) => s + v, 0) / scoreComponents.length;

    if (avgScore > topScore) {
      topScore = avgScore;
      topTitle = concept.title;
    }
  }

  return topTitle;
}

// ─── Report Service ───

export class ReportService {
  static async generatePDFReport(report: AnalysisReport): Promise<void> {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

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

    // Summary Section — computed dynamically from questionResponses
    checkNewPage(60);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Analysis Summary', margin, yPosition);
    yPosition += 15;

    const avgPreference = computeAverage(report.analyses, 'preference');
    const avgInnovativeness = computeAverage(report.analyses, 'innovativeness');
    const avgDifferentiation = computeAverage(report.analyses, 'differentiation');
    const topConcept = findTopConcept(report.concepts, report.analyses);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    const summaryData = [
      ['Average Preference Score', `${avgPreference.toFixed(2)}/10`],
      ['Average Innovation Score', `${avgInnovativeness.toFixed(2)}/10`],
      ['Average Differentiation Score', `${avgDifferentiation.toFixed(2)}/10`],
      ['Top Performing Concept', topConcept]
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
      const avgPref = computeAverage(conceptAnalyses, 'preference');
      const avgInno = computeAverage(conceptAnalyses, 'innovativeness');
      const avgDiff = computeAverage(conceptAnalyses, 'differentiation');

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

    // Question Responses
    const questions = report.questions || [];
    if (questions.length > 0) {
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Question Responses', margin, yPosition);
      yPosition += 15;

      questions.forEach(question => {
        if (question.enabled) {
          checkNewPage(30);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Question: ${question.text}`, margin, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');

          report.analyses.forEach(analysis => {
            const responseVal = analysis.questionResponses ? analysis.questionResponses[question.id] : undefined;
            if (responseVal !== undefined && responseVal !== null) {
              const profile = report.profiles.find(p => p.id === analysis.profileId);
              const concept = report.concepts.find(c => c.id === analysis.conceptId);

              checkNewPage(15);
              pdf.text(
                `Profile: ${profile ? profile.name : 'Unknown'} | Concept: ${concept ? concept.title : 'Unknown'}`,
                margin,
                yPosition
              );
              yPosition += 7;

              const responseText = `Response: ${Array.isArray(responseVal) ? responseVal.join(', ') : responseVal}`;
              const lines = pdf.splitTextToSize(responseText, 170);
              lines.forEach((line: string) => {
                pdf.text(line, margin + 5, yPosition);
                yPosition += 5;
              });
              yPosition += 5;
            }
          });
          yPosition += 5;
        }
      });
    }

    // Save the PDF
    pdf.save(`consumer-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static generateExcelReport(report: AnalysisReport): void {
    const workbook = XLSX.utils.book_new();
    const questions = report.questions || [];

    // Compute summary scores dynamically
    const avgPreference = computeAverage(report.analyses, 'preference');
    const avgInnovativeness = computeAverage(report.analyses, 'innovativeness');
    const avgDifferentiation = computeAverage(report.analyses, 'differentiation');
    const topConcept = findTopConcept(report.concepts, report.analyses);

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
      ['Average Preference', avgPreference.toFixed(2)],
      ['Average Innovation', avgInnovativeness.toFixed(2)],
      ['Average Differentiation', avgDifferentiation.toFixed(2)],
      ['Top Performing Concept', topConcept],
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
      const avgPref = computeAverage(conceptAnalyses, 'preference');
      const avgInno = computeAverage(conceptAnalyses, 'innovativeness');
      const avgDiff = computeAverage(conceptAnalyses, 'differentiation');
      const overall = [avgPref, avgInno, avgDiff].filter(s => s > 0);
      const overallScore = overall.length > 0 ? overall.reduce((s, v) => s + v, 0) / overall.length : 0;

      return [
        concept.id,
        concept.title,
        concept.description,
        avgPref.toFixed(2),
        avgInno.toFixed(2),
        avgDiff.toFixed(2),
        overallScore.toFixed(2)
      ];
    });

    const conceptsSheet = XLSX.utils.aoa_to_sheet([conceptsHeaders, ...conceptsData]);
    XLSX.utils.book_append_sheet(workbook, conceptsSheet, 'Concepts Performance');

    // Consumer Profiles Sheet
    const profilesHeaders = ['Profile ID', 'Name', 'Age', 'Gender', 'Location', 'Income', 'Education', 'Lifestyle', 'Interests', 'Shopping Behavior', 'Tech Savviness', 'Environmental Awareness', 'Brand Loyalty', 'Price Sensitivity'];
    const profilesData = report.profiles.map(profile => [
      profile.id,
      profile.name,
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

    // Detailed Analysis Sheet — build columns dynamically from questions
    // Build headers: Profile ID, Profile Name, Concept ID, Concept Title, then one column per question
    const analysisHeaders = [
      'Profile ID',
      'Profile Name',
      'Concept ID',
      'Concept Title',
      ...questions.map(q => q.text)
    ];

    const analysisData = report.analyses.map(analysis => {
      const profile = report.profiles.find(p => p.id === analysis.profileId);
      const concept = report.concepts.find(c => c.id === analysis.conceptId);

      return [
        analysis.profileId,
        profile?.name || 'Unknown',
        analysis.conceptId,
        concept?.title || 'Unknown',
        ...questions.map(q => {
          if (q.type === 'scale_1_5' || q.type === 'scale_1_10') {
            const val = getNumericResponse(analysis, q.id);
            return val > 0 ? val : '';
          }
          return getStringResponse(analysis, q.id);
        })
      ];
    });

    const analysisSheet = XLSX.utils.aoa_to_sheet([analysisHeaders, ...analysisData]);
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Detailed Analysis');

    // Question Responses Sheet (long format — one row per profile×concept×question)
    if (questions.length > 0) {
      const questionsHeaders = ['Profile ID', 'Profile Name', 'Concept ID', 'Concept Title', 'Question', 'Response Type', 'Response'];
      const questionsData = report.analyses.flatMap(analysis => {
        if (!analysis.questionResponses) return [];
        const profile = report.profiles.find(p => p.id === analysis.profileId);
        const concept = report.concepts.find(c => c.id === analysis.conceptId);

        return Object.entries(analysis.questionResponses).map(([questionId, response]) => {
          const question = questions.find(q => q.id === questionId);
          return [
            analysis.profileId,
            profile?.name || 'Unknown',
            analysis.conceptId,
            concept?.title || 'Unknown',
            question ? question.text : questionId,
            question ? question.type.replace(/_/g, ' ') : 'unknown',
            Array.isArray(response) ? response.join(', ') : response,
          ];
        });
      });

      if (questionsData.length > 0) {
        const questionsSheet = XLSX.utils.aoa_to_sheet([questionsHeaders, ...questionsData]);
        XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Question Responses');
      }
    }

    // Save the workbook
    XLSX.writeFile(workbook, `consumer-analysis-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  static generateCSVReport(report: AnalysisReport): void {
    const questions = report.questions || [];

    // Prepare summary data for CSV — one row per profile×concept
    const summaryData = report.analyses.map(analysis => {
      const profile = report.profiles.find(p => p.id === analysis.profileId);
      const concept = report.concepts.find(c => c.id === analysis.conceptId);

      const baseData: Record<string, string | number> = {
        'Report Date': report.timestamp.toISOString().split('T')[0],
        'Profile ID': analysis.profileId,
        'Profile Name': profile?.name || '',
        'Profile Age': profile?.age || '',
        'Profile Gender': profile?.gender || '',
        'Profile Location': profile?.location || '',
        'Profile Income': profile?.income || '',
        'Profile Education': profile?.education || '',
        'Concept ID': analysis.conceptId,
        'Concept Title': concept?.title || '',
        'Concept Description': concept?.description || '',
      };

      // Add all question responses as columns
      if (questions.length > 0) {
        questions.forEach(q => {
          if (q.type === 'scale_1_5' || q.type === 'scale_1_10') {
            baseData[q.text] = getNumericResponse(analysis, q.id) || '';
          } else {
            baseData[q.text] = getStringResponse(analysis, q.id);
          }
        });
      } else {
        // Fallback: dump all questionResponses keys
        if (analysis.questionResponses) {
          Object.entries(analysis.questionResponses).forEach(([key, val]) => {
            baseData[key] = Array.isArray(val) ? val.join('; ') : (val as string | number);
          });
        }
      }

      return baseData;
    });

    if (summaryData.length === 0) {
      const blob = new Blob(["No analysis data to report."], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `empty-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Convert to CSV
    const headers = Object.keys(summaryData[0]);
    const csvContent = [
      headers.join(','),
      ...summaryData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          const stringValue = String(value === null || value === undefined ? '' : value).replace(/"/g, '""');
          return stringValue.includes(',') || stringValue.includes('\n') ? `"${stringValue}"` : stringValue;
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
