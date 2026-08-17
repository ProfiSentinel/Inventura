// --- OCHRANA PŘED RELOADEM ---
window.addEventListener('beforeunload', function (e) {
  if (hasUnsavedInputs()) {
    e.preventDefault();
    e.returnValue = 'Máte neuložená data!'; 
    return 'Máte neuložená data!';
  }
});

function hasUnsavedInputs() {
  const inputs = document.querySelectorAll('input.qty-input');
  for (let input of inputs) {
    if (input.value.trim() !== "") return true;
  }
  return false;
}

// --- DYNAMICKÁ KALKULACE STICKY POZICE ---
const stickyWrapper = document.getElementById('sticky-wrapper');
const resizeObserver = new ResizeObserver(entries => {
  for (let entry of entries) {
    const height = entry.contentRect.height;
    document.documentElement.style.setProperty('--sticky-top-offset', `${height}px`);
  }
});
if(stickyWrapper) resizeObserver.observe(stickyWrapper);

// --- DATA ---
const defaultItems = [
  "Položka 1"
];

// Překladové slovníky pro dny v týdnu
const typeLabels = {
  monday: 'PONDĚLÍ', tuesday: 'ÚTERÝ', wednesday: 'STŘEDA',
  thursday: 'ČTVRTEK', friday: 'PÁTEK', saturday: 'SOBOTA', sunday: 'NEDĚLE'
};
const typeLabelsLower = {
  monday: 'Pondělí', tuesday: 'Úterý', wednesday: 'Středa',
  thursday: 'Čtvrtek', friday: 'Pátek', saturday: 'Sobota', sunday: 'Neděle'
};

let currentType = localStorage.getItem("currentListType_v5") || 'monday';

// Ochrana pro případ, že má někdo v telefonu uloženou starou záložku mimo rozsah 7 dnů
if (!typeLabels[currentType]) {
    currentType = 'monday';
}

// Inicializace úložiště pro 7 dnů
let listData = {};
let logData = {};

Object.keys(typeLabels).forEach(type => {
  listData[type] = JSON.parse(localStorage.getItem(`inventoryList_${type}_v5`)) || [...defaultItems];
  logData[type] = JSON.parse(localStorage.getItem(`inventoryLogs_${type}_v5`)) || [];
});

let isSubtractionMode = false;
const unitNames = { 'pack': 'Balení', 'bag': 'Sáčky', 'pcs': 'Kusy' };

// --- PŘEPÍNÁNÍ SEZNAMŮ ---
function switchListType(type) {
  if (hasUnsavedInputs()) {
    if (!confirm("Máte rozepsaná čísla. Pokud přepnete seznam, zmizí. Pokračovat?")) return;
  }

  currentType = type;
  localStorage.setItem("currentListType_v5", type);
  
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const activeTab = document.getElementById('tab-' + type);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  let titleLabel = typeLabels[type] || 'PONDĚLÍ';
  document.getElementById('pageTitle').textContent = `${titleLabel} INVENTURA`;

  closeSearch();
  renderTable();
}

// --- RENDEROVÁNÍ TABULKY ---
const tbody = document.getElementById("inventoryTable");

function renderTable() {
  tbody.innerHTML = "";
  
  const currentList = listData[currentType];
  const currentLogs = logData[currentType];
  
  const totals = calculateTotals(currentList, currentLogs);

  currentList.forEach(item => {
    const t = totals[item] || { pack: 0, bag: 0, pcs: 0 };
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="item-name" onclick="openHistory('${item}')">${item}</td>
      <td>
        <input type="number" step="any" inputmode="decimal" class="qty-input" id="${item}-pack">
        <span class="total-display" id="${item}-pack-total">${t.pack}</span>
      </td>
      <td>
        <input type="number" step="any" inputmode="decimal" class="qty-input" id="${item}-bag">
        <span class="total-display" id="${item}-bag-total">${t.bag}</span>
      </td>
      <td>
        <input type="number" step="any" inputmode="decimal" class="qty-input" id="${item}-pcs">
        <span class="total-display" id="${item}-pcs-total">${t.pcs}</span>
      </td>
      <td><button class="btn-ok" onclick="updateItem('${item}')">OK</button></td>
    `;
    tbody.appendChild(row);

    ['pack', 'bag', 'pcs'].forEach(type => {
      document.getElementById(`${item}-${type}`).addEventListener("keypress", function(e) {
        if (e.key === "Enter") { e.preventDefault(); updateItem(item); }
      });
    });
  });
  
  const searchVal = document.getElementById('searchInput').value;
  if(searchVal) filterItems(searchVal);
  
  updateOkButtonsText();
}

function calculateTotals(items, logs) {
  const totals = {};
  items.forEach(i => totals[i] = { pack: 0, bag: 0, pcs: 0 });
  logs.forEach(log => {
    if (totals[log.item]) {
      totals[log.item][log.unit] += log.val;
    }
  });

  // Ošetření nepřesností plovoucí řádové čárky v JS (např. 0.1 + 0.2)
  items.forEach(i => {
    ['pack', 'bag', 'pcs'].forEach(u => {
      totals[i][u] = Math.round(totals[i][u] * 1000) / 1000;
    });
  });

  return totals;
}

// --- UPDATE POLOŽKY ---
function updateItem(item) {
  const inputs = ['pack', 'bag', 'pcs'];
  let changed = false;

  inputs.forEach(unit => {
    const inputEl = document.getElementById(`${item}-${unit}`);
    let valStr = inputEl.value.replace(',', '.');
    let val = parseFloat(valStr);

    if (!isNaN(val)) {
      if (isSubtractionMode) val = -val;
      
      logData[currentType].push({
        id: Date.now() + Math.random(),
        item: item, unit: unit, val: val,
        timestamp: new Date().toISOString()
      });
      
      inputEl.value = "";
      changed = true;
      highlightChange(`${item}-${unit}-total`);
    }
  });

  if (changed) {
    saveData();
    refreshSingleItemDisplay(item);
  }
}

function refreshSingleItemDisplay(item) {
  let t = { pack: 0, bag: 0, pcs: 0 };
  logData[currentType].filter(l => l.item === item).forEach(l => t[l.unit] += l.val);
  
  ['pack', 'bag', 'pcs'].forEach(u => {
    t[u] = Math.round(t[u] * 1000) / 1000;
  });

  document.getElementById(`${item}-pack-total`).textContent = t.pack;
  document.getElementById(`${item}-bag-total`).textContent = t.bag;
  document.getElementById(`${item}-pcs-total`).textContent = t.pcs;
}

function highlightChange(elementId) {
  const el = document.getElementById(elementId);
  if(el) {
    el.classList.remove("updated");
    void el.offsetWidth;
    el.classList.add("updated");
  }
}

function saveData() {
  localStorage.setItem(`inventoryLogs_${currentType}_v5`, JSON.stringify(logData[currentType]));
  localStorage.setItem(`inventoryList_${currentType}_v5`, JSON.stringify(listData[currentType]));
}

// --- HLEDÁNÍ ---
const searchBar = document.getElementById('searchBar');
const searchInput = document.getElementById('searchInput');

function toggleSearch() {
  if (searchBar.style.display === 'block') {
    closeSearch();
  } else {
    searchBar.style.display = 'block';
    searchInput.focus();
  }
}

function closeSearch() {
  searchBar.style.display = 'none';
  searchInput.value = '';
  filterItems('');
}

searchInput.addEventListener('input', (e) => filterItems(e.target.value));

searchInput.addEventListener('focus', function() {
  this.value = ''; 
  filterItems(''); 
});

function filterItems(query) {
  const rows = document.querySelectorAll('#inventoryTable tr');
  const lowerQuery = query.toLowerCase();
  rows.forEach(row => {
    const name = row.querySelector('.item-name').textContent.toLowerCase();
    if (name.includes(lowerQuery)) row.classList.remove('hidden');
    else row.classList.add('hidden');
  });
}

// --- HISTORIE ---
let historyTargetItem = null;

function openHistory(item) {
  historyTargetItem = item;
  document.getElementById("historyTitle").innerHTML = `<i class="fas fa-history" style="margin-right: 5px;"></i> ${item}`;
  renderHistoryList();
  document.getElementById("historyModal").style.display = "flex";
}

function renderHistoryList() {
  const container = document.getElementById("historyContainer");
  container.innerHTML = "";
  const logs = logData[currentType].filter(l => l.item === historyTargetItem).reverse();

  if (logs.length === 0) {
    container.innerHTML = "<div style='padding:20px; text-align:center; color:#999'>Žádné záznamy v tomto seznamu</div>";
    return;
  }

  logs.forEach(log => {
    const div = document.createElement("div");
    div.className = "history-item";
    const sign = log.val > 0 ? "+" : "";
    const colorClass = log.val > 0 ? "positive" : "negative";
    div.innerHTML = `
      <span class="hist-val ${colorClass}" onclick="editLogEntry(${log.id})">${sign}${log.val}</span>
      <span class="hist-unit">${unitNames[log.unit]}</span>
      <button class="btn-del-entry" onclick="deleteLogEntry(${log.id})"><i class="fas fa-trash-alt"></i></button>
    `;
    container.appendChild(div);
  });
}

function deleteLogEntry(id) {
  if (confirm("Opravdu smazat tento záznam z historie?")) {
    logData[currentType] = logData[currentType].filter(l => l.id !== id);
    saveData();
    renderHistoryList();
    refreshSingleItemDisplay(historyTargetItem);
  }
}

function editLogEntry(id) {
  const log = logData[currentType].find(l => l.id === id);
  if (!log) return;
  const newVal = prompt("Zadej novou hodnotu (např. 5,5 nebo -2.1):", log.val);
  if (newVal !== null) {
    const parsedVal = parseFloat(newVal.replace(',', '.'));
    if (!isNaN(parsedVal)) {
      log.val = parsedVal;
      saveData();
      renderHistoryList();
      refreshSingleItemDisplay(historyTargetItem);
    }
  }
}

// --- EDITACE SEZNAMU ---
function openEditListModal() {
  let title = typeLabelsLower[currentType] || 'Pondělí';
  document.getElementById('editModalTitle').innerHTML = `<i class="fas fa-list" style="margin-right: 5px;"></i> Editace: ${title}`;
  document.getElementById("itemsTextarea").value = listData[currentType].join("\n");
  document.getElementById("listModal").style.display = "flex";
}

function saveNewList() {
  const rawText = document.getElementById("itemsTextarea").value;
  const newItems = rawText.split("\n").map(t => t.trim()).filter(t => t.length > 0);
  
  if (newItems.length === 0) { alert("Seznam nesmí být prázdný"); return; }
  
  let title = typeLabelsLower[currentType] || 'Pondělí';

  if (confirm(`Uložit nové uspořádání pro ${title} seznam?`)) {
    listData[currentType] = newItems;
    saveData();
    document.getElementById("listModal").style.display = "none";
    renderTable();
  }
}

// --- RESET A MODES ---
function resetInventory() {
  let label = typeLabels[currentType] || 'PONDĚLÍ';
  if (confirm(`Opravdu vynulovat všechna data pro ${label} inventuru? (Smaže se i historie úprav)`)) {
    logData[currentType] = [];
    saveData();
    renderTable();
  }
}

function setMode(mode) {
  isSubtractionMode = (mode === 'sub');
  document.body.className = isSubtractionMode ? 'mode-sub' : 'mode-add';
  updateOkButtonsText();
}

function updateOkButtonsText() {
  const btnContent = isSubtractionMode ? '<i class="fas fa-minus"></i>' : "OK";
  document.querySelectorAll('.btn-ok').forEach(b => b.innerHTML = btnContent);
}

// Inicializace (po načtení stránky HTML)
document.addEventListener('DOMContentLoaded', () => {
    switchListType(currentType);
});
