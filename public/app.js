let fullData = [];
let activeCardFilter = null;

async function loadData() {
  const res = await fetch("/data/list");
  fullData = await res.json();

  applyFilters();
}

/* =========================
   APPLY FILTERS (FIXED)
========================= */
function applyFilters() {

  const div = document.getElementById("f_division")?.value.toLowerCase() || "";
  const state = document.getElementById("f_state")?.value.toLowerCase() || "";
  const bmhq = document.getElementById("f_bmhq")?.value.toLowerCase() || "";
  const code = document.getElementById("f_code")?.value.toLowerCase() || "";
  const name = document.getElementById("f_name")?.value.toLowerCase() || "";

  let data = fullData.filter(row => {

    const division = row.division || row.Division || row.DIVISION || "";
    const st = row.state || row.State || row.STATE || "";
    const hq = row.bmhq || row["BM HQ"] || row["BM HQ "] || "";
    const cd = row.code || row.Code || row.CODE || "";
    const nm = row.name || row.Name || row.NAME || "";

    return (
      division.toLowerCase().includes(div) &&
      st.toLowerCase().includes(state) &&
      hq.toLowerCase().includes(bmhq) &&
      cd.toLowerCase().includes(code) &&
      nm.toLowerCase().includes(name)
    );
  });

  /* ✅ CARD FILTER */
  if (activeCardFilter) {
    data = data.filter(row => {
      if (activeCardFilter === "awsDone") return row.awsFile;
      if (activeCardFilter === "awsPending") return !row.awsFile;
      if (activeCardFilter === "sssDone") return row.sssFile;
      if (activeCardFilter === "sssPending") return !row.sssFile;
      return true;
    });
  }

  renderTable(data);
  updateCards(data); // 🔥 IMPORTANT: pass filtered data only
}

/* =========================
   TABLE RENDER
========================= */
function renderTable(data) {

  let html = "";

  data.forEach(row => {

    const division = row.division || row.Division || row.DIVISION || "";
    const state = row.state || row.State || row.STATE || "";
    const bmhq = row.bmhq || row["BM HQ"] || row["BM HQ "] || "";
    const code = row.code || row.Code || row.CODE || "";
    const name = row.name || row.Name || row.NAME || "";

    html += `
      <tr>
        <td>${division}</td>
        <td>${state}</td>
        <td>${bmhq}</td>
        <td>${code}</td>
        <td>${name}</td>

        <td>
          <input placeholder="Enter value">
        </td>

        <td>
          ${row.awsFile
            ? `<button class="view" onclick="viewFile('${row.awsFile}')">View</button>
               ${isAdmin() ? `<button class="delete" onclick="deleteFile('${code}','aws')">Delete</button>` : ""}`
            : `<button class="upload" onclick="upload('${code}','aws')">Upload AWS</button>`
          }
        </td>

        <td>
          ${row.sssFile
            ? `<button class="view" onclick="viewFile('${row.sssFile}')">View</button>
               ${isAdmin() ? `<button class="delete" onclick="deleteFile('${code}','sss')">Delete</button>` : ""}`
            : `<button class="upload" onclick="upload('${code}','sss')">Upload SSS</button>`
          }
        </td>
      </tr>
    `;
  });

  document.getElementById("tableData").innerHTML = html;
}

/* =========================
   CARD UPDATE (FINAL FIX)
========================= */
function updateCards(data) {

  let awsDone = 0, awsPending = 0, sssDone = 0, sssPending = 0;

  data.forEach(row => {
    if (row.awsFile) awsDone++; else awsPending++;
    if (row.sssFile) sssDone++; else sssPending++;
  });

  const total = data.length;
  const safeTotal = total === 0 ? 1 : total;

  document.getElementById("awsDone").innerText =
    `${awsDone} (${Math.round((awsDone/safeTotal)*100)}%)`;

  document.getElementById("awsPending").innerText =
    `${awsPending} (${Math.round((awsPending/safeTotal)*100)}%)`;

  document.getElementById("sssDone").innerText =
    `${sssDone} (${Math.round((sssDone/safeTotal)*100)}%)`;

  document.getElementById("sssPending").innerText =
    `${sssPending} (${Math.round((sssPending/safeTotal)*100)}%)`;

  document.getElementById("total").innerText = total;
}

/* =========================
   CARD CLICK FILTER
========================= */
function filterByCard(type) {
  activeCardFilter = type;
  applyFilters();
}

/* =========================
   CLEAR FILTERS
========================= */
function clearFilters() {

  activeCardFilter = null;

  ["f_division","f_state","f_bmhq","f_code","f_name"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  applyFilters();
}

/* =========================
   UPLOAD
========================= */
function upload(code, type) {
  const input = document.createElement("input");
  input.type = "file";

  input.onchange = async () => {
    const form = new FormData();
    form.append("file", input.files[0]);
    form.append("code", code);
    form.append("type", type);

    await fetch("/data/upload", { method: "POST", body: form });

    loadData();
  };

  input.click();
}

/* =========================
   VIEW
========================= */
function viewFile(url) {
  window.open(url);
}

/* =========================
   DELETE
========================= */
function deleteFile(code, type) {
  fetch(`/data/delete/${code}/${type}`, { method: "DELETE" });
  loadData();
}

/* =========================
   ROLE
========================= */
function isAdmin() {
  return localStorage.getItem("role") === "admin";
}

/* =========================
   DOWNLOAD
========================= */
function downloadExcel() {
  window.open("/data/download/excel");
}

/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.clear();
  window.location = "/";
}

/* INIT */
window.onload = loadData;