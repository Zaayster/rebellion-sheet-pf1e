const MODULE_ID = "silver-ravens-rebellion";
const DATA_KEY = "rebellionData";

const DEFAULT_DATA = {
  name: "Silver Ravens",
  subtitle: "The spirit of Kintargo cannot be chained.",
  rank: 1,
  xp: 0,
  xpNext: 10,
  treasury: 0,
  loyalty: 0,
  secrecy: 0,
  security: 0,
  notoriety: 0,
  danger: 0,
  publicOpinion: 0,
  actionsRemaining: 1,
  actionsMaximum: 1,
  eventChance: 0,
  eventSeverity: 0,
  notes: "",
  teams: [],
  missions: [],
  log: []
};

function clone(value) {
  return foundry.utils.deepClone(value);
}

function normalize(raw = {}) {
  const data = foundry.utils.mergeObject(clone(DEFAULT_DATA), raw, {
    inplace: false,
    insertKeys: true,
    overwrite: true
  });
  data.teams ??= [];
  data.missions ??= [];
  data.log ??= [];
  return data;
}

function canEdit() {
  return game.user.isGM;
}

class RebellionSheet extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "silver-ravens-rebellion-sheet",
      title: game.i18n.localize("SRR.Title"),
      template: `modules/${MODULE_ID}/templates/rebellion-sheet.hbs`,
      width: 980,
      height: 760,
      resizable: true,
      classes: ["srr", "rebellion-sheet"],
      tabs: [{ navSelector: ".srr-tabs", contentSelector: ".srr-content", initial: "overview" }]
    });
  }

  async getData() {
    const rebellion = normalize(game.settings.get(MODULE_ID, DATA_KEY));
    const opinionLabels = {
      "-3": "Despised", "-2": "Distrusted", "-1": "Uncertain", "0": "Neutral",
      "1": "Sympathetic", "2": "Popular", "3": "Beloved"
    };
    return {
      rebellion,
      editable: canEdit(),
      readOnly: canEdit() ? "" : "disabled",
      opinionLabel: opinionLabels[String(rebellion.publicOpinion)] ?? "Neutral"
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='save']").on("click", () => this._save(html));
    html.find("[data-action='add-team']").on("click", () => this._addTeam(html));
    html.find("[data-action='remove-team']").on("click", event => this._removeTeam(html, event));
    html.find("[data-action='add-mission']").on("click", () => this._addMission(html));
    html.find("[data-action='remove-mission']").on("click", event => this._removeMission(html, event));
    html.find("[data-action='roll-event']").on("click", () => this._rollEvent(html));
    html.find("[data-action='clear-log']").on("click", () => this._clearLog());
  }

  _readForm(html) {
    const form = html.find("form")[0];
    const fd = new FormData(form);
    const current = normalize(game.settings.get(MODULE_ID, DATA_KEY));
    const value = key => fd.get(key);
    const number = key => Number(value(key) ?? 0);
    const data = {
      ...current,
      name: value("name") || "Silver Ravens",
      subtitle: value("subtitle") || "",
      rank: number("rank"), xp: number("xp"), xpNext: number("xpNext"),
      treasury: number("treasury"), loyalty: number("loyalty"), secrecy: number("secrecy"),
      security: number("security"), notoriety: number("notoriety"), danger: number("danger"),
      publicOpinion: Math.max(-3, Math.min(3, number("publicOpinion"))),
      actionsRemaining: number("actionsRemaining"), actionsMaximum: number("actionsMaximum"),
      eventChance: number("eventChance"), eventSeverity: number("eventSeverity"),
      notes: value("notes") || ""
    };
    data.teams = current.teams.map((team, i) => ({
      ...team,
      name: value(`team.${i}.name`) || "Unnamed Team",
      type: value(`team.${i}.type`) || "",
      status: value(`team.${i}.status`) || "Ready",
      bonus: number(`team.${i}.bonus`),
      notes: value(`team.${i}.notes`) || ""
    }));
    data.missions = current.missions.map((mission, i) => ({
      ...mission,
      title: value(`mission.${i}.title`) || "New Mission",
      advisor: value(`mission.${i}.advisor`) || "",
      stat: value(`mission.${i}.stat`) || "Loyalty",
      team: value(`mission.${i}.team`) || "",
      pcs: value(`mission.${i}.pcs`) || "",
      status: value(`mission.${i}.status`) || "Available",
      details: value(`mission.${i}.details`) || ""
    }));
    return data;
  }

  async _save(html, message = "Rebellion sheet updated") {
    if (!canEdit()) return ui.notifications.warn("Only the GM can edit the rebellion sheet.");
    const data = this._readForm(html);
    data.log.unshift({ time: new Date().toISOString(), text: message });
    data.log = data.log.slice(0, 50);
    await game.settings.set(MODULE_ID, DATA_KEY, data);
    ui.notifications.info(message);
    this.render(false);
  }

  async _addTeam(html) {
    if (!canEdit()) return;
    const data = this._readForm(html);
    data.teams.push({ id: foundry.utils.randomID(), name: "New Team", type: "Advisors", status: "Ready", bonus: 0, notes: "" });
    await game.settings.set(MODULE_ID, DATA_KEY, data);
    this.render(false);
  }

  async _removeTeam(html, event) {
    if (!canEdit()) return;
    const data = this._readForm(html);
    data.teams.splice(Number(event.currentTarget.dataset.index), 1);
    await game.settings.set(MODULE_ID, DATA_KEY, data);
    this.render(false);
  }

  async _addMission(html) {
    if (!canEdit()) return;
    const data = this._readForm(html);
    data.missions.push({ id: foundry.utils.randomID(), title: "New Mission", advisor: "", stat: "Loyalty", team: "", pcs: "", status: "Available", details: "" });
    await game.settings.set(MODULE_ID, DATA_KEY, data);
    this.render(false);
  }

  async _removeMission(html, event) {
    if (!canEdit()) return;
    const data = this._readForm(html);
    data.missions.splice(Number(event.currentTarget.dataset.index), 1);
    await game.settings.set(MODULE_ID, DATA_KEY, data);
    this.render(false);
  }

  async _rollEvent(html) {
    if (!canEdit()) return;
    const data = this._readForm(html);
    const roll = await new Roll("1d100").evaluate();
    const severity = await new Roll("1d100").evaluate();
    data.eventChance = roll.total;
    data.eventSeverity = severity.total;
    data.log.unshift({ time: new Date().toISOString(), text: `Event roll ${roll.total}, severity ${severity.total}` });
    await game.settings.set(MODULE_ID, DATA_KEY, data);
    await roll.toMessage({ flavor: `Rebellion Event Chance | Severity: ${severity.total}` });
    this.render(false);
  }

  async _clearLog() {
    if (!canEdit()) return;
    const data = normalize(game.settings.get(MODULE_ID, DATA_KEY));
    data.log = [];
    await game.settings.set(MODULE_ID, DATA_KEY, data);
    this.render(false);
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, DATA_KEY, {
    name: "Rebellion Data",
    scope: "world",
    config: false,
    type: Object,
    default: clone(DEFAULT_DATA)
  });
  game.modules.get(MODULE_ID).api = {
    open: () => openRebellionSheet(),
    getData: () => normalize(game.settings.get(MODULE_ID, DATA_KEY))
  };
});

Hooks.once("ready", () => {
  globalThis.SilverRavensRebellion = game.modules.get(MODULE_ID).api;
});

Hooks.on("renderSettings", (_app, html) => {
  if (html.find(".srr-open-sheet").length) return;
  const button = $(`<button type="button" class="srr-open-sheet"><i class="fas fa-feather"></i> ${game.i18n.localize("SRR.Open")}</button>`);
  button.on("click", () => openRebellionSheet());
  const target = html.find("#settings-game");
  (target.length ? target : html).append(button);
});

Hooks.on("updateSetting", setting => {
  if (setting.key !== `${MODULE_ID}.${DATA_KEY}`) return;
  for (const app of Object.values(ui.windows)) {
    if (app instanceof RebellionSheet) app.render(false);
  }
});

function openRebellionSheet() {
  const existing = Object.values(ui.windows).find(app => app instanceof RebellionSheet);
  if (existing) return existing.bringToTop();
  return new RebellionSheet().render(true);
}
