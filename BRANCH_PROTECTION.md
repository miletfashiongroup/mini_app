# Branch protection

- Protect `main`: require PRs, at least 1 review, and status checks from `CI`, `Lighthouse (informational)` optional, plus any deploy workflows you enable.
- Block force pushes and deletions.
- Require branches to be up to date before merging.
- Optional: require signed commits if your org mandates it.
- Local guard: add `scripts/check_branch_protection.sh` to a pre-push hook to block direct pushes to `main`.
