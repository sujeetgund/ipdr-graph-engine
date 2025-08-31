
import { GraphData, IpdrNode, IpdrEdge } from '@/types/ipdr';

export function constructGraph(records: Record<string, any>[]): { graphData: GraphData, parseSummary: string } {
  if (records.length === 0) {
    return { graphData: { nodes: [], edges: [] }, parseSummary: "No data rows found." };
  }

  const nodes = new Map<string, IpdrNode>();
  const edges: IpdrEdge[] = [];

  let skippedRows = 0;
  records.forEach((record, index) => {
    // Normalize keys to lowercase for consistent access
    const lowerCaseRecord: Record<string, any> = {};
    for (const key in record) {
        lowerCaseRecord[key.toLowerCase()] = record[key];
    }
    
    const { src_phone, dst_phone, src_ip, dst_ip, session_id } = lowerCaseRecord;

    // Prioritize phone numbers, fall back to IPs
    const sourceId = String(src_phone || src_ip);
    const targetId = String(dst_phone || dst_ip);

    if (!sourceId || !targetId || sourceId === 'undefined' || targetId === 'undefined') {
      console.warn(`Skipping record ${index + 1} due to missing source or target ID.`);
      skippedRows++;
      return;
    }

    if (!nodes.has(sourceId)) {
      const type = src_phone ? 'phone' : 'ip';
      nodes.set(sourceId, { id: sourceId, label: sourceId, type });
    }
    if (!nodes.has(targetId)) {
      const type = dst_phone ? 'phone' : 'ip';
      nodes.set(targetId, { id: targetId, label: targetId, type });
    }

    const currentSessionId = session_id || `session-${index}`;
    const edgeId = `${sourceId}-${targetId}-${currentSessionId}-${index}`;

    edges.push({
      id: edgeId,
      source: sourceId,
      target: targetId,
      isAnomalous: false, // Default to not anomalous
      data: lowerCaseRecord,
    });
  });

  const parseSummary = `Graph construction complete. Found ${nodes.size} nodes and ${edges.length} edges from ${records.length} records. Skipped ${skippedRows} records.`;
  return { 
    graphData: { nodes: Array.from(nodes.values()), edges },
    parseSummary,
  };
}
