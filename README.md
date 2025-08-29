# IPDR Graph Engine

> **Automated, auditable pipeline to detect anomalous sessions and map A→B relationships from IPDR logs.**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_App-blue?style=for-the-badge)](https://ciis-hackathon.vercel.app/)
[![API Docs](https://img.shields.io/badge/📖_API_Docs-FastAPI-green?style=for-the-badge)](https://ipdr-graph-engine.onrender.com/docs)
[![CIIS 2025](https://img.shields.io/badge/🏆_CIIS_2025-Hackathon_Project-orange?style=for-the-badge)](#)

## 🎯 Overview

IPDR Graph Engine is an intelligent investigation tool designed to **automatically extract and map A-party (initiator) to B-party (recipient) relationships** from heterogeneous IPDR (IP Detail Record) logs. Built for cybersecurity investigators and digital forensics professionals, it transforms raw telecommunication data into actionable intelligence through advanced graph analysis and anomaly detection.

### 🔍 **Core Problem Solved**
Traditional IPDR analysis is manual, time-intensive, and error-prone. Our engine automates the extraction of communication patterns, identifies suspicious activities, and presents findings through an intuitive investigator-friendly interface.

## ✨ Key Features

* **Universal Log Parser**: Upload any IPDR log variant. Our flexible parser standardizes the data for downstream processing while you preview the raw logs.
* **Automated Relationship Mapping**: Identifies unique entities (nodes) and the sessions between them (edges) to build a comprehensive communication graph.
* **AI-Powered Anomaly Detection**: A pre-trained classification model flags suspicious sessions (e.g., unusual time, duration, data transfer) with a confidence score to focus investigative efforts.
* **Investigator-First Dashboard**: A clean, intuitive React interface for uploading logs, viewing A→B pairs, exploring anomalies, and accessing historical reports.
* **Auditable Reporting**: Automatically generates and stores detailed reports for every analysis, which can be downloaded for documentation and evidence.

## 🚀 Quick Start

### Live Demo
Experience the tool immediately:
- **Frontend Application**: [https://ciis-hackathon.vercel.app/](https://ciis-hackathon.vercel.app/)
- **API Documentation**: [https://ipdr-graph-engine.onrender.com/docs](https://ipdr-graph-engine.onrender.com/docs)

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

## 🏗️ Architecture

### Frontend (React)
```
📊 IPDR Upload & Preview → 🔗 A→B Mapping Display → ⚠️ Anomaly Detection → 📋 Historical Reports
```

### Backend (FastAPI)
```
📥 Data Parser → 🗺️ Graph Mapping → 🤖 ML Analysis → 📊 Report Generation
```

### Core Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Data Parser** | Normalize heterogeneous IPDR formats | Python, Pandas |
| **Graph Engine** | Build communication networks | NetworkX, Custom algorithms |
| **Anomaly Detector** | ML-based suspicious activity detection | Scikit-learn, Custom models |
| **Report Generator** | Automated investigation reports | FastAPI, Database integration |

## 🔬 Technical Highlights

### Intelligent IPDR Processing
- **Multi-format Support**: Automatically detects and parses various IPDR schemas
- **Entity Extraction**: Advanced parsing of IP addresses and mobile identifiers
- **Session Reconstruction**: Timeline-based communication flow analysis

### Advanced Analytics
- **Graph Theory Application**: Leverages network analysis for relationship mapping
- **Machine Learning Integration**: Pre-trained models for anomaly detection
- **Confidence Metrics**: Quantified reliability scores for all findings

### Investigation Workflow
1. **Upload** → Drag & drop IPDR logs of any supported format
2. **Process** → Automated parsing and relationship extraction
3. **Analyze** → AI-powered anomaly detection with confidence scoring
4. **Investigate** → Interactive dashboard with search and filtering
5. **Report** → Download comprehensive analysis reports

## 📁 Project Structure

```
ipdr-graph-engine/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # REST API endpoints
│   │   ├── core/            # Configuration and security
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   ├── artifacts/           # ML models and features
│   └── requirements.txt
├── frontend/                # React application
├── notebooks/              # Research and development
└── docker/                 # Containerization configs
```

## 🎯 Use Cases

### Cybersecurity Investigations
- **Threat Actor Tracking**: Map communication patterns of suspicious entities
- **Network Forensics**: Analyze data exfiltration routes and methods
- **Incident Response**: Rapid analysis of communication during security events

### Law Enforcement
- **Digital Evidence Analysis**: Extract communication networks from seized devices
- **Pattern Recognition**: Identify recurring suspicious communication patterns
- **Timeline Reconstruction**: Build chronological views of investigative targets

### Telecommunications Security
- **Network Abuse Detection**: Identify unusual traffic patterns
- **Fraud Investigation**: Map potentially fraudulent communication chains
- **Compliance Monitoring**: Automated analysis for regulatory requirements

## 🏆 CIIS 2025 Hackathon

This project was developed for the **CIIS (Conference on Information and Internet Security) 2025 Hackathon**, addressing the critical challenge of **"Mapping A-Party to B-Party in IPDR Logs"**. Our solution demonstrates practical application of graph theory, machine learning, and modern web technologies to solve real-world cybersecurity investigation challenges.

### Hackathon Goals Achieved ✅
- ✅ Automatic A→B party extraction from heterogeneous IPDR logs
- ✅ Investigator-friendly dashboard with comprehensive visualizations
- ✅ Scalable, auditable, and privacy-compliant architecture
- ✅ Real-time anomaly detection with confidence scoring
- ✅ Complete end-to-end investigation workflow

## 🛠️ Technology Stack

**Backend**: FastAPI, Python, Scikit-learn, NetworkX, Pandas  
**Frontend**: React, Modern UI Components, Interactive Visualizations  
**Deployment**: Render (Backend), Vercel (Frontend)  
**Database**: Integrated storage for historical analysis  

---

**Built with ❤️ for cybersecurity investigators and digital forensics professionals**