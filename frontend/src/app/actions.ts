
'use server';

import { constructGraph } from '@/lib/graph-constructor';
import { parseCsv, parseJson, parseExcel } from '@/lib/parsers';
import { Report } from '@/types/ipdr';
import { Collection, ObjectId, WithId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { encrypt, decrypt } from '@/lib/crypto';


interface AnomalyPrediction {
  session_id: string;
  anomaly: 1 | 0;
  confidence_score: number;
}

type FileType = 'csv' | 'json' | 'excel';

async function getReportsCollection(): Promise<Collection<Omit<Report, 'id'>>> {
  const db = await getDb();
  return db.collection<Omit<Report, 'id'>>('reports');
}


// Combines parsing and anomaly detection into a single server action
export async function processAndAnalyzeIpdr(fileContent: string, fileName: string, fileType: FileType): Promise<Report> {
  console.log(`Starting IPDR processing for ${fileName} (type: ${fileType})`);

  let records: Record<string, any>[];
  try {
    switch(fileType) {
      case 'csv':
        records = parseCsv(fileContent);
        break;
      case 'json':
        records = parseJson(fileContent);
        break;
      case 'excel':
        // For excel, fileContent is base64 encoded
        const buffer = Buffer.from(fileContent, 'base64');
        records = parseExcel(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error("Parsing error:", error);
    throw new Error(`Failed to parse ${fileName}. Please ensure the file format is correct.`);
  }

  const { graphData, parseSummary } = constructGraph(records);
  console.log(`Graph Constructed: ${parseSummary}`);

  let finalReport: Omit<Report, 'id'>;
  const createdAt = new Date();

  try {
    console.log("Calling anomaly detection API...");
    const apiPayload = graphData.edges.map(edge => {
        return {
            timestamp: edge.data.timestamp,
            session_id: edge.data.session_id,
            src_port: parseInt(edge.data.src_port, 10) || 0,
            dst_port: parseInt(edge.data.dst_port, 10) || 0,
            protocol: edge.data.protocol,
            duration_sec: parseInt(edge.data.duration_sec, 10) || 0,
            bytes: parseInt(edge.data.bytes, 10) || 0,
            cell_tower_lat: parseFloat(edge.data.cell_tower_lat) || 0,
            cell_tower_lon: parseFloat(edge.data.cell_tower_lon) || 0,
        };
    });
    
    const authToken = process.env.AUTH_TOKEN_SECRET;
    const response = await fetch('https://ipdr-graph-engine-api-1004676663046.us-central1.run.app/api/v1/anomalies/predict', {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anomaly API Error:", response.status, errorBody);
      throw new Error(`Anomaly detection service failed with status: ${response.status}`);
    }

    const predictions: AnomalyPrediction[] = await response.json();
    console.log(`Received ${predictions.length} predictions from API.`);

    const anomalousSessionIds = new Map<string, string>();
    predictions.forEach(p => {
      if (p.anomaly === 1) {
        anomalousSessionIds.set(p.session_id, `Confidence: ${(p.confidence_score * 100).toFixed(2)}%`);
      }
    });

    let anomalyCount = 0;
    const updatedEdges = graphData.edges.map(edge => {
      const sessionId = edge.data['session_id'];
      if (sessionId && anomalousSessionIds.has(sessionId)) {
        anomalyCount++;
        return {
          ...edge,
          isAnomalous: true,
          anomalyReason: anomalousSessionIds.get(sessionId),
        };
      }
      return edge;
    });
    
    // Encrypt the sensitive data before storing
    const encryptedNodes = await encrypt(JSON.stringify(graphData.nodes));
    const encryptedEdges = await encrypt(JSON.stringify(updatedEdges));

    finalReport = {
      fileName: fileName,
      createdAt: createdAt,
      sessionCount: graphData.edges.length,
      anomalyCount: anomalyCount,
      nodes: encryptedNodes as any, // Store as encrypted string
      edges: encryptedEdges as any, // Store as encrypted string
      summary: `Analysis complete. Found ${anomalyCount} anomalous session(s).`,
    };
    
    console.log("Report generated successfully with encryption.");

  } catch (error) {
    console.error("Error during IPDR analysis:", error);
    if (error instanceof Error && !error.message.includes("Anomaly detection service failed")) {
         throw error;
    }
   
    console.warn("Anomaly detection failed. Proceeding without anomaly data, but with encryption.");
    
    // Encrypt the sensitive data even if API fails
    const encryptedNodes = await encrypt(JSON.stringify(graphData.nodes));
    const encryptedEdges = await encrypt(JSON.stringify(graphData.edges));

    finalReport = {
        fileName: fileName,
        createdAt: createdAt,
        sessionCount: graphData.edges.length,
        anomalyCount: 0,
        nodes: encryptedNodes as any, // Store as encrypted string
        edges: encryptedEdges as any, // Store as encrypted string
        summary: `Analysis complete. Anomaly detection service could not be reached.`,
    };
  }

  const reportsCollection = await getReportsCollection();
  const result = await reportsCollection.insertOne(finalReport);
  
  // Decrypt for immediate return to client
  const decryptedNodes = JSON.parse(await decrypt(finalReport.nodes as any));
  const decryptedEdges = JSON.parse(await decrypt(finalReport.edges as any));

  return {
    ...finalReport,
    id: result.insertedId.toHexString(),
    createdAt: finalReport.createdAt.toISOString(),
    nodes: decryptedNodes,
    edges: decryptedEdges,
  };
}


export async function getReports(): Promise<Pick<Report, 'id' | 'fileName' | 'createdAt' | 'sessionCount' | 'anomalyCount'>[]> {
  const reportsCollection = await getReportsCollection();
  const reports = await reportsCollection.find({}, {
    projection: { 
      fileName: 1, 
      createdAt: 1, 
      sessionCount: 1, 
      anomalyCount: 1 
    },
    sort: { createdAt: -1 }
  }).toArray();

  return reports.map(report => {
    const { _id, ...rest } = report as WithId<Omit<Report, 'id'>>;
    return {
      ...rest,
      id: _id.toHexString(),
      createdAt: (rest.createdAt as Date).toISOString(),
    } as Pick<Report, 'id' | 'fileName' | 'createdAt' | 'sessionCount' | 'anomalyCount'>;
  });
}

export async function getReportById(id: string): Promise<Report | null> {
  if (!ObjectId.isValid(id)) {
    console.error("Invalid report ID format");
    return null;
  }
  const reportsCollection = await getReportsCollection();
  const report = await reportsCollection.findOne({ _id: new ObjectId(id) });
  if (!report) return null;

  const { _id, ...rest } = report as WithId<Omit<Report, 'id'>>;
  
  try {
    // Decrypt nodes and edges before returning
    const decryptedNodes = JSON.parse(await decrypt(rest.nodes as any));
    const decryptedEdges = JSON.parse(await decrypt(rest.edges as any));

    return {
      ...rest,
      id: _id.toHexString(),
      createdAt: (rest.createdAt as Date).toISOString(),
      nodes: decryptedNodes,
      edges: decryptedEdges,
    } as Report;
  } catch (e) {
    console.error('Failed to decrypt report data:', e);
    // Return report with a clear error state if decryption fails
    return {
      ...rest,
      id: _id.toHexString(),
      createdAt: (rest.createdAt as Date).toISOString(),
      nodes: [],
      edges: [],
      summary: "Error: Could not decrypt report data. Check encryption key.",
      anomalyCount: -1, // Indicate an error state
    } as Report;
  }
}


export async function deleteReport(id: string): Promise<{ success: boolean }> {
  if (!ObjectId.isValid(id)) {
      console.error("Invalid report ID format for deletion");
      return { success: false };
  }
  const reportsCollection = await getReportsCollection();
  const result = await reportsCollection.deleteOne({ _id: new ObjectId(id) });
  return { success: result.deletedCount === 1 };
}
