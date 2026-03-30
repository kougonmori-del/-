const STORAGE_KEY = "kakeibo_health_web_v1";

const appState = {
  tab: "home",
  financeMonth: startOfMonth(new Date()),
  selectedFinanceDate: formatDateLocal(new Date()),
  modalType: null,
  data: loadState(),
};

document.addEventListener("DOMContentLoaded", () => {
  bindGlobalEvents();
  renderApp();
  registerServiceWorker();
});

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      financeEntries: [],
      fixedCosts: [],
      healthEntries: [],
    };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      financeEntries: Array.isArray(parsed.financeEntries) ? parsed.financeEntries : [],
      fixedCosts: Array.isArray(parsed.fixedCosts) ? parsed.fixedCosts : [],
      healthEntries: Array.isArray(parsed.healthEntries) ? parsed.healthEntries : [],
    };
  } catch {
    return { financeEntries: [], fixedCosts: [], healthEntries: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.data));
}

function bindGlobalEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      appState.tab = button.dataset.tab;
      renderApp();
    });
  });

  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (event) => {
    if (event.target.id === "modal-overlay") closeModal();
  });

  document.getElementById("backup-export-btn").addEventListener("click", exportBackup);
  document.getElementById("backup-import-input").addEventListener("change", importBackup);
}

function renderApp() {
  renderTabButtons();
  renderSections();
}

function renderTabButtons() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === appState.tab);
  });
  document.querySelectorAll(".tab-section").forEach((section) => {
    section.classList.toggle("active", section.id === `tab-${appState.tab}`);
  });
}

function renderSections() {
  renderHome();
  renderFinance();
  renderHealth();
  renderAnalytics();
  renderSettings();
}

function renderHome() {
  const monthData = getMonthlyFinance(appState.financeMonth);
  const totalAmount = getMonthlyTotalAmount(monthData);
  const remainingAmount = getRemainingAmount(monthData);
  const today = formatDateLocal(new Date());
  const todayHealth = getHealthEntryByDate(today);
  const home = document.getElementById("tab-home");

  home.innerHTML = `
    <div class="card">
      <h2>今月のまとめ</h2>
      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-label">合計金額</div>
          <div class="metric-value black">${formatCurrency(totalAmount)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">残り金額</div>
          <div class="metric-value ${remainingAmount < 0 ? "red" : "black"}">${formatCurrency(remainingAmount)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">収入</div>
          <div class="metric-value black">${formatCurrency(monthData.income)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">支出</div>
          <div class="metric-value red">${formatCurrency(monthData.expense)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">固定費</div>
          <div class="metric-value">${formatCurrency(monthData.fixedCost)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">表示月</div>
          <div class="metric-value">${formatMonthYear(appState.financeMonth)}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row between">
        <h2>今日の健康</h2>
        <span class="pill">${today}</span>
      </div>
      <div class="metric-grid">
        ${metricBox("体重", todayHealth?.weight ? `${todayHealth.weight} kg` : "-")}
        ${metricBox("体脂肪率", todayHealth?.bodyFatPercentage ? `${todayHealth.bodyFatPercentage} %` : "-")}
        ${metricBox("摂取カロリー", todayHealth?.intakeCalories ? `${todayHealth.intakeCalories} kcal` : "-")}
        ${metricBox("歩数", todayHealth?.steps ? `${todayHealth.steps}` : "-")}
        ${metricBox("運動消費", todayHealth?.activeCalories ? `${todayHealth.activeCalories} kcal` : "-")}
      </div>
    </div>

    <div class="card">
      <h2>クイック操作</h2>
      <div class="form-actions">
        <button id="home-add-finance" class="action-button">今日の家計簿を追加</button>
        <button id="home-add-health" class="secondary-button">今日の健康を入力</button>
      </div>
      <div class="hr"></div>
      <p class="subtle">このアプリのデータは、このブラウザの端末内に保存されます。別の端末とは自動同期しません。</p>
    </div>
  `;

  document.getElementById("home-add-finance").onclick = () => openFinanceModal(today);
  document.getElementById("home-add-health").onclick = () => openHealthModal(today);
}

function renderFinance() {
  const finance = document.getElementById("tab-finance");
  const monthData = getMonthlyFinance(appState.financeMonth);
  const totalAmount = getMonthlyTotalAmount(monthData);
  const remainingAmount = getRemainingAmount(monthData);
  const selectedDate = appState.selectedFinanceDate;
  const selectedEntries = getFinanceEntriesByDate(selectedDate);
  const dates = getCalendarGridDates(appState.financeMonth);

  finance.innerHTML = `
    <div class="card">
      <h2>今月の家計簿</h2>
      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-label">合計金額</div>
          <div class="metric-value black">${formatCurrency(totalAmount)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">残り金額</div>
          <div class="metric-value ${remainingAmount < 0 ? "red" : "black"}">${formatCurrency(remainingAmount)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">収入</div>
          <div class="metric-value black">${formatCurrency(monthData.income)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">支出</div>
          <div class="metric-value red">${formatCurrency(monthData.expense)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">固定費</div>
          <div class="metric-value">${formatCurrency(monthData.fixedCost)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">選択日</div>
          <div class="metric-value">${selectedDate}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row between">
        <button id="finance-prev" class="secondary-button small">前の月</button>
        <h2>${formatMonthYear(appState.financeMonth)}</h2>
        <button id="finance-next" class="secondary-button small">次の月</button>
      </div>
      <div class="calendar-wrapper">
        <div class="calendar-weekdays">
          <div>日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div>土</div>
        </div>
        <div class="calendar-grid">
          ${dates.map((date) => {
            const dateStr = formatDateLocal(date);
            const expense = getDailyExpense(dateStr);
            const isCurrentMonth = date.getMonth() === appState.financeMonth.getMonth() && date.getFullYear() === appState.financeMonth.getFullYear();
            const isToday = dateStr === formatDateLocal(new Date());
            const isSelected = dateStr === selectedDate;
            return `
              <button class="calendar-cell ${isCurrentMonth ? "" : "outside"} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" data-date="${dateStr}">
                <div class="day">${date.getDate()}</div>
                <div class="amount">${expense ? formatCurrency(expense) : ""}</div>
              </button>
            `;
          }).join("")}
        </div>
      </div>
      <div class="hr"></div>
      <button id="finance-add-selected" class="action-button full-width">選択日に追加</button>
    </div>

    <div class="card">
      <div class="row between">
        <div>
          <h2>${selectedDate} の明細</h2>
          <div class="subtle">1日に複数件入力できます</div>
        </div>
      </div>
      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-label">収入合計</div>
          <div class="metric-value black">${formatCurrency(sumAmounts(selectedEntries.filter((item) => item.type === "income")))}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">支出合計</div>
          <div class="metric-value red">${formatCurrency(sumAmounts(selectedEntries.filter((item) => item.type === "expense")))}</div>
        </div>
      </div>
      <div class="hr"></div>
      <div class="entry-list">
        ${selectedEntries.length ? selectedEntries.map(renderFinanceEntryItem).join("") : `<div class="empty">まだ入力がありません</div>`}
      </div>
    </div>
  `;

  document.getElementById("finance-prev").onclick = () => {
    appState.financeMonth = addMonths(appState.financeMonth, -1);
    renderApp();
  };
  document.getElementById("finance-next").onclick = () => {
    appState.financeMonth = addMonths(appState.financeMonth, 1);
    renderApp();
  };
  document.getElementById("finance-add-selected").onclick = () => openFinanceModal(selectedDate);

  finance.querySelectorAll(".calendar-cell").forEach((button) => {
    button.onclick = () => {
      appState.selectedFinanceDate = button.dataset.date;
      renderFinance();
    };
  });

  finance.querySelectorAll("[data-action='edit-finance']").forEach((button) => {
    button.onclick = () => {
      const item = appState.data.financeEntries.find((entry) => entry.id === button.dataset.id);
      openFinanceModal(item?.date, item);
    };
  });

  finance.querySelectorAll("[data-action='delete-finance']").forEach((button) => {
    button.onclick = () => {
      if (!confirm("この家計簿データを削除しますか？")) return;
      appState.data.financeEntries = appState.data.financeEntries.filter((entry) => entry.id !== button.dataset.id);
      saveState();
      renderApp();
    };
  });
}

function renderHealth() {
  const health = document.getElementById("tab-health");
  const today = formatDateLocal(new Date());
  const todayHealth = getHealthEntryByDate(today);
  const entries = [...appState.data.healthEntries].sort((a, b) => b.date.localeCompare(a.date));

  health.innerHTML = `
    <div class="card">
      <div class="row between">
        <h2>今日の健康</h2>
        <button id="health-add-today" class="action-button small">今日を入力</button>
      </div>
      <div class="metric-grid">
        ${metricBox("体重", todayHealth?.weight ? `${todayHealth.weight} kg` : "-")}
        ${metricBox("体脂肪率", todayHealth?.bodyFatPercentage ? `${todayHealth.bodyFatPercentage} %` : "-")}
        ${metricBox("摂取カロリー", todayHealth?.intakeCalories ? `${todayHealth.intakeCalories} kcal` : "-")}
        ${metricBox("歩数", todayHealth?.steps ? `${todayHealth.steps}` : "-")}
        ${metricBox("運動消費", todayHealth?.activeCalories ? `${todayHealth.activeCalories} kcal` : "-")}
      </div>
      <div class="hr"></div>
      <p class="subtle">Web版では歩数と運動消費カロリーは手入力です。将来、iPhoneネイティブ版に移行すれば自動取得を追加しやすくなります。</p>
    </div>

    <div class="card">
      <h2>健康履歴</h2>
      <div class="entry-list">
        ${entries.length ? entries.map(renderHealthEntryItem).join("") : `<div class="empty">まだ健康データがありません</div>`}
      </div>
    </div>
  `;

  document.getElementById("health-add-today").onclick = () => openHealthModal(today);

  health.querySelectorAll("[data-action='edit-health']").forEach((button) => {
    button.onclick = () => {
      const item = appState.data.healthEntries.find((entry) => entry.date === button.dataset.date);
      openHealthModal(button.dataset.date, item);
    };
  });

  health.querySelectorAll("[data-action='delete-health']").forEach((button) => {
    button.onclick = () => {
      if (!confirm("この健康データを削除しますか？")) return;
      appState.data.healthEntries = appState.data.healthEntries.filter((entry) => entry.date !== button.dataset.date);
      saveState();
      renderApp();
    };
  });
}

function renderAnalytics() {
  const analytics = document.getElementById("tab-analytics");
  const monthData = getMonthlyFinance(appState.financeMonth);
  const totalBreakdownBase = Math.max(monthData.income, monthData.expense, monthData.fixedCost, 1);

  analytics.innerHTML = `
    <div class="card">
      <h2>今月の内訳</h2>
      <div class="breakdown-list">
        ${renderBreakdownItem("収入", monthData.income, "income", totalBreakdownBase)}
        ${renderBreakdownItem("変動支出", monthData.expense, "expense", totalBreakdownBase)}
        ${renderBreakdownItem("固定費", monthData.fixedCost, "fixed", totalBreakdownBase)}
      </div>
    </div>

    <div class="card">
      <div class="row between">
        <h2>月別の収支推移</h2>
        <span class="pill">直近6か月</span>
      </div>
      <div class="legend">
        <span class="legend-income">収入</span>
        <span class="legend-expense">支出</span>
        <span class="legend-fixed">固定費</span>
      </div>
      ${renderFinanceTrendChart()}
    </div>

    <div class="card">
      <div class="row between">
        <h2>体重推移</h2>
        <span class="pill">${appState.data.healthEntries.length} 件</span>
      </div>
      ${renderWeightChart()}
    </div>

    <div class="card">
      <div class="row between">
        <h2>摂取カロリー推移</h2>
        <span class="pill">${appState.data.healthEntries.filter((entry) => entry.intakeCalories).length} 件</span>
      </div>
      ${renderCaloriesChart()}
    </div>
  `;
}

function renderSettings() {
  const settings = document.getElementById("tab-settings");
  const fixedCosts = [...appState.data.fixedCosts].sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  settings.innerHTML = `
    <div class="card">
      <h2>固定費</h2>
      <div class="subtle">固定費は今月の支出に含めず、別枠で表示します。</div>
      <div class="hr"></div>
      <button id="settings-add-fixed" class="action-button full-width">固定費を追加</button>
      <div class="hr"></div>
      <div class="entry-list">
        ${fixedCosts.length ? fixedCosts.map(renderFixedCostItem).join("") : `<div class="empty">まだ固定費がありません</div>`}
      </div>
    </div>

    <div class="card">
      <h2>バックアップ</h2>
      <div class="form-actions">
        <button id="settings-export" class="secondary-button">JSONで書き出し</button>
        <button id="settings-import" class="secondary-button">JSONを読み込み</button>
      </div>
      <div class="hr"></div>
      <p class="subtle">機種変更やブラウザ変更に備えて、たまに書き出して保存しておくのがおすすめです。</p>
    </div>
  `;

  document.getElementById("settings-add-fixed").onclick = () => openFixedCostModal();
  document.getElementById("settings-export").onclick = exportBackup;
  document.getElementById("settings-import").onclick = () => document.getElementById("backup-import-input").click();

  settings.querySelectorAll("[data-action='edit-fixed']").forEach((button) => {
    button.onclick = () => {
      const item = appState.data.fixedCosts.find((entry) => entry.id === button.dataset.id);
      openFixedCostModal(item);
    };
  });

  settings.querySelectorAll("[data-action='delete-fixed']").forEach((button) => {
    button.onclick = () => {
      if (!confirm("この固定費を削除しますか？")) return;
      appState.data.fixedCosts = appState.data.fixedCosts.filter((entry) => entry.id !== button.dataset.id);
      saveState();
      renderApp();
    };
  });
}

function metricBox(label, value) {
  return `
    <div class="metric-box">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(String(value))}</div>
    </div>
  `;
}

function renderFinanceEntryItem(item) {
  return `
    <div class="entry-item">
      <div class="entry-top">
        <div>
          <div class="entry-title">${escapeHtml(item.title || "(無題)")}</div>
          <div class="subtle">${item.type === "income" ? "収入" : "支出"}</div>
        </div>
        <div class="entry-amount ${item.type === "expense" ? "expense" : ""}">${formatCurrency(item.amount)}</div>
      </div>
      ${item.note ? `<div class="entry-note">${escapeHtml(item.note)}</div>` : ""}
      <div class="row wrap" style="margin-top:10px;">
        <button class="secondary-button small" data-action="edit-finance" data-id="${item.id}">編集</button>
        <button class="danger-button small" data-action="delete-finance" data-id="${item.id}">削除</button>
      </div>
    </div>
  `;
}

function renderHealthEntryItem(item) {
  return `
    <div class="entry-item">
      <div class="entry-top">
        <div>
          <div class="entry-title">${item.date}</div>
          <div class="subtle">1日1回入力</div>
        </div>
      </div>
      <div class="row wrap" style="margin-top:8px;">
        <span class="pill">体重 ${item.weight ?? "-"}</span>
        <span class="pill">体脂肪 ${item.bodyFatPercentage ?? "-"}</span>
        <span class="pill">摂取 ${item.intakeCalories ?? "-"}</span>
        <span class="pill">歩数 ${item.steps ?? "-"}</span>
        <span class="pill">運動消費 ${item.activeCalories ?? "-"}</span>
      </div>
      <div class="row wrap" style="margin-top:10px;">
        <button class="secondary-button small" data-action="edit-health" data-date="${item.date}">編集</button>
        <button class="danger-button small" data-action="delete-health" data-date="${item.date}">削除</button>
      </div>
    </div>
  `;
}

function renderFixedCostItem(item) {
  return `
    <div class="entry-item">
      <div class="entry-top">
        <div>
          <div class="entry-title">${escapeHtml(item.name)}</div>
          <div class="subtle">毎月 ${item.dayOfMonth} 日</div>
        </div>
        <div>${formatCurrency(item.amount)}</div>
      </div>
      ${item.memo ? `<div class="entry-note">${escapeHtml(item.memo)}</div>` : ""}
      <div class="row wrap" style="margin-top:10px;">
        <button class="secondary-button small" data-action="edit-fixed" data-id="${item.id}">編集</button>
        <button class="danger-button small" data-action="delete-fixed" data-id="${item.id}">削除</button>
      </div>
    </div>
  `;
}

function renderBreakdownItem(label, amount, kind, maxValue) {
  const width = Math.max(4, Math.round((amount / maxValue) * 100));
  return `
    <div class="breakdown-item">
      <div class="row between">
        <strong>${label}</strong>
        <span>${formatCurrency(amount)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill ${kind}" style="width:${width}%"></div>
      </div>
    </div>
  `;
}

function openFinanceModal(dateStr, existing = null) {
  appState.modalType = "finance";
  const title = existing ? "家計簿を編集" : "家計簿を追加";
  const body = `
    <form id="finance-form" class="form-grid">
      <input type="hidden" name="id" value="${existing?.id || ""}" />
      <div>
        <label>日付</label>
        <input type="date" name="date" value="${existing?.date || dateStr}" required />
      </div>
      <div>
        <label>種類</label>
        <select name="type">
          <option value="expense" ${!existing || existing.type === "expense" ? "selected" : ""}>支出</option>
          <option value="income" ${existing?.type === "income" ? "selected" : ""}>収入</option>
        </select>
      </div>
      <div>
        <label>内容</label>
        <input type="text" name="title" value="${escapeAttr(existing?.title || "")}" placeholder="例: 昼食 / 給料" required />
      </div>
      <div>
        <label>金額</label>
        <input type="number" name="amount" min="0" step="1" value="${existing?.amount ?? ""}" placeholder="例: 1200" required />
      </div>
      <div>
        <label>メモ</label>
        <textarea name="note" placeholder="任意">${escapeHtml(existing?.note || "")}</textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="action-button">${existing ? "更新" : "保存"}</button>
        <button type="button" class="secondary-button" id="finance-form-cancel">キャンセル</button>
      </div>
    </form>
  `;
  openModal(title, body);

  document.getElementById("finance-form-cancel").onclick = closeModal;
  document.getElementById("finance-form").onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = {
      id: form.get("id") || cryptoRandomId(),
      date: String(form.get("date")),
      type: String(form.get("type")),
      title: String(form.get("title")).trim(),
      amount: Number(form.get("amount")),
      note: String(form.get("note")).trim(),
    };

    if (!item.title || !item.date || Number.isNaN(item.amount)) return;

    const index = appState.data.financeEntries.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      appState.data.financeEntries[index] = item;
    } else {
      appState.data.financeEntries.push(item);
    }

    appState.selectedFinanceDate = item.date;
    saveState();
    closeModal();
    renderApp();
  };
}

function openHealthModal(dateStr, existing = null) {
  appState.modalType = "health";
  const title = existing ? "健康データを編集" : "健康データを入力";
  const body = `
    <form id="health-form" class="form-grid">
      <div>
        <label>日付</label>
        <input type="date" name="date" value="${existing?.date || dateStr}" required />
      </div>
      <div>
        <label>体重 (kg)</label>
        <input type="number" name="weight" min="0" step="0.1" value="${existing?.weight ?? ""}" />
      </div>
      <div>
        <label>体脂肪率 (%)</label>
        <input type="number" name="bodyFatPercentage" min="0" step="0.1" value="${existing?.bodyFatPercentage ?? ""}" />
      </div>
      <div>
        <label>摂取カロリー (1日の合計)</label>
        <input type="number" name="intakeCalories" min="0" step="1" value="${existing?.intakeCalories ?? ""}" />
      </div>
      <div>
        <label>歩数</label>
        <input type="number" name="steps" min="0" step="1" value="${existing?.steps ?? ""}" />
      </div>
      <div>
        <label>運動消費カロリー</label>
        <input type="number" name="activeCalories" min="0" step="1" value="${existing?.activeCalories ?? ""}" />
      </div>
      <div class="form-actions">
        <button type="submit" class="action-button">${existing ? "更新" : "保存"}</button>
        <button type="button" class="secondary-button" id="health-form-cancel">キャンセル</button>
      </div>
    </form>
  `;
  openModal(title, body);

  document.getElementById("health-form-cancel").onclick = closeModal;
  document.getElementById("health-form").onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = {
      date: String(form.get("date")),
      weight: nullableNumber(form.get("weight")),
      bodyFatPercentage: nullableNumber(form.get("bodyFatPercentage")),
      intakeCalories: nullableInteger(form.get("intakeCalories")),
      steps: nullableInteger(form.get("steps")),
      activeCalories: nullableInteger(form.get("activeCalories")),
    };

    appState.data.healthEntries = appState.data.healthEntries.filter((entry) => entry.date !== item.date);
    appState.data.healthEntries.push(item);
    saveState();
    closeModal();
    renderApp();
  };
}

function openFixedCostModal(existing = null) {
  appState.modalType = "fixed";
  const title = existing ? "固定費を編集" : "固定費を追加";
  const body = `
    <form id="fixed-form" class="form-grid">
      <input type="hidden" name="id" value="${existing?.id || ""}" />
      <div>
        <label>名前</label>
        <input type="text" name="name" value="${escapeAttr(existing?.name || "")}" placeholder="例: 家賃 / サブスク" required />
      </div>
      <div>
        <label>金額</label>
        <input type="number" name="amount" min="0" step="1" value="${existing?.amount ?? ""}" required />
      </div>
      <div>
        <label>毎月何日か</label>
        <input type="number" name="dayOfMonth" min="1" max="31" step="1" value="${existing?.dayOfMonth ?? 1}" required />
      </div>
      <div>
        <label>メモ</label>
        <textarea name="memo" placeholder="任意">${escapeHtml(existing?.memo || "")}</textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="action-button">${existing ? "更新" : "保存"}</button>
        <button type="button" class="secondary-button" id="fixed-form-cancel">キャンセル</button>
      </div>
    </form>
  `;
  openModal(title, body);

  document.getElementById("fixed-form-cancel").onclick = closeModal;
  document.getElementById("fixed-form").onsubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = {
      id: form.get("id") || cryptoRandomId(),
      name: String(form.get("name")).trim(),
      amount: Number(form.get("amount")),
      dayOfMonth: Number(form.get("dayOfMonth")),
      memo: String(form.get("memo")).trim(),
    };
    if (!item.name || Number.isNaN(item.amount) || Number.isNaN(item.dayOfMonth)) return;

    const index = appState.data.fixedCosts.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      appState.data.fixedCosts[index] = item;
    } else {
      appState.data.fixedCosts.push(item);
    }

    saveState();
    closeModal();
    renderApp();
  };
}

function openModal(title, bodyHtml) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = bodyHtml;
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  document.getElementById("modal-body").innerHTML = "";
  appState.modalType = null;
}

function getMonthlyFinance(monthDate) {
  const monthKey = formatMonthKey(monthDate);
  const entries = appState.data.financeEntries.filter((item) => item.date.startsWith(monthKey));
  return {
    income: sumAmounts(entries.filter((item) => item.type === "income")),
    expense: sumAmounts(entries.filter((item) => item.type === "expense")),
    fixedCost: sumAmounts(appState.data.fixedCosts),
  };
}

function getMonthlyTotalAmount(monthData) {
  return Number(monthData?.income || 0);
}

function getRemainingAmount(monthData) {
  return getMonthlyTotalAmount(monthData) - Number(monthData?.expense || 0);
}

function getFinanceEntriesByDate(dateStr) {
  return appState.data.financeEntries
    .filter((item) => item.date === dateStr)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "income" ? -1 : 1;
      return a.title.localeCompare(b.title, "ja");
    });
}

function getHealthEntryByDate(dateStr) {
  return appState.data.healthEntries.find((item) => item.date === dateStr) || null;
}

function getDailyExpense(dateStr) {
  return sumAmounts(appState.data.financeEntries.filter((item) => item.date === dateStr && item.type === "expense"));
}

function sumAmounts(items) {
  return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getCalendarGridDates(baseDate) {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const dates = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function renderFinanceTrendChart() {
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const monthDate = addMonths(startOfMonth(new Date()), -i);
    const data = getMonthlyFinance(monthDate);
    months.push({
      label: `${monthDate.getMonth() + 1}月`,
      income: data.income,
      expense: data.expense,
      fixed: data.fixedCost,
    });
  }

  const width = 700;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 36, left: 36 };
  const maxValue = Math.max(1, ...months.flatMap((m) => [m.income, m.expense, m.fixed]));
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = (width - padding.left - padding.right) / months.length;
  const barWidth = Math.min(18, groupWidth / 4);
  const colors = { income: "#111827", expense: "#dc2626", fixed: "#6b7280" };

  const bars = months.map((month, index) => {
    const xBase = padding.left + index * groupWidth + groupWidth / 2 - barWidth * 1.5;
    const values = [
      { key: "income", value: month.income, x: xBase },
      { key: "expense", value: month.expense, x: xBase + barWidth + 4 },
      { key: "fixed", value: month.fixed, x: xBase + (barWidth + 4) * 2 },
    ];

    const barSvg = values.map((item) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const y = height - padding.bottom - barHeight;
      return `<rect x="${item.x}" y="${y}" width="${barWidth}" height="${Math.max(barHeight, 2)}" rx="4" fill="${colors[item.key]}" />`;
    }).join("");

    return `${barSvg}<text x="${padding.left + index * groupWidth + groupWidth / 2}" y="${height - 12}" text-anchor="middle" font-size="12" fill="#6b7280">${month.label}</text>`;
  }).join("");

  const grid = Array.from({ length: 4 }).map((_, index) => {
    const y = padding.top + (chartHeight / 3) * index;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-width="1" />`;
  }).join("");

  return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg">${grid}${bars}</svg>`;
}

function renderWeightChart() {
  const points = appState.data.healthEntries
    .filter((entry) => entry.weight)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  if (!points.length) {
    return `<div class="empty">体重データがまだありません</div>`;
  }

  return renderLineChartSvg(points.map((item) => ({ xLabel: item.date.slice(5), value: Number(item.weight) })), "kg");
}

function renderCaloriesChart() {
  const points = appState.data.healthEntries
    .filter((entry) => entry.intakeCalories)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  if (!points.length) {
    return `<div class="empty">摂取カロリーデータがまだありません</div>`;
  }

  return renderBarChartSvg(points.map((item) => ({ xLabel: item.date.slice(5), value: Number(item.intakeCalories) })), "kcal");
}

function renderLineChartSvg(points, suffix = "") {
  const width = 700;
  const height = 220;
  const padding = { top: 24, right: 20, bottom: 34, left: 42 };
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const coords = points.map((point, index) => {
    const x = padding.left + (points.length === 1 ? plotWidth / 2 : (plotWidth * index) / (points.length - 1));
    const y = padding.top + ((max - point.value) / range) * plotHeight;
    return { ...point, x, y };
  });

  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const grid = Array.from({ length: 4 }).map((_, index) => {
    const y = padding.top + (plotHeight / 3) * index;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-width="1" />`;
  }).join("");

  const labels = coords.map((point, index) => {
    if (points.length > 8 && index % 2 === 1 && index !== points.length - 1) return "";
    return `<text x="${point.x}" y="${height - 12}" text-anchor="middle" font-size="12" fill="#6b7280">${point.xLabel}</text>`;
  }).join("");

  const circles = coords.map((point) => `
    <circle cx="${point.x}" cy="${point.y}" r="4" fill="#2563eb" />
    <text x="${point.x}" y="${point.y - 10}" text-anchor="middle" font-size="11" fill="#1f2937">${point.value}${suffix}</text>
  `).join("");

  return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg">
    ${grid}
    <path d="${path}" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    ${circles}
    ${labels}
  </svg>`;
}

function renderBarChartSvg(points, suffix = "") {
  const width = 700;
  const height = 220;
  const padding = { top: 24, right: 20, bottom: 34, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const max = Math.max(...points.map((p) => p.value), 1);
  const barWidth = Math.max(12, Math.min(28, plotWidth / Math.max(points.length * 1.6, 1)));

  const grid = Array.from({ length: 4 }).map((_, index) => {
    const y = padding.top + (plotHeight / 3) * index;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-width="1" />`;
  }).join("");

  const bars = points.map((point, index) => {
    const x = padding.left + ((plotWidth) / points.length) * index + ((plotWidth / points.length) - barWidth) / 2;
    const barHeight = (point.value / max) * plotHeight;
    const y = height - padding.bottom - barHeight;
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barHeight, 2)}" rx="6" fill="#2563eb" />
      <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="11" fill="#1f2937">${point.value}${suffix}</text>
      <text x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle" font-size="12" fill="#6b7280">${point.xLabel}</text>
    `;
  }).join("");

  return `<svg viewBox="0 0 ${width} ${height}" class="chart-svg">${grid}${bars}</svg>`;
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(appState.data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `kakeibo-health-backup-${formatDateLocal(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object") throw new Error("invalid");
      appState.data = {
        financeEntries: Array.isArray(data.financeEntries) ? data.financeEntries : [],
        fixedCosts: Array.isArray(data.fixedCosts) ? data.fixedCosts : [],
        healthEntries: Array.isArray(data.healthEntries) ? data.healthEntries : [],
      };
      saveState();
      renderApp();
      alert("バックアップを読み込みました。");
    } catch {
      alert("JSONの読み込みに失敗しました。");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(() => {});
    });
  }
}

function cryptoRandomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nullableNumber(value) {
  const text = String(value).trim();
  if (!text) return null;
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function nullableInteger(value) {
  const num = nullableNumber(value);
  return num === null ? null : Math.round(num);
}

function formatCurrency(value) {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthYear(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}