async function loadData() {

  const search = document.getElementById("search").value.toLowerCase();

  const res = await fetch("/api/data");
  const data = await res.json();

  let html = "";

  let awsDone=0, awsPending=0, sssDone=0, sssPending=0;

  data.forEach(row => {

    if (search && !row.Name?.toLowerCase().includes(search)) return;

    if (row.awsFile) awsDone++; else awsPending++;
    if (row.sssFile) sssDone++; else sssPending++;

    html += `
      <tr>
        <td>${row.Division || ""}</td>
        <td>${row.State || ""}</td>
        <td>${row["BM HQ"] || ""}</td>
        <td>${row.Code || ""}</td>
        <td>${row.Name || ""}</td>

        <td>
          <input placeholder="Enter value">
        </td>

        <td>
          ${row.awsFile
            ? `<button class="view" onclick="viewFile('${row.awsFile}')">View</button>
               ${isAdmin()?`<button class="delete" onclick="deleteFile('${row.Code}','aws')">Delete</button>`:""}`
            : `<button class="upload" onclick="upload('${row.Code}','aws')">Upload AWS</button>`
          }
        </td>

        <td>
          ${row.sssFile
            ? `<button class="view" onclick="viewFile('${row.sssFile}')">View</button>
               ${isAdmin()?`<button class="delete" onclick="deleteFile('${row.Code}','sss')">Delete</button>`:""}`
            : `<button class="upload" onclick="upload('${row.Code}','sss')">Upload SSS</button>`
          }
        </td>
      </tr>
    `;
  });

  document.getElementById("tableData").innerHTML = html;

  document.getElementById("awsDone").innerText = awsDone;
  document.getElementById("awsPending").innerText = awsPending;
  document.getElementById("sssDone").innerText = sssDone;
  document.getElementById("sssPending").innerText = sssPending;
  document.getElementById("total").innerText = data.length;
}

/* UPLOAD */
function upload(code,type){
  const input = document.createElement("input");
  input.type="file";

  input.onchange = async ()=>{
    const form = new FormData();
    form.append("file",input.files[0]);
    form.append("code",code);
    form.append("type",type);

    await fetch("/api/upload",{method:"POST",body:form});
    loadData();
  };

  input.click();
}

/* VIEW */
function viewFile(name){
  window.open("/api/file/"+name);
}

/* DELETE */
function deleteFile(code,type){
  fetch(`/api/delete/${code}/${type}`,{method:"DELETE"});
  loadData();
}

function isAdmin(){
  return localStorage.getItem("role")==="admin";
}

/* DOWNLOAD */
function downloadExcel(){
  window.open("/api/download/excel");
}

/* LOGOUT */
function logout(){
  localStorage.clear();
  window.location="/";
}

loadData();