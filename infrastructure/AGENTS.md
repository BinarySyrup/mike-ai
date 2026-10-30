# Infrastructure Guidance

Follow the repository guidance in `../AGENTS.md`. Use least privilege, protect sensitive values, and keep infrastructure changes repeatable and reviewable.

# Infrastructure Instructions

- Use infrastructure as code.
- Review changes for security, availability, scalability, and cost.
- Do not hard-code credentials or environment-specific secrets.
- Use separate configuration for development, test, staging, and production.
- Document provisioning, deployment, rollback, and disaster recovery.
- Do not destroy shared infrastructure without explicit approval.
- Validate Terraform or equivalent plans before applying changes.