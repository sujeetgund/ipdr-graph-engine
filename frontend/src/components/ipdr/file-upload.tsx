
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReports } from "@/hooks/use-reports";
import { processAndAnalyzeIpdr } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { UploadCloud } from "lucide-react";
import { parseJsonToTable, parseExcelToTable, parseCsvToTable } from "@/lib/parsers";
import { Loader2 } from "lucide-react";

type FileType = 'csv' | 'json' | 'excel';

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Preparing analysis...");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { addReport } = useReports();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    let currentFileType: FileType | null = null;
    let parsedPreview: { headers: string[], rows: string[][] } | null = null;

    const reader = new FileReader();
    
    if (extension === 'csv') {
        currentFileType = 'csv';
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setFileContent(text);
            parsedPreview = parseCsvToTable(text, 10);
            if (parsedPreview) {
                setPreviewData(parsedPreview);
                setIsModalOpen(true);
            }
        };
        reader.readAsText(selectedFile);
    } else if (extension === 'json') {
        currentFileType = 'json';
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setFileContent(text);
            parsedPreview = parseJsonToTable(text, 10);
             if (parsedPreview) {
                setPreviewData(parsedPreview);
                setIsModalOpen(true);
            } else {
                 toast({ variant: "destructive", title: "Invalid JSON", description: "Could not parse JSON file. Ensure it is an array of objects." });
            }
        };
        reader.readAsText(selectedFile);
    } else if (extension === 'xls' || extension === 'xlsx') {
        currentFileType = 'excel';
        reader.onload = async (event) => {
            const data = event.target?.result as ArrayBuffer;
            setFileContent(Buffer.from(data).toString('base64')); // Send base64 to server
            parsedPreview = await parseExcelToTable(data, 10);
            if (parsedPreview) {
                setPreviewData(parsedPreview);
                setIsModalOpen(true);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a valid .csv, .json, .xls, or .xlsx file.",
      });
      return;
    }
    
    setFile(selectedFile);
    setFileType(currentFileType);

  };

  const handleAnalyze = async () => {
    if (!file || !fileType || !fileContent) return;

    setIsProcessing(true);
    setIsModalOpen(false);
    
    try {
      setStatusText("Uploading and parsing file...");
      setProgress(25);
      
      setStatusText("Analyzing for anomalies...");
      setProgress(50);

      const report = await processAndAnalyzeIpdr(fileContent, file.name, fileType);
      
      setStatusText("Finalizing report...");
      setProgress(90);

      addReport(report);
      setProgress(100);
      setStatusText("Analysis complete!");
      
      router.push(`/report/${report.id}`);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.json,.xls,.xlsx"
        className="hidden"
        disabled={isProcessing}
      />
      
      <div 
        className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer border-border hover:bg-accent/20 transition-colors"
        onClick={handleTriggerClick}
        onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileChange({ target: { files: e.dataTransfer.files } } as any);
            }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <UploadCloud className="w-12 h-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-semibold">Click to upload or drag and drop</p>
        <p className="text-sm text-muted-foreground">CSV, JSON, or Excel files</p>
      </div>


      {isProcessing && (
        <div className="w-full mt-4">
          <div className="flex justify-between mb-1">
             <span className="text-base font-medium text-primary">{statusText}</span>
             <span className="text-sm font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview: {file?.name}</DialogTitle>
            <DialogDescription>
              Here's a preview of the first 10 rows. Does this look correct?
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[50vh] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary">
                <TableRow>
                  {previewData.headers.map((header, i) => (
                    <TableHead key={i}>{header || 'Empty Header'}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.rows.map((row, i) => (
                  <TableRow key={i}>
                    {row.map((cell, j) => (
                      <TableCell key={j} className="whitespace-nowrap">{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAnalyze} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
