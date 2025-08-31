
export interface IpdrNode {
  id: string | number;
  label: string;
  type: 'ip' | 'phone';
}

export interface IpdrEdge {
  id: string;
  source: string | number;
  target: string | number;
  isAnomalous: boolean;
  anomalyReason?: string;
  data: { [key: string]: any };
}

export interface GraphData {
  nodes: IpdrNode[];
  edges: IpdrEdge[];
}

// Stored in DB without id, but retrieved with it.
// `id` is the string representation of MongoDB's `_id`
// `createdAt` is a string in ISO format when passed to client
export interface Report extends GraphData {
  id: string; 
  createdAt: string | Date;
  fileName: string;
  sessionCount: number;
  anomalyCount: number;
  summary: string;
}

export interface LatLng {
    lat: number;
    lng: number;
}

export interface MapLocation extends LatLng {
    id: string;
    title: string;
    details: Record<string, string>;
}
