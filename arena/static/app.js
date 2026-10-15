const scenarioList = document.querySelector('#scenario-list');
const scenarioTitle = document.querySelector('#scenario-title');
const scenarioTag = document.querySelector('#scenario-tag');
const scenarioSetup = document.querySelector('#scenario-setup');
const scenarioPrompt = document.querySelector('#scenario-prompt');
const controlTitle = document.querySelector('#control-title');
const controlDescription = document.querySelector('#control-description');
const runButton = document.querySelector('#run-current');
const runAllButton = document.querySelector('#run-all');
const naiveEvents = document.querySelector('#naive-events');
const secureEvents = document.querySelector('#secure-events');
const naiveStatus = document.querySelector('#naive-status');
const secureStatus = document.querySelector('#secure-status');
const toast = document.querySelector('#toast');
const scenarioProgress = document.querySelector('#scenario-progress');

let scenarios = [];
let selectedId = null;
let running = false;
let sequence = 0;

async function loadScenarios() {
  try {
    const response = await fetch('/api/scenarios');
    if (!response.ok) throw new Error('Scenario service unavailable');
    scenarios = await response.json();
    renderScenarioList();
    selectScenario(scenarios[0].id);
  } catch {
    scenarioTitle.textContent = 'Demo could not start';
    scenarioSetup.textContent = 'Refresh the page or restart the local arena server.';
  }
}

function renderScenarioList() {
  scenarioList.replaceChildren();
  for (const [index, scenario] of scenarios.entries()) {
    const button = document.createElement('button');
    button.className = 'scenario-button';
    button.type = 'button';
    button.dataset.scenarioId = scenario.id;
    const number = document.createElement('span');
    number.className = 'num';
    number.textContent = scenario.number;
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = ['Untrusted content', 'Tool integrity', 'Excessive agency'][index];
    const subtitle = document.createElement('small');
    subtitle.textContent = scenario.tag;
    copy.append(title, subtitle);
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '›';
    button.append(number, copy, arrow);
    button.addEventListener('click', () => selectScenario(scenario.id));
    scenarioList.append(button);
  }
}

function selectScenario(id) {
  if (running) return;
  selectedId = id;
  const scenario = scenarios.find((item) => item.id === id);
  if (!scenario) return;
  updateProgress(scenario);
  document.querySelectorAll('.scenario-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.scenarioId === id);
  });
  scenarioTag.textContent = `SCENARIO ${scenario.number} / ${scenario.tag}`;
  scenarioTitle.textContent = scenario.title;
  scenarioSetup.textContent = scenario.setup;
  scenarioPrompt.textContent = scenario.prompt;
  controlTitle.textContent = 'Secure controls make the difference visible.';
  controlDescription.textContent = scenario.control;
  resetLanes();
}

function updateProgress(scenario) {
  scenarioProgress.replaceChildren();
  scenarioProgress.append(document.createTextNode(scenario.number + ' '));
  const divider = document.createElement('b');
  divider.textContent = '/';
  scenarioProgress.append(divider, document.createTextNode(' 03 SCENARIOS'));
}

function resetLanes() {
  naiveEvents.replaceChildren(makeEmptyState());
  secureEvents.replaceChildren(makeEmptyState());
  setStatus(naiveStatus, 'STANDBY', 'idle');
  setStatus(secureStatus, 'STANDBY', 'idle');
}

function makeEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = 'Waiting for the scenario';
  return empty;
}

function setStatus(element, text, state) {
  element.textContent = text;
  element.className = `status-pill ${state}`;
}

function makeEventCard(event) {
  const card = document.createElement('article');
  card.className = `event-card kind-${event.kind}`;
  const top = document.createElement('div');
  top.className = 'event-top';
  const title = document.createElement('strong');
  title.textContent = event.title;
  const kind = document.createElement('span');
  kind.className = 'event-kind';
  kind.textContent = event.kind.replace('-', ' ');
  top.append(title, kind);
  const detail = document.createElement('p');
  detail.textContent = event.detail;
  card.append(top, detail);
  if (event.trust) {
    const tag = document.createElement('span');
    tag.className = 'trust-tag';
    tag.textContent = event.trust;
    card.append(tag);
  }
  return card;
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function playScenario(id, runSequence) {
  const response = await fetch(`/api/run/${encodeURIComponent(id)}`, { method: 'POST' });
  if (!response.ok) throw new Error('Could not run the selected scenario');
  const result = await response.json();
  if (runSequence !== sequence) return;
  naiveEvents.replaceChildren();
  secureEvents.replaceChildren();
  setStatus(naiveStatus, 'RUNNING', 'running');
  setStatus(secureStatus, 'RUNNING', 'running');
  const eventCount = Math.max(result.naive.events.length, result.hardened.events.length);
  for (let index = 0; index < eventCount; index += 1) {
    if (runSequence !== sequence) return;
    const naiveEvent = result.naive.events[index];
    const secureEvent = result.hardened.events[index];
    if (naiveEvent) naiveEvents.append(makeEventCard(naiveEvent));
    if (secureEvent) secureEvents.append(makeEventCard(secureEvent));
    await wait(560);
  }
  if (runSequence !== sequence) return;
  setStatus(naiveStatus, result.naive.status, 'exposed');
  setStatus(secureStatus, result.hardened.status, 'prevented');
  const scenario = scenarios.find((item) => item.id === id);
  controlTitle.textContent = 'Build the control into the product, not the prompt.';
  controlDescription.textContent = scenario.lesson;
}

async function run(ids) {
  if (running) return;
  running = true;
  const runSequence = ++sequence;
  runButton.disabled = true;
  runAllButton.disabled = true;
  runButton.innerHTML = '<span class="play-icon">●</span> Running';
  try {
    for (const id of ids) {
      if (runSequence !== sequence) return;
      if (selectedId !== id) selectScenarioForPlayback(id);
      await playScenario(id, runSequence);
      if (ids.length > 1) await wait(950);
    }
  } catch (error) {
    toast.textContent = error.message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2600);
  } finally {
    running = false;
    runButton.disabled = false;
    runAllButton.disabled = false;
    runButton.innerHTML = '<span class="play-icon">▶</span> Run scenario';
  }
}

function selectScenarioForPlayback(id) {
  const scenario = scenarios.find((item) => item.id === id);
  if (!scenario) return;
  selectedId = id;
  updateProgress(scenario);
  document.querySelectorAll('.scenario-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.scenarioId === id);
  });
  scenarioTag.textContent = `SCENARIO ${scenario.number} / ${scenario.tag}`;
  scenarioTitle.textContent = scenario.title;
  scenarioSetup.textContent = scenario.setup;
  scenarioPrompt.textContent = scenario.prompt;
  controlTitle.textContent = 'Secure controls make the difference visible.';
  controlDescription.textContent = scenario.control;
}

runButton.addEventListener('click', () => run([selectedId]));
runAllButton.addEventListener('click', () => run(scenarios.map((scenario) => scenario.id)));
loadScenarios();
