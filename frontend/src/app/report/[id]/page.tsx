
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useReports } from '@/hooks/use-reports';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, AlertTriangle, Search, FileDown, Loader2, GitGraph, Network } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import type { Report } from '@/types/ipdr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion } from 'framer-motion';

// Extend jsPDF with autotable typings
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}


export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const { getReportById } = useReports();
  const [report, setReport] = useState<Report | undefined>(undefined);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (id) {
      const loadReport = async () => {
        setIsLoading(true);
        const fetchedReport = await getReportById(id);
        setReport(fetchedReport ?? undefined);
        setIsLoading(false);
      }
      loadReport();
    }
  }, [id, getReportById]);

  const handleNavigate = (path: string) => {
    setIsNavigating(true);
    router.push(path);
  };

  const handleDownloadPdf = async () => {
    if (!report) return;

    setIsGeneratingPdf(true);
    try {
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.text(`IPDR Analysis Report`, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`File: ${report.fileName}`, 105, 28, { align: 'center' });


        doc.setFontSize(16);
        doc.text('Report Details', 14, 45);
        doc.setFontSize(11);
        doc.text(`Created At: ${new Date(report.createdAt).toLocaleString()}`, 14, 52);
        doc.text(`Total Sessions: ${report.sessionCount}`, 14, 59);
        doc.text(`Anomalous Sessions: ${report.anomalyCount}`, 14, 66);

        doc.setFontSize(16);
        doc.text('AI Analysis & Summary', 14, 80);
        doc.setFontSize(11);
        const summaryLines = doc.splitTextToSize(report.summary, 180);
        doc.text(summaryLines, 14, 87);
        
        let lastY = 87 + (summaryLines.length * 7);

        if (report.anomalyCount > 0) {
            const anomalousEdges = report.edges.filter(edge => edge.isAnomalous);
            const tableBody = anomalousEdges.map(edge => [
                edge.data.session_id || 'N/A',
                edge.data.src_ip || 'N/A',
                edge.data.src_phone || 'N/A',
                edge.data.dst_ip || 'N/A',
                edge.data.dst_phone || 'N/A',
                edge.data.protocol || 'N/A',
                edge.anomalyReason || 'No reason given'
            ]);
            
            lastY = Math.max(lastY, 110);
            doc.setFontSize(16);
            doc.text('Anomalous Session Details', 14, lastY);

            doc.autoTable({
                startY: lastY + 5,
                head: [['Session ID', 'Source IP', 'Source Phone', 'Dest IP', 'Dest Phone', 'Protocol', 'Reason']],
                body: tableBody,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { fontSize: 8 },
            });
        }
        
        doc.save(`report-${report.fileName.replace('.csv', '')}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };


  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[40vh] w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Report Not Found</h1>
        <p className="mt-2 text-muted-foreground">The report with ID "{id}" could not be found.</p>
      </div>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {isNavigating && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-foreground">Loading Graph...</p>
            </div>
        )}
        <motion.div 
            className="flex items-center gap-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="font-semibold text-lg md:text-2xl">Report: <span className="text-primary">{report.fileName}</span></h1>
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="ml-auto">
                {isGeneratingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                )}
                Download PDF
            </Button>
        </motion.div>
        
        <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            AI Analysis & Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{report.summary}</p>
                         {report.anomalyCount > 0 && (
                            <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive-foreground">
                                <h4 className="font-semibold text-destructive">Anomalous Sessions Detected: {report.anomalyCount}</h4>
                                <p className="text-sm text-destructive-foreground/80 mt-1">
                                    Anomalous sessions are highlighted in the graph views. Click on a session line to see details.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GitGraph className="h-5 w-5 text-primary"/>
                            Explore Full Graph
                        </CardTitle>
                        <CardDescription>
                            Interactively visualize the entire dataset. Note: may be slow for large reports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <motion.div
                            whileHover={{ scale: 1.03, y: -3 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Card 
                                className="h-full hover:bg-card-foreground/5 cursor-pointer transition-all duration-300 hover:border-primary"
                                onClick={() => handleNavigate(`/report/${id}/2d`)}
                            >
                                <CardHeader>
                                    <CardTitle>2D Graph</CardTitle>
                                    <CardDescription>A 2D force-directed graph. Good for understanding connections and structure.</CardDescription>
                                </CardHeader>
                            </Card>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.03, y: -3 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Card 
                                className="h-full hover:bg-card-foreground/5 cursor-pointer transition-all duration-300 hover:border-primary"
                                 onClick={() => handleNavigate(`/report/${id}/3d`)}
                            >
                                <CardHeader>
                                    <CardTitle>3D Graph</CardTitle>
                                    <CardDescription>An interactive 3D representation. Good for exploring large, complex networks.</CardDescription>
                                </CardHeader>
                            </Card>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div className="lg:col-span-1 space-y-6" variants={itemVariants}>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Network className="h-5 w-5 text-primary"/>
                            Investigation Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                       <Button className="w-full" onClick={() => handleNavigate(`/report/${id}/search`)}>
                            <Search className="mr-2 h-4 w-4" /> Isolate a Node
                        </Button>
                         <p className="text-sm text-muted-foreground text-center">
                            Find a specific IP or Phone and view its direct connections.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Report Details</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 font-code">
                        <p><strong>File Name:</strong> {report.fileName}</p>
                        <p><strong>Created At:</strong> {new Date(report.createdAt).toLocaleString()}</p>
                        <p><strong>Total Sessions:</strong> {report.sessionCount}</p>
                        <p><strong>Anomalies Found:</strong> {report.anomalyCount}</p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    </main>
  );
}
