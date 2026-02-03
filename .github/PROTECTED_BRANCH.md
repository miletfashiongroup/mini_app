# Branch Protection

- `main` is protected: no direct pushes, PRs only.
- Required checks: CI (backend tests, backend build, frontend build).
- At least 1 approval required; dismiss stale reviews on new commits.
- Require branches up to date before merge.
- Releases cut via tags `v*`; production deploy workflow triggers on tags.
