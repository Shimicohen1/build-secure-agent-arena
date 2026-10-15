# Build Secure: Agent Arena

A visual conference demo for **Build Secure: Developing for Modern Security**. The same three scenarios run side by side against a naive agent and a hardened agent, making secure-development controls visible as they prevent unsafe outcomes.

## Run it

Requires Python 3.11 or newer.

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
arena
```

Open http://127.0.0.1:8000. To make the demo available to other devices on the same trusted network, run `arena --host 0.0.0.0` and open the host machine's LAN address. Use only a trusted network.

## Demo flow

1. Select one of the three scenarios and run it. Both lanes show the same request and their event timelines.
2. Compare the unsafe outcome with the control that prevents it.
3. Use **Run all** for a short stage-ready walkthrough.

The scenarios are deterministic and fully simulated. They do not call an LLM, execute commands, access files, send messages, or contact external services. The naive lane is a teaching simulation, not a deployable agent.

## Checks

```powershell
python -m pytest
python -m bandit -q -r arena
```
