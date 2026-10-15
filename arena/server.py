from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from arena.scenarios import get_scenarios, run_scenario


APP_DIR = Path(__file__).parent
app = FastAPI(title="Build Secure: Agent Arena", docs_url=None, redoc_url=None)
app.mount("/assets", StaticFiles(directory=APP_DIR / "static"), name="assets")


@app.get("/", include_in_schema=False)
def index() -> FileResponse:
    return FileResponse(APP_DIR / "static" / "index.html")


@app.get("/api/scenarios")
def scenarios() -> list[dict]:
    return get_scenarios()


@app.post("/api/run/{scenario_id}")
def run_demo(scenario_id: str) -> dict:
    result = run_scenario(scenario_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Unknown demo scenario")
    return result
