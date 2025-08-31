# Testing Guide

This guide explains how to test the IPDR Graph Engine project.

## Backend Testing
- Use `pytest` for running backend tests.
- Test files are located in `backend/tests/`.
- Run all tests:
  ```bash
  cd backend
  pytest
  ```
- Add new tests for any new features or bug fixes.

## Frontend Testing
- Use `jest` and `react-testing-library` for frontend tests.
- Test files are located alongside components in `frontend/src/`.
- Run all tests:
  ```bash
  cd frontend
  npm test
  ```

## Test Coverage
- Ensure new code is covered by tests.
- Check coverage reports and improve as needed.

## Reporting Issues
- If you find a bug, open an issue with steps to reproduce and expected behavior.
