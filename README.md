<div align="center">
  <img src="https://github.com/user-attachments/assets/f42f6600-98f3-4e78-aafe-1be755a1c0ce" alt="IPDR Graph Engine Logo" width="200"/>
  <br/>
  <h1><b>IPDR Graph Engine</b></h1>
  <p><b>A web-based investigative platform that transforms complex telecommunications IPDR data into actionable intelligence through ML-powered anomaly detection and interactive visualizations.</b></p>
</div>

<div align="center">
  <a href="https://ipdr-graph-engine.vercel.app/">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_App-blue?style=for-the-badge" alt="Live Demo" />
  </a>
  
  <a href="https://ipdr-graph-engine-api-1004676663046.us-central1.run.app/docs">
    <img src="https://img.shields.io/badge/📖_API_Docs-FastAPI-green?style=for-the-badge" alt="API Docs" />
  </a>
  
  <a href="https://ipdr-graph-engine.vercel.app/">
    <img src="https://img.shields.io/badge/🏆_CIIS_2025-Hackathon_Project-orange?style=for-the-badge" alt="CIIS 2025" />
  </a>
  
  <img src="https://img.shields.io/badge/Model%20Accuracy-94.45%25-success?style=for-the-badge&logo=tensorflow" alt="Model Accuracy" />
</div>

## Overview

Telecommunications companies generate massive IPDR volumes daily. Manual analysis is inefficient and inaccessible to non-technical stakeholders, making it difficult to detect fraud, identify suspicious patterns, or respond quickly to security incidents.

## Solution

Our platform ingests heterogeneous IPDR logs, normalizes data, constructs communication graphs, applies ML-based anomaly detection, and delivers interactive visualizations with comprehensive reporting—all secured with end-to-end encryption.
The key  highlights include:
- **94.45% accuracy** in ML-powered anomaly detection
- **Real-time processing** of large IPDR datasets  
- **Multi-format support** (CSV, JSON, Excel)
- **Enterprise-grade security** with end-to-end encryption

<div align="center">
  <img src="https://github.com/user-attachments/assets/93a6e252-8453-425f-9e45-7dd966389d64" alt="Demo Video" width="800"/>
</div>

## Key Features

### Data Processing & Upload
- **Multi-Format Support**: Upload IPDR logs in CSV, JSON, and Excel formats
- **Smart Data Preview**: Pre-submission modal shows first 10 rows for data verification
- **Universal Log Parser**: Flexible parser that standardizes heterogeneous IPDR formats

### Intelligence & Analysis
- **Automated Relationship Mapping**: Identifies unique entities (nodes) and sessions between them (edges) to build comprehensive communication graphs
- **AI-Powered Anomaly Detection**: Pre-trained ML models flag suspicious sessions with confidence scores based on unusual patterns in time, duration, and data transfer
- **Entity Extraction**: Advanced parsing of IP addresses, phone numbers, and mobile identifiers

### Visualization & Interaction
- **Interactive Graph Visualization**: Switch between 2D force-directed layouts and immersive 3D views
- **Node & Edge Details**: Click on nodes (IPs/phone numbers) or edges (sessions) to view detailed information and anomaly status
- **Search & Isolation**: Robust search functionality with isolated views showing specific nodes and their direct connections
- **Graph Legend**: Clear visual indicators for different node types and anomaly statuses

### Investigation Workflow
- **Comprehensive Reports History**: Maintains history of all uploaded files with filename, upload time, session count, and anomaly statistics
- **Auditable Reporting**: Automatically generates detailed reports for every analysis, downloadable for documentation and evidence
- **Timeline Reconstruction**: Build chronological views of communication patterns

## 📁 Project Structure

```
ipdr-graph-engine/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Configuration and security
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── artifacts/           # ML models and configurations
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages and routing
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and configurations
│   │   └── types/           # TypeScript definitions
│   └── package.json
├── notebooks/               # Data analysis and model training
└── scripts/                # Deployment scripts
```

## 🚀 Quick Start

### Live Demo

Experience the tool immediately:

- **Frontend Application**: [https://ipdr-graph-engine.vercel.app/](https://ipdr-graph-engine.vercel.app/)
- **API Documentation**: [https://ipdr-graph-engine-api-1004676663046.us-central1.run.app/docs](https://ipdr-graph-engine-api-1004676663046.us-central1.run.app/docs)

### Local Development

```bash
# Clone the repository
git clone https://github.com/sujeetgund/ipdr-graph-engine.git
cd ipdr-graph-engine

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend setup (separate terminal)
cd frontend
npm install
npm start
```

## Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Data Parser** | Python, Pandas | Normalize heterogeneous IPDR formats |
| **Anomaly Detector** | Scikit-learn, CatBoost | ML-based suspicious activity detection |
| **Web Interface** | React | Investigator-friendly dashboard |
| **Report Generator** | FastAPI | Automated investigation reports |

## Workflow

1. **Upload** → Drag & drop IPDR logs (CSV/JSON/Excel)
2. **Preview** → Verify data structure before processing  
3. **Analyze** → AI-powered anomaly detection with confidence scoring
4. **Investigate** → Interactive dashboard with 2D/3D/Maps visualization
5. **Report** → Download comprehensive PDF reports with audit trail

## 🏆 CIIS 2025 Hackathon

This project was developed for the **CIIS (Conference on Information and Internet Security) 2025 Hackathon**, addressing the critical challenge of **"Mapping A-Party to B-Party in IPDR Logs"**. Our solution demonstrates practical application of graph theory, machine learning, and modern web technologies to solve real-world cybersecurity investigation challenges.

**Team Brigade - VIT Bhopal University**  
Sujeet Gund • Arpit Singh • Nishin N • Navneet Kumar • Mansi Kapse  
*Mentor: Dr Lakshmi D, School of Computer Science and AI*

### Hackathon Goals Achieved ✅

- ✅ Automatic A→B party extraction from heterogeneous IPDR logs
- ✅ Investigator-friendly dashboard with comprehensive visualizations
- ✅ Scalable, auditable, and privacy-compliant architecture
- ✅ Real-time anomaly detection with confidence scoring
- ✅ Complete end-to-end investigation workflow

## 🛠️ Technology Stack

**Backend**: FastAPI, Python, Scikit-learn, CatBoost, NetworkX, Pandas  
**Frontend**: React, Next.js, TypeScript, Modern UI Components, Interactive Visualizations  
**Deployment**: Google Cloud Run (Backend), Vercel (Frontend)  
**Database**: MongoDB for historical analysis and report storage  
**ML/AI**: Scikit-learn, CatBoost for anomaly detection

## Use Cases

**Cybersecurity Investigations** - Threat actor tracking, network forensics, incident response analysis  
**Law Enforcement** - Digital evidence analysis, pattern recognition, timeline reconstruction  
**Telecommunications Security** - Network abuse detection, fraud investigation, compliance monitoring

---

**Built with ❤️ for cybersecurity investigators and digital forensics professionals**
