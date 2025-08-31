# Performance Benchmarks

This document summarizes the performance benchmarks for the IPDR Graph Engine models and system.

## Model Benchmarks
- **CatBoost Anomaly Detection**
  - Accuracy: 89.25%
  - Precision: 87.3%
  - Recall: 91.1%
  - F1-Score: 89.2%
  - Inference Time: < 100ms per record

## System Benchmarks
- **API Response Time:** < 500ms average
- **File Processing:** < 2 seconds for 10K records
- **Graph Rendering:** < 1 second for 1K nodes
- **Concurrent Users:** 100+ supported

## Notes
- Benchmarks are based on synthetic and real-world IPDR datasets.
- Results may vary depending on hardware and deployment environment.
## Source of Benchmarks
- Benchmark results are based on experiments and model runs in the notebooks found in the `Anomoly/` directory.
