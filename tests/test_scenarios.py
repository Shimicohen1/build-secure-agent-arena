from fastapi.testclient import TestClient

from arena.server import app
from arena.scenarios import SCENARIOS, get_scenarios, run_scenario


client = TestClient(app)


def test_scenario_catalog_hides_scripted_outcomes() -> None:
    catalog = get_scenarios()
    assert len(catalog) == 3
    assert all("naive" not in item and "hardened" not in item for item in catalog)


def test_each_demo_is_simulated_and_compares_both_agents() -> None:
    for scenario in SCENARIOS:
        result = run_scenario(scenario["id"])
        assert result is not None
        assert result["simulated"] is True
        assert result["naive"]["status"] == "EXPOSED"
        assert result["hardened"]["status"] == "PREVENTED"
        assert result["naive"]["events"]
        assert result["hardened"]["events"]


def test_api_serves_arena_and_scenarios() -> None:
    assert client.get("/").status_code == 200
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_run_api_rejects_unknown_scenario() -> None:
    response = client.post("/api/run/not-a-scenario")
    assert response.status_code == 404


def test_each_round_has_one_secure_and_one_risky_choice() -> None:
    for scenario in SCENARIOS:
        choices = scenario["choices"]
        assert len(choices) == 2
        assert len({choice["id"] for choice in choices}) == 2
        assert sum(choice["secure"] for choice in choices) == 1
