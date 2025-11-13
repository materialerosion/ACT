'use client';

import React from 'react';
import { AnalysisReport } from '@/types';
import { ReportService } from '@/services/reportService';
import { Download, FileText, FileSpreadsheet, FileImage } from 'lucide-react';

interface ReportDownloadProps {
  report: AnalysisReport;
}

export default function ReportDownload({ report }: ReportDownloadProps) {
  const handleDownloadPDF = async () => {
    try {
      await ReportService.generatePDFReport(report);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  const handleDownloadExcel = () => {
    try {
      ReportService.generateExcelReport(report);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel report. Please try again.');
    }
  };

  const handleDownloadCSV = () => {
    try {
      ReportService.generateCSVReport(report);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Failed to generate CSV report. Please try again.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center mb-4">
        <Download className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-xl font-bold text-gray-800">Download Reports</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        Download your consumer analysis results in various formats for further analysis or presentation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PDF Report */}
        <button
          onClick={handleDownloadPDF}
          className="flex flex-col items-center p-6 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors group"
        >
          <FileText className="w-12 h-12 text-red-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-gray-800 mb-1">PDF Report</h4>
          <p className="text-sm text-gray-600 text-center">
            Comprehensive report with summary, insights, and visualizations
          </p>
        </button>

        {/* Excel Report */}
        <button
          onClick={handleDownloadExcel}
          className="flex flex-col items-center p-6 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors group"
        >
          <FileSpreadsheet className="w-12 h-12 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-gray-800 mb-1">Excel Workbook</h4>
          <p className="text-sm text-gray-600 text-center">
            Multi-sheet workbook with detailed data for analysis
          </p>
        </button>

        {/* CSV Report */}
        <button
          onClick={handleDownloadCSV}
          className="flex flex-col items-center p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
        >
          <FileImage className="w-12 h-12 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-gray-800 mb-1">CSV Data</h4>
          <p className="text-sm text-gray-600 text-center">
            Raw data in CSV format for custom analysis
          </p>
        </button>
      </div>

      {/* Report Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Report Contents</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Demographics and profile information ({report.profiles.length} profiles)</li>
          <li>• Concepts performance analysis ({report.concepts.length} concepts)</li>
          <li>• Preference, innovation, and differentiation scores</li>
          <li>• AI-generated insights and recommendations</li>
          <li>• Summary statistics and rankings</li>
        </ul>
      </div>
    </div>
  );
}