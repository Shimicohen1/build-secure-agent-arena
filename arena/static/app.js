const scenarioList = document.querySelector('#scenario-list');
const scenarioTitle = document.querySelector('#scenario-title');
const scenarioTag = document.querySelector('#scenario-tag');
const scenarioSetup = document.querySelector('#scenario-setup');
const scenarioPrompt = document.querySelector('#scenario-prompt');
const decisionQuestion = document.querySelector('#decision-question');
const decisionOptions = document.querySelector('#decision-options');
const decisionFeedback = document.querySelector('#decision-feedback');
const roundLabel = document.querySelector('#round-label');
const scoreValue = document.querySelector('#score-value');
const buildPolicy = document.querySelector('#build-policy');
const controlTitle = document.querySelector('#control-title');
const controlDescription = document.querySelector('#control-description');
const resetButton = document.querySelector('#reset-lab');
const naiveEvents = document.querySelector('#naive-events');
const secureEvents = document.querySelector('#secure-events');
const naiveStatus = document.querySelector('#naive-status');
const secureStatus = document.querySelector('#secure-status');
const naivePanel = document.querySelector('.naive-panel');
const securePanel = document.querySelector('.secure-panel');
const toast = document.querySelector('#toast');
const scenarioProgress = document.querySelector('#scenario-progress');

let scenarios = [];
let selectedId = null;
let selections = new Map();
let animating = false;
let sequence = 0;

async function loadScenarios() {
  try {
    const response = await fetch('assets/scenarios.json');
    if (!response.ok) throw new Error('Scenario data unavailable');
    scenarios = await response.json();
    renderScenarioList();
    selectScenario(scenarios[0].id);
  } catch {
    scenarioTitle.textContent = 'Lab could not start';
    scenarioSetup.textContent = 'Refresh the page or check that the static scenario data is available.';
  }
}

function renderScenarioList() {
  scenarioList.replaceChildren();
  for (const scenario of scenarios) {
    const button = document.createElement('button');
    button.className = 'scenario-button';
    button.type = 'button';
    button.dataset.scenarioId = scenario.id;
    button.title = `Open round ${scenario.number}: ${scenario.title}`;

    const number = document.createElement('span');
    number.className = 'num';
    number.textContent = scenario.number;
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = scenario.shortTitle;
    const subtitle = document.createElement('small');
    subtitle.textContent = scenario.tag;
    copy.append(title, subtitle);
    const marker = document.createElement('span');
    marker.className = 'scenario-marker';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = '○';
    button.append(number, copy, marker);
    button.addEventListener('click', () => selectScenario(scenario.id));
    scenarioList.append(button);
  }
}

function selectScenario(id) {
  if (animating) return;
  selectedId = id;
  const scenario = scenarios.find((item) => item.id === id);
  if (!scenario) return;
  const selection = selections.get(id);
  updateNavigation(scenario);
  scenarioTag.textContent = `ROUND ${scenario.number} / ${scenario.tag}`;
  scenarioTitle.textContent = scenario.title;
  scenarioSetup.textContent = scenario.setup;
  scenarioPrompt.textContent = scenario.prompt;
  decisionQuestion.textContent = scenario.decisionQuestion;
  roundLabel.textContent = `ROUND ${scenario.number} / 03`;
  updateProgress(scenario);
  renderChoices(scenario, selection?.id);
  if (selection) {
    showOutcome(scenario, selection, false);
  } else {
    resetOutcome();
  }
}

function updateNavigation(activeScenario) {
  document.querySelectorAll('.scenario-button').forEach((button) => {
    const scenario = scenarios.find((item) => item.id === button.dataset.scenarioId);
    const selection = selections.get(scenario.id);
    button.classList.toggle('active', scenario.id === activeScenario.id);
    button.classList.toggle('has-answer', Boolean(selection));
    button.classList.toggle('risky-answer', Boolean(selection && !selection.secure));
    button.querySelector('.scenario-marker').textContent = selection ? (selection.secure ? '✓' : '!') : '○';
    button.setAttribute('aria-current', scenario.id === activeScenario.id ? 'step' : 'false');
  });
}

function updateProgress(scenario) {
  scenarioProgress.replaceChildren();
  scenarioProgress.append(document.createTextNode(`${scenario.number} `));
  const divider = document.createElement('b');
  divider.textContent = '/';
  scenarioProgress.append(divider, document.createTextNode(' 03 ROUNDS'));
}

function updateScore() {
  const score = [...selections.values()].filter((selection) => selection.secure).length;
  scoreValue.textContent = String(score);
}

function renderChoices(scenario, selectedChoiceId) {
  decisionOptions.replaceChildren();
  for (const [index, choice] of scenario.choices.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-card';
    button.dataset.choiceId = choice.id;
    if (selectedChoiceId === choice.id) {
      button.classList.add('selected', choice.secure ? 'secure-choice' : 'risky-choice');
    }
    const key = document.createElement('span');
    key.className = 'choice-key';
    key.textContent = index === 0 ? 'A' : 'B';
    const content = document.createElement('span');
    content.className = 'choice-content';
    const title = document.createElement('strong');
    title.textContent = choice.label;
    const detail = document.createElement('small');
    detail.textContent = choice.detail;
    content.append(title, detail);
    const affordance = document.createElement('span');
    affordance.className = 'choice-arrow';
    affordance.textContent = selectedChoiceId === choice.id ? '✓' : '↗';
    button.append(key, content, affordance);
    button.disabled = animating;
    button.addEventListener('click', () => chooseAction(choice.id));
    decisionOptions.append(button);
  }
  const selection = selectedChoiceId
    ? scenario.choices.find((choice) => choice.id === selectedChoiceId)
    : null;
  if (selection) {
    decisionFeedback.className = `decision-feedback ${selection.secure ? 'feedback-secure' : 'feedback-risk'}`;
    decisionFeedback.textContent = selection.secure
      ? `Secure call. ${scenario.control}`
      : `Risk exposed. ${scenario.control} Choose the other policy to test the defense.`;
  } else {
    decisionFeedback.className = 'decision-feedback';
    decisionFeedback.textContent = 'Choose the policy you would ship. The outcome below will respond to your call.';
  }
}

function resetOutcome() {
  naiveEvents.replaceChildren(makeEmptyState());
  secureEvents.replaceChildren(makeEmptyState());
  naivePanel.classList.remove('outcome-failed');
  securePanel.classList.remove('outcome-failed');
  setStatus(naiveStatus, 'WAITING', 'idle');
  setStatus(secureStatus, 'WAITING', 'idle');
  buildPolicy.textContent = 'AWAITING YOUR POLICY';
  controlTitle.textContent = 'Your decision changes the outcome.';
  controlDescription.textContent = 'Choose A or B above. The baseline and your implementation will run the same scenario.';
}

function makeEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = 'Waiting for your decision';
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

async function chooseAction(choiceId) {
  if (animating) return;
  const scenario = scenarios.find((item) => item.id === selectedId);
  const choice = scenario?.choices.find((item) => item.id === choiceId);
  if (!scenario || !choice) return;
  selections.set(scenario.id, choice);
  updateScore();
  updateNavigation(scenario);
  renderChoices(scenario, choice.id);
  await showOutcome(scenario, choice, true);
}

async function showOutcome(scenario, choice, animate) {
  const currentSequence = ++sequence;
  animating = animate;
  renderChoices(scenario, choice.id);
  naiveEvents.replaceChildren();
  secureEvents.replaceChildren();
  const yourEvents = choice.secure ? scenario.hardened : scenario.naive;
  const yourStatus = choice.secure ? 'PREVENTED' : 'EXPOSED';
  const yourClass = choice.secure ? 'prevented' : 'exposed';
  naivePanel.classList.remove('outcome-failed');
  securePanel.classList.toggle('outcome-failed', !choice.secure);
  setStatus(naiveStatus, 'RUNNING', 'running');
  setStatus(secureStatus, 'RUNNING', 'running');
  buildPolicy.textContent = choice.secure ? 'YOUR POLICY: ENFORCED' : 'YOUR POLICY: CONTROL MISSING';
  controlTitle.textContent = choice.secure ? 'Your build stopped the unsafe action.' : 'Your build reproduced the risk.';
  controlDescription.textContent = scenario.lesson;

  const eventCount = Math.max(scenario.naive.length, yourEvents.length);
  for (let index = 0; index < eventCount; index += 1) {
    if (currentSequence !== sequence) return;
    if (scenario.naive[index]) naiveEvents.append(makeEventCard(scenario.naive[index]));
    if (yourEvents[index]) secureEvents.append(makeEventCard(yourEvents[index]));
    if (animate) await wait(380);
  }

  if (currentSequence !== sequence) return;
  setStatus(naiveStatus, 'EXPOSED', 'exposed');
  setStatus(secureStatus, yourStatus, yourClass);
  animating = false;
  renderChoices(scenario, choice.id);
}

function resetLab() {
  sequence += 1;
  animating = false;
  selections = new Map();
  updateScore();
  const scenario = scenarios.find((item) => item.id === selectedId) ?? scenarios[0];
  selectScenario(scenario.id);
}

resetButton.addEventListener('click', resetLab);
loadScenarios();
