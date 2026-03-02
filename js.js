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
  "C-Mlekalprosoya", "4:1 Maso", "10:1 Maso", "Maso Filet O Fi", 
  "Slanina Dlouha", "Slaninove Kousk", "Tasticka Jablko", "Tasticka Boruvk", 
  "English Muffin", "Zemle Bagel", "Pork Maso", "Hashbrown", 
  "Tortilla 20cm", "Tortilla 25cm", "Livance 40ks", "Bez Lepku Zemle", 
  "Kureci Nugety", "Hermelinky", "Smazeny Syr Eid", "Rosti Patty", 
  "Grilled Kureci Maso", "Maso Value Chicken", "Maso Kureci McCrispy", 
  "Stripsy Kureci", "Maso Kureci Str", "Premiere Chicken", "Maso Premier Ch", 
  "Hranolky 12.5kg", "Omacka Guacamol", "ZemleSyrSla2x2", "Zemle McCrispy", 
  "Zemle BM Best Burger", "Zemle QP Best Burger", "Zemle RG Best Burger", 
  "Nudlicky Sun. Chlaz.", "Platky Sunka Chlaz.", "Lucina Kremova", "Maslo Meggle", 
  "Rucola", "Okurky Krajene", "Cibule Cerstva", "Okurky Nakladane", 
  "Pribinacek 15x0,125", "Omacka FF 830ks", "Kecup Porcovany", "Cherry Rajcata", 
  "Rajcata Krajena", "Kecup 10 L", "Kit Kat Posypka", "Lotus Posypka", 
  "Lentilky Mini", "Jalapenos Papricky", "Salatova Smes S", "Salat Batavia", 
  "Shake Mix", "Sundae Mix", "Sladkokysely Dip 125", "Omacka Habanero", 
  "Omacka Dorblu 6", "Strouhany Cheddar", "Syr Cheddar Platky", "Syr White Chedd", 
  "Vanilka Sirup 12 kg", "Coko Sirup 12 kg", "Jahoda Sirup 12 kg", "Coko Poleva", 
  "Karamel Poleva", "Jahoda Poleva", "BM Omacka", "Sandwich Omacka", 
  "Tasty Omacka", "Sweet-Chilli Omacka", "Omacka Carolina BBQ", "Omacka Med&Horc", 
  "Omacka Creamy B", "Omacka Cheddar", "Omacka Big Rost", "Vejce Cerstva", 
  "Horcice 15 kg", "Hellmans Tatarka", "Koktejlova Zalivka", "Ceasar Zalivka", 
  "Jogurtova Zalivka", "Syrova Zalivka", "Zalivka Olivovy Olej", "Zalivka Balsamico", 
  "Omacka Tartar", "Omacka Cesnek 6", "Omacka Horcice/Bazal", "Omacka Tomato/Oregan", 
  "Kari Dip 125 ks", "BBQ Dip 125ks", "Omacka Barbecue", "Omacka Swiss K", 
  "BrusinkovaOmac", "Dip Chilli-Lemon 125", "Horcicovy Dip 125ks", "Omacka Marinara", 
  "Deluxe Omacka", "Salat BM", "Rajec Neperlivy", "Rajec Jemne Perlivy", 
  "Pomeranc Dzus Chlaz.", "Jablecny Dzus Chlaz.", "Friends-Collect", "Friends-Hrnek 3", 
  "Tuk Tekuty 15L", "Zero Coca Cola 5L", "Cola 20 Litru", "Lipton IceTea 10 Lit", 
  "Sprite 5 Litru", "Fanta 5 Litru", "Box Filet Fish", "Krutony Salatove", 
  "Susena Cibule", "Cibule Smazena", "Kornout Zmrzlinovy", "C-Bezkofeinkava", 
  "C-Vanilla Prase", "Sipkovy Lipton Caj", "Matovy Lipton Caj", "Zeleny Lipton Caj", 
  "English Br. Lipton", "C-Kokos Prichut", "Vanilka Prichut", "Sirup Toasted M", 
  "C-Coko Prichut", "C-Karamel Prichut", "Orisek Prichut", "Kava Espresso 6", 
  "C-Horka Cokolada", "C-Cukr Hnedy", "Cukr Bily", "C-Citrony 1kg", 
  "Smetana 240x10g", "Smetana 1L", "Jahoda Dzem", "Nutella", 
  "Merunka Dzem", "Citronstava 100", "Med Kvetovany 8", "C-Mleko Ovesne", 
  "C-Mleko Bezlakt", "C-Mleko 3,5%", "C-Croissant", "C-Cokoladova Ko", 
  "C-Jahoda Cheesecake", "C-Jablecny Dort Kara", "C-Misa Rez 48ks", "C-Bananchleb", 
  "Srdicko 532ks", "Muffin Tresen 1", "C-Cheese Cake", "C-Dort Mrkvovy", 
  "Koblizky Mini M", "C-Nugat Koblizky", "C-Triple Cookies", "Koblizek Dubai", 
  "C-Cookie Choc C"
];

let currentType = localStorage.getItem("currentListType_v5") || 'daily';

let listData = {
  daily: JSON.parse(localStorage.getItem("inventoryList_daily_v5")) || [...defaultItems],
  weekly: JSON.parse(localStorage.getItem("inventoryList_weekly_v5")) || [...defaultItems],
  monday: JSON.parse(localStorage.getItem("inventoryList_monday_v5")) || [...defaultItems],
  wednesday: JSON.parse(localStorage.getItem("inventoryList_wednesday_v5")) || [...defaultItems],
  thursday: JSON.parse(localStorage.getItem("inventoryList_thursday_v5")) || [...defaultItems]
};

let logData = {
  daily: JSON.parse(localStorage.getItem("inventoryLogs_daily_v5")) || [],
  weekly: JSON.parse(localStorage.getItem("inventoryLogs_weekly_v5")) || [],
  monday: JSON.parse(localStorage.getItem("inventoryLogs_monday_v5")) || [],
  wednesday: JSON.parse(localStorage.getItem("inventoryLogs_wednesday_v5")) || [],
  thursday: JSON.parse(localStorage.getItem("inventoryLogs_thursday_v5")) || []
};

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
  document.getElementById('tab-' + type).classList.add('active');

  let titleLabel = 'DENNÍ';
  if (type === 'weekly') titleLabel = 'TÝDENNÍ';
  if (type === 'monday') titleLabel = 'PONDĚLÍ';
  if (type === 'wednesday') titleLabel = 'STŘEDA';
  if (type === 'thursday') titleLabel = 'ČTVRTEK';
  
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
        <input type="number" inputmode="decimal" class="qty-input" id="${item}-pack">
        <span class="total-display" id="${item}-pack-total">${t.pack}</span>
      </td>
      <td>
        <input type="number" inputmode="decimal" class="qty-input" id="${item}-bag">
        <span class="total-display" id="${item}-bag-total">${t.bag}</span>
      </td>
      <td>
        <input type="number" inputmode="decimal" class="qty-input" id="${item}-pcs">
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
  return totals;
}

// --- UPDATE POLOŽKY ---
function updateItem(item) {
  const inputs = ['pack', 'bag', 'pcs'];
  let changed = false;

  inputs.forEach(unit => {
    const inputEl = document.getElementById(`${item}-${unit}`);
    let val = parseFloat(inputEl.value);
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
  const newVal = prompt("Zadej novou hodnotu (např. 5 nebo -2):", log.val);
  if (newVal !== null) {
    const p = parseFloat(newVal);
    if (!isNaN(p)) {
      log.val = p;
      saveData();
      renderHistoryList();
      refreshSingleItemDisplay(historyTargetItem);
    }
  }
}

// --- EDITACE SEZNAMU ---
function openEditListModal() {
  let title = 'Denní';
  if (currentType === 'weekly') title = 'Týdenní';
  if (currentType === 'monday') title = 'Pondělí';
  if (currentType === 'wednesday') title = 'Středa';
  if (currentType === 'thursday') title = 'Čtvrtek';
  
  document.getElementById('editModalTitle').innerHTML = `<i class="fas fa-list" style="margin-right: 5px;"></i> Editace: ${title}`;
  document.getElementById("itemsTextarea").value = listData[currentType].join("\n");
  document.getElementById("listModal").style.display = "flex";
}

function saveNewList() {
  const rawText = document.getElementById("itemsTextarea").value;
  const newItems = rawText.split("\n").map(t => t.trim()).filter(t => t.length > 0);
  
  if (newItems.length === 0) { alert("Seznam nesmí být prázdný"); return; }
  
  let title = 'Denní';
  if (currentType === 'weekly') title = 'Týdenní';
  if (currentType === 'monday') title = 'Pondělí';
  if (currentType === 'wednesday') title = 'Středa';
  if (currentType === 'thursday') title = 'Čtvrtek';

  if (confirm(`Uložit nové uspořádání pro ${title} seznam?`)) {
    listData[currentType] = newItems;
    saveData();
    document.getElementById("listModal").style.display = "none";
    renderTable();
  }
}

// --- RESET A MODES ---
function resetInventory() {
  let label = 'DENNÍ';
  if (currentType === 'weekly') label = 'TÝDENNÍ';
  if (currentType === 'monday') label = 'PONDĚLÍ';
  if (currentType === 'wednesday') label = 'STŘEDA';
  if (currentType === 'thursday') label = 'ČTVRTEK';

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
  // Při sčítání je text OK, při odčítání je krásná ikonka minusu
  const btnContent = isSubtractionMode ? '<i class="fas fa-minus"></i>' : "OK";
  document.querySelectorAll('.btn-ok').forEach(b => b.innerHTML = btnContent);
}

// Inicializace (po načtení stránky HTML)
document.addEventListener('DOMContentLoaded', () => {
    switchListType(currentType);
});