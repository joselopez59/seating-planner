const MAX_TABLE_SEATS = 6;
const SEAT_POSITIONS = [
  { x: 50, y: 10 },
  { x: 85, y: 25 },
  { x: 85, y: 75 },
  { x: 50, y: 90 },
  { x: 15, y: 75 },
  { x: 15, y: 25 }
];

let numTables = 2;
const guests = [];
const initialGuests = [
  { name: "Anna Müller", note: "Vegetarisch", table: 1 },
  { name: "Thomas Becker", note: "", table: 1 },
  { name: "Julia König", note: "Kein Alkohol", table: 1 },
  { name: "Peter Schulz", note: "", table: 1 },
  { name: "Maria Hoffmann", note: "", table: 1 },
  { name: "Lukas Wagner", note: "", table: 1 },
  { name: "Sabine Keller", note: "", table: 2 },
  { name: "Michael Braun", note: "", table: 2 },
  { name: "Claudia Neumann", note: "Glutenfrei", table: 2 },
  { name: "Jan Richter", note: "", table: 2 },
  { name: "Sophie Lehmann", note: "", table: 2 },
  { name: "Daniel Schubert", note: "", table: 2 }
];

const form = document.getElementById("guest-form");
const nameInput = document.getElementById("guest-name");
const noteInput = document.getElementById("guest-note");
const tableField = document.getElementById("guest-table");
const seatingList = document.getElementById("seating-list");
const seatingPreview = document.getElementById("seating-preview");
const tablesArea = document.getElementById("tables-area");
const clearBtn = document.getElementById("clear-list");
const downloadBtn = document.getElementById("download-order");
const template = document.getElementById("seat-item-template");

let draggedId = null;
const uid = () =>
  typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

function loadSampleGuests() {
  initialGuests.forEach((g) => {
    guests.push({ id: uid(), ...g });
  });
}

function recomputeNumTables() {
  if (!guests.length) {
    numTables = 0;
    return;
  }
  const maxTableFromData = guests.reduce((max, g) => Math.max(max, g.table || 1), 1);
  const neededBySeats = Math.ceil(guests.length / MAX_TABLE_SEATS);
  numTables = Math.max(maxTableFromData, neededBySeats);
}

function updateTableFieldOptions() {
  tableField.innerHTML = "";
  const count = Math.max(numTables || 1, 1);
  for (let i = 1; i <= count; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Tisch ${i}`;
    tableField.appendChild(opt);
  }
}

function renderList() {
  seatingList.innerHTML = "";
  guests.forEach((guest, index) => {
    const fragment = template.content.cloneNode(true);
    const li = fragment.querySelector("li");
    li.dataset.id = guest.id;
    fragment.querySelector(".seat-name").textContent = `${index + 1}. ${guest.name}`;
    const noteEl = fragment.querySelector(".seat-note");
    const noteText = guest.note ? `${guest.note} · ` : "";
    noteEl.textContent = `${noteText}Tisch ${guest.table}`;
    seatingList.appendChild(fragment);
  });

  if (!guests.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "seat-item seat-item--empty";
    emptyState.textContent = "Noch keine Gäste. Lege links mit der Liste los.";
    seatingList.appendChild(emptyState);
  }
}

function renderCards() {
  seatingPreview.innerHTML = "";
  if (!guests.length) {
    seatingPreview.innerHTML =
      '<p class="table-placeholder">Keine Daten für die Vorschau.</p>';
    return;
  }

  guests.forEach((guest) => {
    const card = document.createElement("div");
    card.className = "preview-card";
    card.innerHTML = `<strong>${guest.name}</strong><span>Tisch ${guest.table}</span>${
      guest.note ? `<span>${guest.note}</span>` : ""
    }`;
    seatingPreview.appendChild(card);
  });
}

function renderTables() {
  tablesArea.innerHTML = "";
  if (!guests.length) {
    tablesArea.innerHTML =
      '<p class="table-placeholder">Noch keine Gäste? Füge sie links hinzu und sie erscheinen hier an den Tischen.</p>';
    return;
  }

  recomputeNumTables();

  for (let table = 1; table <= numTables; table++) {
    const box = document.createElement("div");
    box.className = "table-box";

    const title = document.createElement("div");
    title.className = "table-title";
    title.textContent = `Tisch ${table}`;

    const preview = document.createElement("div");
    preview.className = "table-preview";

    const centerLabel = document.createElement("div");
    centerLabel.className = "table-number-center";
    centerLabel.textContent = String(table);
    preview.appendChild(centerLabel);

    const forTable = guests.filter((g) => g.table === table);
    if (!forTable.length) {
      preview.innerHTML +=
        '<p class="table-placeholder">Keine Gäste für diesen Tisch.</p>';
    } else {
      const grid = document.createElement("div");
      grid.className = "seat-grid";

      forTable.slice(0, MAX_TABLE_SEATS).forEach((guest, index) => {
        const coords = SEAT_POSITIONS[index];
        const seat = document.createElement("div");
        seat.className = "seat-tile";
        seat.style.left = `${coords.x}%`;
        seat.style.top = `${coords.y}%`;
        seat.textContent = guest.name;
        grid.appendChild(seat);
      });

      preview.appendChild(grid);

      if (forTable.length > MAX_TABLE_SEATS) {
        const warning = document.createElement("p");
        warning.className = "table-warning";
        warning.textContent = "Grafische Ansicht zeigt max. 6 Plätze pro Tisch.";
        box.appendChild(warning);
      }
    }

    box.appendChild(title);
    box.appendChild(preview);
    tablesArea.appendChild(box);
  }
}

function syncUI() {
  renderList();
  renderCards();
  renderTables();
}

function getAfterElement(container, y) {
  const elements = [...container.querySelectorAll("li[data-id]:not(.dragging)")];
  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  const note = noteInput.value.trim();
  const table = parseInt(tableField.value, 10) || 1;
  if (!name) return;

  guests.push({ id: uid(), name, note, table });
  recomputeNumTables();
  form.reset();
  updateTableFieldOptions();
  nameInput.focus();
  syncUI();
});

seatingList.addEventListener("click", (event) => {
  const li = event.target.closest("li[data-id]");
  if (!li) return;
  const id = li.dataset.id;
  const idx = guests.findIndex((g) => g.id === id);
  if (idx === -1) return;

  if (event.target.classList.contains("remove")) {
    guests.splice(idx, 1);
  } else if (event.target.classList.contains("move-up") && idx > 0) {
    [guests[idx - 1], guests[idx]] = [guests[idx], guests[idx - 1]];
  } else if (
    event.target.classList.contains("move-down") &&
    idx < guests.length - 1
  ) {
    [guests[idx], guests[idx + 1]] = [guests[idx + 1], guests[idx]];
  } else {
    return;
  }
  recomputeNumTables();
  updateTableFieldOptions();
  syncUI();
});

seatingList.addEventListener("dragstart", (event) => {
  const li = event.target.closest("li[data-id]");
  if (!li) return;
  draggedId = li.dataset.id;
  li.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", draggedId);
});

seatingList.addEventListener("dragend", (event) => {
  event.target.classList?.remove("dragging");
  draggedId = null;
});

seatingList.addEventListener("dragover", (event) => {
  if (!draggedId) return;
  event.preventDefault();
  const afterElement = getAfterElement(seatingList, event.clientY);
  const draggedIdx = guests.findIndex((g) => g.id === draggedId);
  if (draggedIdx === -1) return;

  let targetIdx = afterElement
    ? guests.findIndex((g) => g.id === afterElement.dataset.id)
    : guests.length;

  if (targetIdx === -1) return;
  if (targetIdx === draggedIdx || targetIdx === draggedIdx + 1) return;

  const [item] = guests.splice(draggedIdx, 1);
  if (targetIdx > draggedIdx) {
    targetIdx -= 1;
  }
  if (targetIdx > guests.length) {
    targetIdx = guests.length;
  }
  guests.splice(targetIdx, 0, item);
  syncUI();
});

clearBtn.addEventListener("click", () => {
  if (!guests.length) return;
  if (confirm("Liste wirklich leeren?")) {
    guests.splice(0, guests.length);
    numTables = 0;
    updateTableFieldOptions();
    syncUI();
  }
});

downloadBtn.addEventListener("click", () => {
  if (!guests.length) {
    alert("Bitte zuerst Gäste hinzufügen.");
    return;
  }

  const text = guests
    .map(
      (guest, index) =>
        `${index + 1}. ${guest.name} (Tisch ${guest.table})${
          guest.note ? ` — ${guest.note}` : ""
        }`
    )
    .join("\n");

  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sitzreihenfolge.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

// Init
loadSampleGuests();
recomputeNumTables();
updateTableFieldOptions();
syncUI();
