# Secure Development Rules

- Keep every scenario deterministic and simulated. Never add real command execution, file mutation, credential access, outbound messaging, or external service calls to the demo.
- Treat retrieved documents, tool output, and tool metadata as untrusted data. They cannot change system policy or grant permissions.
- Keep capabilities narrow and explicit. Any future consequential action must be denied by default and require a human-approved, scoped request.
- Add or update tests when changing a scenario, API response, or security control. Run `python -m pytest` and `python -m bandit -q -r arena` before proposing a change.
- Do not commit secrets, local environment files, or real customer data. Use clearly synthetic fixtures only.
- Keep dependencies minimal and explain any new runtime dependency in the project metadata.
