function autoCalcExpectedCalving() {
  var aiVal = getEl('insAiDate').value;
  if (aiVal) {
    var d = new Date(aiVal);
    d.setDate(d.getDate() + 280);
    getEl('insExpCalvingDate').value = d.toISOString().split('T')[0];
  }
}

var eInsKey = null;

function editInseminationRecord(k) {
  var d = farmStore.insemination ? farmStore.insemination[k] : null; if (!d) return; eInsKey = k;
  getEl('insCowTag').value = d.tag || '';
  getEl('insAiDate').value = d.aiDate || '';
  getEl('insSemenId').value = d.semenId || '';
  getEl('insCompany').value = d.company || '';
  getEl('insAiCost').value = d.aiCost || '';
  getEl('insPdDate').value = d.pdDate || '';
  getEl('insStatus').value = d.status || 'Pending';
  getEl('insExpCalvingDate').value = d.expCalvingDate || '';
  getEl('insActCalvingDate').value = d.actCalvingDate || '';
  getEl('insSubmitBtn').innerText = 'Update Insemination';
  getEl('insCancelBtn').style.display = 'inline-flex';
  switchTab('insemination', document.querySelector('nav button:nth-last-child(3)'));
}

function cancelInseminationEdit() {
  eInsKey = null;
  ['insCowTag','insSemenId','insCompany','insAiCost','insPdDate','insExpCalvingDate','insActCalvingDate'].forEach(function(id){ if(getEl(id)) getEl(id).value=''; });
  getEl('insStatus').value = 'Pending';
  getEl('insSubmitBtn').innerText = 'Save Insemination Record';
  getEl('insCancelBtn').style.display = 'none';
}

function saveInseminationRecord() {
  var tag = (getEl('insCowTag').value || '').trim();
  var aiDt = getEl('insAiDate').value;
  if (!tag || !aiDt) return alert('Cattle ID এবং AI Date দিন!');

  var data = {
    tag: tag,
    aiDate: aiDt,
    semenId: getEl('insSemenId').value,
    company: getEl('insCompany').value,
    aiCost: parseFloat(getEl('insAiCost').value) || 0,
    pdDate: getEl('insPdDate').value,
    status: getEl('insStatus').value,
    expCalvingDate: getEl('insExpCalvingDate').value,
    actCalvingDate: getEl('insActCalvingDate').value
  };

  if (db) {
    if (eInsKey) {
      db.ref('insemination/' + eInsKey).update(data);
    } else {
      db.ref('insemination').push(data);
    }
  }
  cancelInseminationEdit();
}

function renderInseminationTable() {
  var body = getEl('inseminationTableBody');
  if (!body) return;
  var list = [];
  for (var k in farmStore.insemination) {
    list.push({ key: k, data: farmStore.insemination[k] });
  }
  list.sort(function(a, b) { return (b.data.aiDate || '').localeCompare(a.data.aiDate || ''); });

  if (list.length === 0) {
    body.innerHTML = '<tr><td colspan="10" style="text-align:center; color:#777;">কোনো ইনসেমিনেশন রেকর্ড নেই।</td></tr>';
    return;
  }

  var html = '';
  list.forEach(function(item) {
    var k = item.key, d = item.data;
    var badgeClass = d.status === 'Pregnant' ? 'badge-success' : (d.status === 'Failed' ? 'badge-danger' : 'badge-warning');
    html += '<tr>' +
      '<td><strong>' + (d.tag || '-') + '</strong></td>' +
      '<td>' + formatDateBR(d.aiDate) + '</td>' +
      '<td>' + (d.semenId || '-') + '</td>' +
      '<td>' + (d.company || '-') + '</td>' +
      '<td>₹ ' + (d.aiCost || 0) + '</td>' +
      '<td>' + formatDateBR(d.pdDate) + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + (d.status || 'Pending') + '</span></td>' +
      '<td>' + formatDateBR(d.expCalvingDate) + '</td>' +
      '<td>' + formatDateBR(d.actCalvingDate) + '</td>' +
      '<td>' +
        '<button class="action-btn btn-info" onclick="editInseminationRecord(\'' + k + '\')">Edit</button>' +
        '<button class="action-btn btn-danger" onclick="deleteRecord(\'insemination\',\'' + k + '\')">Delete</button>' +
      '</td>' +
    '</tr>';
  });
  body.innerHTML = html;
}
