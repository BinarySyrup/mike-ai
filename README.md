# MikeAI

A personal AI assistant built to represent Mike's professional background, technical experience, career history, and communication style.

MikeAI combines large language models with structured professional knowledge and vector search to provide grounded, conversational answers about Mike’s experience.

## Overview

MikeAI is designed to:

- Answer questions about Mike’s professional background
- Compare Mike’s experience with job descriptions
- Generate interview responses using real career examples
- Explain technical experience across cloud, AI, healthcare, APIs, and architecture
- Retrieve relevant accomplishments from a vector database
- Generate professional summaries, qualifications, and project documentation
- Maintain a consistent, authentic, and professional voice

MikeAI is not intended to invent experience or exaggerate qualifications. Responses should be based on indexed professional knowledge and clearly distinguish between documented experience, transferable skills, and areas where information is unavailable.

## Core Capabilities

### Professional Experience Retrieval

MikeAI can retrieve relevant information about:

- Current and prior employment
- Job titles and responsibilities
- Technical projects
- Leadership experience
- Certifications
- Healthcare-domain experience
- Cloud and platform architecture
- AI engineering accomplishments
- Data pipelines and connected devices
- Security and compliance work

### Job Qualification Comparison

Given a job description, MikeAI can:

1. Extract required and preferred qualifications
2. Search Mike’s professional knowledge base
3. Match qualifications to supporting evidence
4. Identify strong, partial, and missing matches
5. Explain the reasoning behind each match
6. Generate 1 interview talking points
7. Generate a resume to apply for job description

## Professional Knowledge Architecture

MikeAI uses a retrieval-augmented generation architecture.

```text
Professional Experience Data
          |
          v
   Knowledge Record Builder
          |
          v
       Embedding Model
          |
          v
     Vector Database
          |
          v
     Similarity Search
          |
          v
        LLM Prompt
          |
          v
    Grounded MikeAI Response
```
## API Documentation

See the [Python API guide](docs/operations/python-api.md) for setup and upload details. When the API is running, open /docs for the interactive API reference.
