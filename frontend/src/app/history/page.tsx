
import { HistoryTable } from "@/components/ipdr/history-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center gap-4">
        <h1 className="font-semibold text-lg md:text-2xl">Analysis History</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Past Reports</CardTitle>
          <CardDescription>
            Browse through your previously generated reports. Click on a report to view its interactive graph.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryTable />
        </CardContent>
      </Card>
    </main>
  );
}
