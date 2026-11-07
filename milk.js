window.toggleMilkDate = function(safeDt) {
  var row = getEl('milk-det-' + safeDt);
  var btn = getEl('milk-btn-' + safeDt);
  if (row) {
    if (row.style.display === 'none' || !row.style.display) {
      row.style.display = 'table-row';
      if (btn) btn.innerText = 'সংকুচিত করুন ▲';
    } else {
      row.style.display = 'none';
      if (btn) btn.innerText = 'বিস্তারিত দেখুন ▼';
    }
  }
};

function getMilkStatsByTag() {
  var stats = {};
  for (var k in farmStore.milk) {
    var m = farmStore.milk[k];
    var tagKey = (m.cow || '').trim().toUpperCase();
    if (!tagKey) continue;
    if (!stats[tagKey]) stats[tagKey] = { total: 0, daysSet: {} };
    stats[tagKey].total += (Number(m.liters) || 0);
    if (m.date) stats[tagKey].daysSet[m.date] = true;
  }
  var res = {};
  for (var t in stats) {
    res[t] = { total: stats[t].total, days: Object.keys(stats[t].daysSet).length };
  }
  return res;
}

function renderGroupedMilkTable() {
  var body = getEl('milkGroupTableBody');
  if (!body) return;

  var dateGroups = {};
  var totalMilkAll = 0;
  var todayISO = new Date().toISOString().split('T')[0];
  var todayBR = formatDateBR(todayISO);
  var todayTotal = 0;

  for (var k in farmStore.milk) {
    var m = farmStore.milk[k];
    var dt = formatDateBR(m.date) || 'Unknown';
    var lit = Number(m.liters) || 0;
    totalMilkAll += lit;
    if (m.date === todayISO || dt === todayBR) todayTotal += lit;

    if (!dateGroups[dt]) dateGroups[dt] = { date: dt, total: 0, cows: {}, items: [] };
    dateGroups[dt].total += lit;
    if (m.cow) dateGroups[dt].cows[m.cow.trim().toUpperCase()] = true;
    dateGroups[dt].items.push({ key: k, data: m });
  }

  if (getEl('dash-milk-today')) getEl('dash-milk-today').innerText = todayTotal.toFixed(1) + ' L';
  if (getEl('rep-milk')) getEl('rep-milk').innerText = totalMilkAll.toFixed(1);

  var sortedDates = Object.keys(dateGroups).sort(function(a, b) { return parseDateToTime(b) - parseDateToTime(a); });

  if (sortedDates.length === 0) {
    body.innerHTML = '';
    if (getEl('milkNoData')) getEl('milkNoData').style.display = 'block';
    return;
  }
  if (getEl('milkNoData')) getEl('milkNoData').style.display = 'none';

  var html = '';
  sortedDates.forEach(function(dt) {
    var group = dateGroups[dt];
    var safeDt = dt.replace(/[^a-zA-Z0-9]/g, '_');
    var cowCount = Object.keys(group.cows).length;

    html += '<tr style="background:#fff; cursor:pointer;" onclick="toggleMilkDate(\'' + safeDt + '\')">' +
      '<td><strong>📅 ' + dt + '</strong></td>' +
      '<td><strong style="color:var(--primary); font-size:14px;">' + group.total.toFixed(1) + ' L</strong></td>' +
      '<td><span class="badge badge-success">' + cowCount + ' টি গরু</span></td>' +
      '<td>' + group.items.length + ' টি এন্ট্রি</td>' +
      '<td><button class="action-btn btn-info" id="milk-btn-' + safeDt + '" onclick="event.stopPropagation(); toggleMilkDate(\'' + safeDt + '\')">বিস্তারিত দেখুন ▼</button></td>' +
    '</tr>';

    html += '<tr id="milk-det-' + safeDt + '" style="display:none; background:#f4fbf5;">' +
      '<td colspan="5" style="padding:12px 18px;">' +
        '<div style="background:white; border:1px solid #c8e6c9; border-radius:8px; padding:12px;">' +
          '<table style="width:100%; font-size:12px;">' +
            '<thead><tr style="background:#e8f5e9;"><th>গরুর ট্যাগ</th><th>সেশন</th><th>দুধ</th><th>অ্যাকশন</th></tr></thead>' +
            '<tbody>';

    group.items.forEach(function(item) {
      html += '<tr><td><strong>' + (item.data.cow || '-') + '</strong></td><td>' + (item.data.session || '-') + '</td><td><strong>' + (item.data.liters || 0) + ' L</strong></td><td><button class="action-btn btn-info" onclick="editMilk(\'' + item.key + '\')">Edit</button><button class="action-btn btn-danger" onclick="deleteRecord(\'milk\',\'' + item.key + '\')">Delete</button></td></tr>';
    });

    html += '</tbody></table></div></td></tr>';
  });
  body.innerHTML = html;
}

var eMlkKey = null;
function editMilk(k) {
  var d = farmStore.milk[k]; if (!d) return; eMlkKey = k;
  getEl('milkDate').value = d.date || ''; getEl('milkCowTag').value = d.cow || ''; getEl('milkSession').value = d.session || 'Morning'; getEl('milkLiters').value = d.liters || '';
  getEl('milkSubmitBtn').innerText = 'Update Milk'; getEl('milkCancelBtn').style.display = 'inline-flex';
  switchTab('milk', document.querySelector('nav button:nth-child(4)'));
}

function cancelMilkEdit() {
  eMlkKey = null; getEl('milkCowTag').value = ''; getEl('milkLiters').value = '';
  getEl('milkSubmitBtn').innerText = 'Save Milk Record'; getEl('milkCancelBtn').style.display = 'none';
}

function saveMilk() {
  var lit = parseFloat(getEl('milkLiters').value) || 0; if (!lit) return alert('দুধের পরিমাণ দিন!');
  var cowTag = (getEl('milkCowTag').value || '').trim(); if (!cowTag) return alert('Tag ID দিন!');
  var data = { date: getEl('milkDate').value, cow: cowTag, session: getEl('milkSession').value, liters: lit };
  if (db) eMlkKey ? db.ref('milk/' + eMlkKey).update(data) : db.ref('milk').push(data);
  cancelMilkEdit();
}
