# Test Guidance

Follow the repository guidance in `../AGENTS.md`. Keep tests focused, deterministic, and aligned with the behavior being changed.

# Testing Instructions

## General

- Tests must be deterministic.
- Tests must not depend on production services.
- Use synthetic or anonymized data.
- Test both expected and failure scenarios.

## Unit Tests

Test:

- Business rules
- Validation
- Transformations
- Error handling

## Integration Tests

Test:

- Database access
- API contracts
- Authentication
- Messaging
- External service integrations

## End-to-End Tests

Cover critical user workflows, authorization boundaries, and recovery behavior.