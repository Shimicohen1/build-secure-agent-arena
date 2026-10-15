import json
from pathlib import Path
from typing import Any


SCENARIO_FILE = Path(__file__).parent / "static" / "scenarios.json"
SCENARIOS: list[dict[str, Any]] = json.loads(SCENARIO_FILE.read_text(encoding="utf-8"))


def get_scenarios() -> list[dict[str, Any]]:
    return [
        {key: value for key, value in scenario.items() if key not in {"naive", "hardened"}}
        for scenario in SCENARIOS
    ]


def run_scenario(scenario_id: str) -> dict[str, Any] | None:
    scenario = next((item for item in SCENARIOS if item["id"] == scenario_id), None)
    if scenario is None:
        return None
    return {
        "scenario_id": scenario_id,
        "naive": {"status": "EXPOSED", "events": scenario["naive"]},
        "hardened": {"status": "PREVENTED", "events": scenario["hardened"]},
        "simulated": True,
    }
