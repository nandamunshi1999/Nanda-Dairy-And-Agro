var eVacKey = null;

function editVaccineRecord(k) {
  var d = farmStore.vaccine ? farmStore.vaccine[k] : null; if (!d) return; eVacKey = k;
  getEl('vacCowTag').value = d.tag || '';
  getEl('vacName').value = d.name || '';
  getEl('vacDate').value = d.date || '';
  getEl('vacNextDate').value = d.nextDate || '';
  getEl('vacCost').value = d.cost || '';
  getEl('vacSubmitBtn').innerText = 'Update Vaccine Record';
  getEl('vacCancelBtn').style.display = 'inline-flex';
  switchTab('vaccine', document.querySelector('nav button:nth-last-child(2)'));
}

function cancelVaccineEdit() {
  eVacKey = null;
  ['vacCowTag','vacName','vacDate','vacNextDate','vacCost'].forEach(function(i){ if(getEl(i)) getEl(i).value=''; });
  getEl('vacSubmitBtn').innerText = 'Save Vaccine Record';
  getEl('vacCancelBtn').style.display = 'none';
}

function saveVaccineRecord() {
  var tag = (getEl('vacCowTag').value || '').trim();
  var name = (getEl('vacName').value || '').trim();
  var dt = getEl('vacDate').value;
  if (!tag || !name || !dt) return alert('Tag, ভ্যাকসিনের নাম ও তারিখ দিন!');

  var data = {
    tag: tag,
    name: name,
    date: dt,
    nextDate: getEl('vacNextDate').value,
    cost: parseFloat(getEl('vacCost').value) || 0
  };

  if (db) {
    if (eVacKey) {
      db.ref('vaccine/' + eVacKey).update(data);
    } else {
      db.ref('vaccine').push(data);
    }
  }
  cancelVaccineEdit();
}

function renderVaccineTable() {
  var body = getEl('vaccineTableBody');
  if (!body) return;
  var list = [];
  for (var k in farmStore.vaccine) {
    list.push({ key: k, data: farmStore.vaccine[k] });
  }
  list.sort(function(a, b) { return (b.data.date || '').localeCompare(a.data.date || ''); });

  if (list.length === 0) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#777;">কোনো টিকা রেকর্ড নেই।</td></tr>';
    return;
  }

  var html = '';
  list.forEach(function(item) {
    var k = item.key, d = item.data;
    html += '<tr>' +
      '<td><strong>' + (d.tag || '-') + '</strong></td>' +
      '<td>' + (d.name || '-') + '</td>' +
      '<td>' + formatDateBR(d.date) + '</td>' +
      '<td style="color:red; font-weight:bold;">' + formatDateBR(d.nextDate) + '</td>' +
      '<td>₹ ' + (d.cost || 0) + '</td>' +
      '<td>' +
        '<button class="action-btn btn-info" onclick="editVaccineRecord(\'' + k + '\')">Edit</button>' +
        '<button class="action-btn btn-danger" onclick="deleteRecord(\'vaccine\',\'' + k + '\')">Delete</button>' +
      '</td>' +
    '</tr>';
  });
  body.innerHTML = html;
}
