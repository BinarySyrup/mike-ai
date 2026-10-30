# AGENTS.md

## Project Overview

This project should be developed using maintainable, secure, scalable engineering practices suitable for enterprise and healthcare environments. Prioritize clear architecture, operational reliability, data protection, and pragmatic delivery over unnecessary complexity.

The engineering approach should reflect experience with distributed systems, cloud platforms, microservices, secure APIs, data pipelines, enterprise identity, Agile delivery, and regulated healthcare applications.

## General Instructions

- Follow the existing project structure.
- Prefer simple, maintainable solutions.
- Do not introduce breaking changes without approval.
- Keep security, reliability, observability, and cost in mind.
- Update documentation when architecture or behavior changes.

## Engineering Principles

1. **Prefer simple, maintainable designs**
    - Use established patterns before introducing new abstractions.
    - Avoid premature optimization and unnecessary framework complexity.
    - Document meaningful architectural and technical trade-offs.

2. **Design for scalability and reliability**
    - Favor stateless services where practical.
    - Use clear service boundaries and contract-based APIs.
    - Consider failure modes, retries, timeouts, idempotency, and observability.
    - Design cloud resources for availability, performance, and cost efficiency.

3. **Security is part of the design**
    - Treat all external input as untrusted.
    - Apply least-privilege access.
    - Never commit credentials, secrets, tokens, certificates, or protected health information.
    - Use secure authentication and authorization patterns such as OAuth, JWT, SSO, Okta, or Microsoft Entra ID where applicable.
    - Protect sensitive data in transit and at rest.
    - Consider HIPAA, HITRUST, privacy, auditability, and retention requirements for healthcare-related data.

4. **Make systems observable**
    - Add structured logging, meaningful metrics, and actionable alerts.
    - Do not log passwords, access tokens, secrets, or sensitive patient/customer data.
    - Include correlation IDs for distributed requests.
    - Monitor performance, errors, infrastructure health, and business-critical workflows.

5. **Automate repeatable work**
    - Use CI/CD for build, test, security scanning, and deployment workflows.
    - Prefer infrastructure as code using tools such as Terraform where appropriate.
    - Automate validation, formatting, testing, dependency checks, and release processes.
    - Keep deployments repeatable and reversible.

## Technology Guidance

Use the existing technology stack unless there is a documented reason to change it.

Supported technologies and patterns may include:

- **Languages:** Java, Python, JavaScript, SQL, HTML, and ColdFusion
- **Frameworks:** FastAPI, Spring Boot, and Angular
- **Cloud:** Microsoft Azure and AWS
- **Containers:** Docker and Kubernetes, including Azure Kubernetes Service
- **Messaging and storage:** Azure Event Hub, Azure Blob Storage, MySQL, Oracle, and SQL Server
- **Integration:** REST APIs, microservices, JSON, XML, EHR/FHIR/HL7, and partner APIs
- **Identity:** OAuth, JWT, Okta, enterprise SSO, and Microsoft Entra ID
- **DevOps:** Jenkins, Terraform, Git, Bitbucket, CI/CD, and automated security scanning
- **Observability:** New Relic and FusionReactor
- **Security tooling:** Qualys, SonarQube, Snyk, and Veracode

## Repository Structure

Follow the existing repository structure. If no structure exists, prefer:

```text
/
├── src/                 # Application source code
├── tests/               # Unit, integration, and end-to-end tests
├── docs/                # Architecture and operational documentation
├── scripts/             # Developer and automation scripts
├── infrastructure/      # Infrastructure-as-code definitions
├── .github/             # CI/CD workflows and repository automation
├── README.md
└── AGENTS.md

## Technology Stack

- Backend: Python and FastAPI
- Frontend: Angular
- Cloud: Azure and AWS
- Containers: Docker and Kubernetes
- Databases: MySQL, Oracle, or SQL Server
- CI/CD: Jenkins and GitHub Actions
- Infrastructure as Code: Terraform
- Identity: OAuth, JWT, Okta, or Microsoft Entra ID

## Required Validation

Before submitting a change, run:

```bash
# Replace these commands with the actual project commands
./build.sh
./test.sh
./lint.sh
