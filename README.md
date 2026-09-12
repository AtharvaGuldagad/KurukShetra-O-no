# Solace: Agentic Disaster Relief & Emergency Resource Coordinator

## Overview
Solace is an intelligent system designed to manage disaster relief efforts. It processes field reports, prioritizes affected zones using AI, and optimizes resource allocation to ensure aid reaches the most critical areas while preventing duplicated efforts.

## Architecture
The system is built on a microservices architecture communicating via an event bus. It relies heavily on a robust backend and dedicated AI agents to process dynamic information in real time.

<img width="1024" height="559" alt="21bcaa67-8170-4360-a04c-26a9e526e580" src="https://github.com/user-attachments/assets/da7a57ac-907e-43ef-bdb5-be50acf5b463" />

### The AI Layer
The core logic of the system consists of two distinct AI agents:

*   **Agent A (Ingestion and Prioritization):** Triggered by incoming reports. It uses a fast language model to extract structured data, resolve entities to avoid duplicating existing zones, and compute a severity score. It outputs a standardized priority tier and confidence metric.
*   **Agent B (Allocation and Optimization):** Triggered by severe zone updates or inventory changes. It uses a hybrid approach. A deterministic solver guarantees allocations stay within physical inventory limits, while a stronger reasoning language model reviews the context to provide human readable justifications and handle complex edge cases.

### Backend Services
Built primarily with Python (FastAPI) and backed by PostgreSQL and Redis. The backend is divided into focused services:
*   **Zone Service:** Manages disaster reports and keeps a versioned history of zone states.
*   **Inventory Service:** Tracks resource stock across various depots and agencies.
*   **Allocation Service:** Wraps Agent B to process allocations and apply safety guardrails.
*   **Agency Coordination Service:** Assigns tasks to specific agencies and tracks completion status.
*   **Audit Service:** Listens to all system events and maintains an immutable log of every action and AI decision.

### Frontend
The user interface is built with React, TypeScript, and TailwindCSS. It serves as a real time mission control. Through WebSockets, it provides a live map of affected zones, priority rankings, and resource inventory updates. The frontend is kept streamlined to focus purely on coordination, alerting, and manual overrides when needed.

## Safety and Guardrails
To ensure reliability during critical events, the system includes several strict safeguards:
*   **Source Tracking:** Every fact extracted by the AI must include a source reference to prevent hallucinations.
*   **Human in the Loop:** Allocations that consume a large percentage of critical stock automatically pause for manual coordinator approval.
*   **Duplicate Detection:** The system actively cross references active agency assignments to flag overlapping efforts before dispatching new resources.
*   **Immutable Logging:** All state changes are versioned and appended to the audit log, creating a transparent history of how and why decisions were made.

## Technology Stack
*   **Backend:** FastAPI (Python), PostgreSQL, Redis
*   **AI and Optimization:** Large Language Models (Fast and Reasoning tiers), Python optimization libraries (scipy.optimize / pulp)
*   **Frontend:** React, TypeScript, TailwindCSS, Socket.IO, Mapbox/Leaflet
