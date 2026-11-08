var eDewKey = null;

function editDewormRecord(k) {
  var d = farmStore.deworm ? farmStore.deworm[k] : null; if (!d) return; eDewKey = k;
  getEl('dewCowTag').value = d.tag || '';
  getEl('dewMedName').value = d.medName || '';
  getEl('dewDate').value = d.date || '';
  getEl('dewNextDate').value = d.nextDate || '';
  getEl('dewDosage').value = d.dosage || '';
  getEl('dewSubmitBtn').innerText = 'Update Deworm Record';
  getEl('dewCancelBtn').style.display = 'inline-flex';
  switchTab('deworm', document.querySelector('nav button:nth-last-child(1)'));
}

function cancelDewormEdit() {
  eDewKey = null;
  ['dewCowTag','dewMedName','dewDate','dewNextDate','dewDosage'].forEach(function(i){ if(getEl(i)) getEl(i).value=''; });
  getEl('dewSubmitBtn').innerText = 'Save Deworming Record';
  getEl('dewCancelBtn').style.display = 'none';
}

function saveDewormRecord() {
  var tag = (getEl('dewCowTag').value || '').trim();
  var med = (getEl('dewMedName').value || '').trim();
  var dt = getEl('dewDate').value;
  if (!tag || !med || !dt) return alert('Tag, ঔষধের নাম ও তারিখ দিন!');

  var data = {
    tag: tag,
    medName: med,
    date: dt,
    nextDate: getEl('dewNextDate').value,
    dosage: getEl('dewDosage'].value || ''
  };

  if (db) {
    if (eDewKey) {
      db.ref('deworm/' + eDewKey).update(data);
    } else {
      db.ref('deworm').push(data);
    }
  }
  cancelDewormEdit();
}

function renderDewormTable() {
  var body = getEl('dewormTableBody');
  if (!body) return;
  var list = [];
  for (var k in farmStore.deworm) {
    list.push({ key: k, data: farmStore.deworm[k] });
  }
  list.sort(function(a, b) { return (b.data.date || '').localeCompare(a.data.date || ''); });

  if (list.length === 0) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#777;">কোনো কৃমির ওষুধ রেকর্ড নেই।</td></tr>';
    return;
  }

  var html = '';
  list.forEach(function(item) {
    var k = item.key, d = item.data;
    html += '<tr>' +
      '<td><strong>' + (d.tag || '-') + '</strong></td>' +
      '<td>' + (d.medName || '-') + '</td>' +
      '<td>' + formatDateBR(d.date) + '</td>' +
      '<td style="color:red; font-weight:bold;">' + formatDateBR(d.nextDate) + '</td>' +
      '<td>' + (d.dosage || '-') + '</td>' +
      '<td>' +
        '<button class="action-btn btn-info" onclick="editDewormRecord(\'' + k + '\')">Edit</button>' +
        '<button class="action-btn btn-danger" onclick="deleteRecord(\'deworm\',\'' + k + '\')">Delete</button>' +
      '</td>' +
    '</tr>';
  });
  body.innerHTML = html;
}
