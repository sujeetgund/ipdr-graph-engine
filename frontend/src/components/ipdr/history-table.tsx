
'use client'

import { useState } from "react";
import { useReports } from "@/hooks/use-reports";
import { Report } from "@/types/ipdr";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart, Eye, FileDown, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from "@/hooks/use-toast";

// Extend jsPDF with autotable typings
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}


export function HistoryTable() {
    const { reports, deleteReport, getReportById, isLoaded } = useReports();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);
    const { toast } = useToast();

    const handleDownloadPdf = async (reportSummary: Pick<Report, 'id' | 'fileName'>) => {
        setIsGeneratingPdf(reportSummary.id);
        try {
            const report = await getReportById(reportSummary.id);
            if (!report) {
                 toast({ variant: "destructive", title: "PDF Generation Failed", description: "Could not fetch the full report." });
                 return;
            }

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
            toast({ variant: "destructive", title: "PDF Generation Failed", description: "An unexpected error occurred." });
        } finally {
            setIsGeneratingPdf(null);
        }
    };


    if (!isLoaded) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }
    
    if (reports.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <BarChart className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
                <p className="mt-2 text-sm">Upload a file on the dashboard to get started.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                        <TableHead>Sessions</TableHead>
                        <TableHead>Anomalies</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell className="font-medium">{report.fileName}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>{report.sessionCount}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {report.anomalyCount > 0 ? (
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                    ) : (
                                        <span className="h-4 w-4" />
                                    )}
                                    {report.anomalyCount}
                                </div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button onClick={() => handleDownloadPdf(report)} disabled={isGeneratingPdf === report.id} size="icon" variant="outline">
                                    {isGeneratingPdf === report.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileDown className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Download PDF</span>
                                </Button>
                                <Button asChild variant="ghost" size="icon">
                                    <Link href={`/report/${report.id}`}>
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">View Report</span>
                                    </Link>
                                </Button>
                                 <Button onClick={() => deleteReport(report.id)} size="icon" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete Report</span>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
