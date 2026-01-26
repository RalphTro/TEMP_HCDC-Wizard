
(function () {
  "use strict";

  async function loadModel(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`JSON load failed: ${res.status} ${res.statusText}`);
    return res.json();
  }

  function i18nHelper(model) {
    const available = Object.keys(model.i18n?.strings ?? { en: {} });

    const urlLang = new URLSearchParams(window.location.search).get("lang");
    const storedLang = localStorage.getItem("wizardLocale");
    const defaultLocale = model.i18n?.defaultLocale ?? "en";

    let locale =
      (urlLang && available.includes(urlLang) && urlLang) ||
      (storedLang && available.includes(storedLang) && storedLang) ||
      (available.includes(defaultLocale) ? defaultLocale : "en");

    const t = (k) =>
      model.i18n?.strings?.[locale]?.[k] ??
      model.i18n?.strings?.en?.[k] ??
      k;

    return {
      t,
      get locale() { return locale; },
      get available() { return available; },
      get localeNames() { return model.i18n?.localeNames ?? {}; },
      setLocale(l) {
        if (model.i18n?.strings?.[l]) {
          locale = l;
          localStorage.setItem("wizardLocale", l);
        }
      }
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const root = document.getElementById("app");
    const titleEl = document.getElementById("title");
    const localeSel = document.getElementById("locale");

    let model;
    try {
      model = await loadModel("./diagram.json");
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="card"><div class="badge result">Error</div><h2>Failed to load diagram.json</h2><div class="small">${String(e.message || e)}</div></div>`;
      return;
    }

    const i18n = i18nHelper(model);

    // State
    const state = {
      current: model.nodes.find(n => n.type === "start")?.id ?? "start",
      history: []
    };

    function setTitle() {
      const titleText = i18n.t("title");
      titleEl.textContent = `${titleText} – ${model.version}`;
      document.title = `${titleText} – ${model.version}`;
    }

    // Locale dropdown (safe even if you later add more locales)
    (function initLocaleSelector() {
      const locales = i18n.available;
      const names = i18n.localeNames;

      localeSel.innerHTML = locales
        .map(l => `<option value="${l}">${names[l] ?? l}</option>`)
        .join("");

      localeSel.value = i18n.locale;
      localeSel.addEventListener("change", () => {
        i18n.setLocale(localeSel.value);
        setTitle();
        render();
      });
    })();

    function goto(nextId, labelKey) {
      state.history.push({ from: state.current, to: nextId, label: labelKey });
      state.current = nextId;
      render();
    }

    function back() {
      const last = state.history.pop();
      if (!last) return;
      state.current = last.from;
      render();
    }

    function restart() {
      state.current = model.nodes.find(n => n.type === "start")?.id ?? "start";
      state.history = [];
      render();
    }

    function renderHistoryLine() {
      if (!state.history.length) return "";
      const last = state.history[state.history.length - 1];
      // Optional: show last choice if you keep these UI keys
      const path = i18n.t("ui_path") || "Path length:";
      const lastChoice = i18n.t("ui_last_choice") || "Last choice:";
      return `<div class="small">${path} <span class="code">${state.history.length}</span> · ${lastChoice} <span class="code">${i18n.t(last.label)}</span></div>`;
    }

    function render() {
      const node = model.nodes.find(n => n.id === state.current);
      if (!node) {
        root.innerHTML = `<div class="card"><div class="badge result">Error</div><h2>${i18n.t("ui_node_missing") || "Node not found"}</h2><div class="small code">${state.current}</div></div>`;
        return;
      }

      // Badge label uses ui_* keys you already have in diagram.json [1](https://gs1germany-my.sharepoint.com/personal/ralph_troeger_gs1_de/Documents/Dokumente/GitHub/TEMP_HCDC-Wizard/diagram.json?web=1)
      const typeLabelKey = `ui_${node.type}`;
      const badgeText = i18n.t(typeLabelKey);

      const badgeClass =
        node.type === "decision" ? "decision" :
        node.type === "process"  ? "process"  :
        node.type === "result"   ? "result"   : "step";

      // Start rendering
      let html = `
        <div class="card">
          <div class="badge ${badgeClass}">${badgeText}</div>
          <h2>${i18n.t(node.text)}</h2>
      `;

      // START: add a Continue button
      if (node.type === "start") {
        html += `
          <div class="buttons">
            <button id="next">${i18n.t("btn_continue")}</button>
          </div>
          <hr/>
          ${renderHistoryLine()}
        </div>`;
        root.innerHTML = html;
        document.getElementById("next").addEventListener("click", () => goto(node.next, "btn_continue"));
        return;
      }

      // DECISION: outcomes[]
      if (node.type === "decision") {
        const outcomes = node.outcomes ?? [];
        html += `
          <div class="buttons">
            <button class="secondary" id="back">${i18n.t("btn_back")}</button>
            ${outcomes.map((o, i) => `<button data-i="${i}">${i18n.t(o.label)}</button>`).join("")}
          </div>
          <hr/>
          ${renderHistoryLine()}
        </div>`;
        root.innerHTML = html;

        document.getElementById("back").addEventListener("click", back);
        root.querySelectorAll("button[data-i]").forEach(btn => {
          btn.addEventListener("click", () => {
            const o = outcomes[Number(btn.dataset.i)];
            if (!o) return;
            goto(o.next, o.label);
          });
        });
        return;
      }

      // PROCESS: nextOptions[]
      if (node.type === "process") {
        const nextOptions = node.nextOptions ?? [];
        html += `
          <div class="buttons">
            <button class="secondary" id="back">${i18n.t("btn_back")}</button>
            ${nextOptions.map((o, i) => `<button data-i="${i}">${i18n.t(o.label)}</button>`).join("")}
          </div>
          <hr/>
          ${renderHistoryLine()}
        </div>`;
        root.innerHTML = html;

        document.getElementById("back").addEventListener("click", back);
        root.querySelectorAll("button[data-i]").forEach(btn => {
          btn.addEventListener("click", () => {
            const o = nextOptions[Number(btn.dataset.i)];
            if (!o) return;
            goto(o.next, o.label);
          });
        });
        return;
      }

      // RESULT: restart/back
      if (node.type === "result") {
        html += `
          <div class="buttons" style="margin-top:24px">
            <button class="secondary" id="back">${i18n.t("btn_back")}</button>
            <button id="restart">${i18n.t("btn_restart")}</button>
          </div>
          <hr/>
          ${renderHistoryLine()}
        </div>`;
        root.innerHTML = html;

        document.getElementById("back").addEventListener("click", back);
        document.getElementById("restart").addEventListener("click", restart);
        return;
      }

      // Fallback
      root.innerHTML = `<pre>${JSON.stringify(node, null, 2)}</pre>`;
    }

    setTitle();
    render();
  });
})();
