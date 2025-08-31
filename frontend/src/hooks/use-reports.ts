
"use client";

import { Report } from "@/types/ipdr";
import { useState, useEffect, useCallback } from "react";
import { getReports as fetchReports, getReportById as fetchReportById, deleteReport as deleteReportAction } from "@/app/actions";
import { useToast } from "./use-toast";

export function useReports() {
  const [reports, setReports] = useState<Pick<Report, 'id' | 'fileName' | 'createdAt' | 'sessionCount' | 'anomalyCount'>[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const loadReports = useCallback(async () => {
    try {
      setIsLoaded(false);
      const fetchedReports = await fetchReports();
      setReports(fetchedReports as any);
    } catch (error) {
      console.error("Failed to load reports from database", error);
      toast({
        variant: "destructive",
        title: "Failed to load reports",
        description: "Could not connect to the database. Please try again later.",
      });
      setReports([]);
    } finally {
      setIsLoaded(true);
    }
  }, [toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const addReport = useCallback((report: Report) => {
    // The report is already added via the server action.
    // We just need to refresh the list to show the new one.
    loadReports();
  }, [loadReports]);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      const result = await deleteReportAction(reportId);
      if(result.success) {
        setReports((prevReports) => prevReports.filter(report => report.id !== reportId));
        toast({ title: "Report Deleted", description: "The report has been successfully deleted." });
      } else {
        throw new Error("Deletion failed on server.");
      }
    } catch (error) {
      console.error("Failed to delete report", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the report. Please try again.",
      });
    }
  }, [toast]);

  const getReportById = useCallback(async (id: string): Promise<Report | null> => {
    try {
      return await fetchReportById(id);
    } catch (error) {
      console.error("Failed to fetch report by ID", error);
      toast({
        variant: "destructive",
        title: "Failed to load report",
        description: "Could not load the requested report from the database.",
      });
      return null;
    }
  }, [toast]);

  return { reports, addReport, deleteReport, getReportById, isLoaded, refreshReports: loadReports };
}
