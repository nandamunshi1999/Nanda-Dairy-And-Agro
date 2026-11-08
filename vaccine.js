// ==========================================
// NANDA DAIRY & AGRO - ADVANCED VACCINATION MODULE
// ==========================================

var eVacKey = null;

// গরুর ট্যাগ সিলেক্ট করলে গর্ভকালীন সেফটি ও অটো ডোজ চেক করা
function onVaccineTagChange() {
  var tag = (getEl('vacCowTag').value || '').trim();
  if (!tag) return;
  var cow = farmStore.cattle ? farmStore.cattle[tag] : null;
  
  var alertBox = getEl('vacSafetyAlertBox');
  if (!alertBox) {
    alertBox = document.createElement('div');
    alertBox.id = 'vacSafetyAlertBox';
    var formGrid = document.querySelector('#tab-vaccine .form-grid');
    if (formGrid) formGrid.parentNode.insertBefore(alertBox, formGrid.nextSibling);
  }

  if (cow && (cow.status === 'Pregnant' || (cow.status || '').toLowerCase() === 'pregnant')) {
    alertBox.innerHTML = '<div style="background:#ffebee; color:#c62828; padding:10px; border-radius:8px; border:1px solid #ef9a9a; margin-bottom:12px; font-weight:bold;">⚠️ সতর্কবার্তা (Pregnancy Warning): নির্বাচিত গাভীটি গর্ভবতী (Pregnant)! লাইভ বা অ্যাটেনুয়েটেড ভ্যাকসিন দেওয়ার পূর্বে ভেটেরিনারি চিকিৎসকের পরামর্শ নিন।</div>';
  } else {
    alertBox.innerHTML = '<div style="background:#e8f5e9; color:#2e7d32; padding:8px; border-radius:6px; margin-bottom:12px; font-size:12.5px;">✔ গাভীর স্বাস্থ্যগত অবস্থা স্বাভাবিক রয়েছে। টিকাদানের জন্য উপযোগী।</div>';
  }
}

// প্রিসেট ভ্যাকসিন ও অটো বুস্টার ডোজ শিডিউল ক্যালকুলেটর
function onVaccineTypeSelect() {
  var vacName = getEl('vacName').value;
  var dtVal = getEl('vacDate').value;
  
  // অটো ডোজ এবং রুট সাজেস্ট করা
  if (vacName.includes('FMD')) {
    if(getEl('vacDose')) getEl('vacDose').value = '5.0';
    if(getEl('vacRoute')) getEl('vacRoute').value = 'Subcutaneous (S/C)';
  } else if (vacName.includes('BQ') || vacName.includes('HS')) {
    if(getEl('vacDose')) getEl('vacDose').value = '3.0';
    if(getEl('vacRoute')) getEl('vacRoute').value = 'Intramuscular (I/M)';
  }

  // বুস্টার ডোজ বা পরবর্তী ডোজ অটো ক্যালকুলেশন (যেমন: ২৮ দিন পর)
  if (dtVal) {
    var d = new Date(dtVal);
    d.setDate(d.getDate() + 28); // আদর্শ বুস্টার গ্যাপ ২৮ দিন
    getEl('vacNextDate').value = d.toISOString().split('T')[0];
    
    // উইথড্রয়াল পিরিয়ড অটো সেট (যেমন: ৭ দিন মিল্ক উইথড্রয়াল)
    if(getEl('vacWithdrawalDays')) getEl('vacWithdrawalDays').value = '7';
  }
}

function editVaccineRecord(k) {
  var d = farmStore.vaccine ? farmStore.vaccine[k] : null; if (!d) return; eVacKey = k;
  getEl('vacCowTag').value = d.tag || '';
  getEl('vacName').value = d.name || '';
  getEl('vacDate').value = d.date || '';
  getEl('vacNextDate').value = d.nextDate || '';
  getEl('vacCost').value = d.cost || '';
  
  if(getEl('vacDose')) getEl('vacDose').value = d.dose || '5.0';
  if(getEl('vacRoute')) getEl('vacRoute').value = d.route || 'Subcutaneous (S/C)';
  if(getEl('vacBatchNo')) getEl('vacBatchNo').value = d.batchNo || '';
  if(getEl('vacExpiry')) getEl('vacExpiry').value = d.expiry || '';
  if(getEl('vacWithdrawalDays')) getEl('vacWithdrawalDays').value = d.withdrawalDays || '0';

  getEl('vacSubmitBtn').innerText = 'Update Vaccine Record';
  getEl('vacCancelBtn').style.display = 'inline-flex';
  switchTab('vaccine', document.querySelector('nav button:nth-last-child(2)'));
  onVaccineTagChange();
}

function cancelVaccineEdit() {
  eVacKey = null;
  ['vacCowTag','vacName','vacDate','vacNextDate','vacCost','vacDose','vacBatchNo','vacExpiry','vacWithdrawalDays'].forEach(function(i){ if(getEl(i)) getEl(i).value=''; });
  getEl('vacSubmitBtn').innerText = 'Save Vaccine Record';
  getEl('vacCancelBtn').style.display = 'none';
  var alertBox = getEl('vacSafetyAlertBox'); if(alertBox) alertBox.innerHTML = '';
}

function saveVaccineRecord() {
  var tag = (getEl('vacCowTag').value || '').trim();
  var name = (getEl('vacName').value || '').trim();
  var dt = getEl('vacDate').value;
  if (!tag || !name || !dt) return alert('Tag, ভ্যাকসিনের নাম ও তারিখ দিন!');

  var cost = parseFloat(getEl('vacCost').value) || 0;
  var dose = parseFloat(getEl('vacDose') ? getEl('vacDose').value : 5) || 5;

  var data = {
    tag: tag,
    name: name,
    date: dt,
    nextDate: getEl('vacNextDate').value,
    cost: cost,
    dose: dose,
    route: getEl('vacRoute') ? getEl('vacRoute').value : 'Subcutaneous',
    batchNo: getEl('vacBatchNo') ? getEl('vacBatchNo').value : '',
    expiry: getEl('vacExpiry') ? getEl('vacExpiry').value : '',
    withdrawalDays: parseInt(getEl('vacWithdrawalDays') ? getEl('vacWithdrawalDays').value : 0) || 0
  };

  if (db) {
    if (eVacKey) {
      db.ref('vaccine/' + eVacKey).update(data);
    } else {
      db.ref('vaccine').push(data);

      // ৩. খরচ সরাসরি ফার্মের Expenses লেজারে যুক্ত করা
      if (cost > 0) {
        db.ref('expenses').push({
          date: dt,
          category: 'Medicine & Health',
          title: 'Vaccine Expense (' + name + ') - Tag: ' + tag,
          amount: cost
        });
      }
    }
  }
  cancelVaccineEdit();
  renderVaccineTable();
}

// ৫. ডিজিটাল হেলথ পাসপোর্ট ও পাসবুক প্রিন্ট জেনারেটর
window.showDigitalHealthPassport = function(encTag) {
  var tag = decodeURIComponent(encTag).trim();
  var cow = farmStore.cattle ? farmStore.cattle[tag] : null;
  
  var historyHtml = '<div style="font-family:sans-serif; padding:15px;" id="passportPrintArea">';
  historyHtml += '<div style="text-align:center; border-bottom:2px solid #1b5e20; padding-bottom:10px; margin-bottom:15px;">';
  historyHtml += '<h2 style="color:#1b5e20; margin:0;">NANDA DAIRY & AGRO</h2>';
  historyHtml += '<p style="font-size:13px; font-weight:bold; margin:3px 0;">Digital Health Passport & Vaccination Passbook</p>';
  historyHtml += '</div>';

  historyHtml += '<div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:15px; background:#f1f8e9; padding:10px; border-radius:6px;">';
  historyHtml += '<div><strong>Cattle Tag ID:</strong> ' + tag + '<br><strong>Breed:</strong> ' + (cow ? cow.breed : 'N/A') + '</div>';
  historyHtml += '<div><strong>Status:</strong> ' + (cow ? cow.status : 'N/A') + '<br><strong>Lactation:</strong> ' + (cow ? cow.lactation : 'N/A') + '</div>';
  historyHtml += '</div>';

  historyHtml += '<h3 style="font-size:14px; color:#1b5e20; border-bottom:1px solid #ddd; padding-bottom:4px;">সকল টিকাদানের ইতিহাস (Vaccination History):</h3>';
  historyHtml += '<table style="width:100%; border-collapse:collapse; font-size:12px; margin-top:8px;">';
  historyHtml += '<tr style="background:#e8f5e9;"><th style="border:1px solid #c8e6c9; padding:6px;">তারিখ</th><th style="border:1px solid #c8e6c9; padding:6px;">ভ্যাকসিনের নাম</th><th style="border:1px solid #c8e6c9; padding:6px;">ডোজ ও রুট</th><th style="border:1px solid #c8e6c9; padding:6px;">ব্যাচ ও মেয়াদ</th><th style="border:1px solid #c8e6c9; padding:6px;">পরবর্তী ডোজ</th></tr>';

  var count = 0;
  for (var k in farmStore.vaccine) {
    var v = farmStore.vaccine[k];
    if (v && (v.tag || '').trim().toLowerCase() === tag.toLowerCase()) {
      count++;
      historyHtml += '<tr>';
      historyHtml += '<td style="border:1px solid #c8e6c9; padding:6px;">' + formatDateBR(v.date) + '</td>';
      historyHtml += '<td style="border:1px solid #c8e6c9; padding:6px;"><strong>' + v.name + '</strong></td>';
      historyHtml += '<td style="border:1px solid #c8e6c9; padding:6px;">' + (v.dose || 5) + ' mL (' + (v.route || 'S/C') + ')</td>';
      historyHtml += '<td style="border:1px solid #c8e6c9; padding:6px;">' + (v.batchNo || '-') + '</td>';
      historyHtml += '<td style="border:1px solid #c8e6c9; padding:6px; color:red;">' + formatDateBR(v.nextDate) + '</td>';
      historyHtml += '</tr>';
    }
  }

  if (count === 0) {
    historyHtml += '<tr><td colspan="5" style="text-align:center; padding:10px; color:#777;">কোনো টিকা রেকর্ড পাওয়া যায়নি।</td></tr>';
  }
  historyHtml += '</table>';
  historyHtml += '<div style="margin-top:30px; text-align:right; font-size:12px;"><p>Authorized Signatory</p><p><strong>Nanda Dairy & Agro</strong></p></div>';
  historyHtml += '</div>';

  // মোডাল তৈরি বা পপআপ দেখানো
  var modal = getEl('digitalPassportModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'digitalPassportModal';
    modal.style.cssText = "display:flex; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:3000; align-items:center; justify-content:center; padding:15px;";
    modal.innerHTML = '<div style="background:white; max-width:700px; width:100%; border-radius:12px; padding:25px; max-height:90vh; overflow-y:auto;"><div id="passportContent"></div><div style="text-align:right; margin-top:15px;"><button class="btn btn-info" onclick="window.print()">🖨️ প্রিন্ট করুন</button> <button class="btn btn-danger" onclick="document.getElementById(\'digitalPassportModal\').style.display=\'none\'">বন্ধ করুন</button></div></div>';
    document.body.appendChild(modal);
  }
  getEl('passportContent').innerHTML = historyHtml;
  modal.style.display = 'flex';
};

// ১. ড্যাশবোর্ড স্মার্ট অ্যালার্ট সিস্টেম
function checkDueVaccinationsAlert() {
  var todayISO = new Date().toISOString().split('T')[0];
  var dueList = [];

  for (var k in farmStore.vaccine) {
    var v = farmStore.vaccine[k];
    if (v && v.nextDate && v.nextDate <= todayISO) {
      dueList.push(v);
    }
  }

  if (dueList.length > 0) {
    var alertBanner = getEl('dashVaccineAlertBanner');
    if (!alertBanner) {
      alertBanner = document.createElement('div');
      alertBanner.id = 'dashVaccineAlertBanner';
      alertBanner.style.cssText = "background:#fff3e0; border-left:5px solid #e65100; padding:12px 18px; border-radius:8px; margin-bottom:18px; font-size:13.5px;";
      var dashTab = getEl('tab-dashboard');
      if (dashTab) dashTab.insertBefore(alertBanner, dashTab.firstChild);
    }
    var html = '<strong style="color:#e65100; font-size:14px;">🔔 স্মার্ট অ্যালার্ট: আজ বা তার পূর্বে টিকাদানের সময় হয়েছে এমন ' + dueList.length + 'টি শিডিউল বাকি রয়েছে!</strong><ul style="margin:5px 0 0 20px; font-size:12.5px;">';
    dueList.slice(0, 3).forEach(function(item) {
      html += '<li>ট্যাগ ID: <strong>' + item.tag + '</strong> — টিকা: ' + item.name + ' (নির্ধারিত তারিখ: ' + formatDateBR(item.nextDate) + ')</li>';
    });
    html += '</ul>';
    alertBanner.innerHTML = html;
  }
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
    body.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#777;">কোনো টিকা রেকর্ড নেই।</td></tr>';
    checkDueVaccinationsAlert();
    return;
  }

  var html = '';
  list.forEach(function(item) {
    var k = item.key, d = item.data;
    html += '<tr>' +
      '<td><strong>' + (d.tag || '-') + '</strong></td>' +
      '<td>' + (d.name || '-') + '<br><small style="color:#555;">ব্যাচ: ' + (d.batchNo || '-') + '</small></td>' +
      '<td>' + (d.dose || 5) + ' mL<br><small style="color:#0288d1;">' + (d.route || 'S/C') + '</small></td>' +
      '<td>' + formatDateBR(d.date) + '</td>' +
      '<td style="color:red; font-weight:bold;">' + formatDateBR(d.nextDate) + '</td>' +
      '<td>₹ ' + (d.cost || 0) + '</td>' +
      '<td><button class="action-btn" style="background:#455a64; color:white; padding:3px 7px; font-size:11px;" onclick="showDigitalHealthPassport(\'' + encodeURIComponent(d.tag) + '\')"> পাসবুক</button></td>' +
      '<td>' +
        '<button class="action-btn btn-info" onclick="editVaccineRecord(\'' + k + '\')">Edit</button>' +
        '<button class="action-btn btn-danger" onclick="deleteRecord(\'vaccine\',\'' + k + '\')">Delete</button>' +
      '</td>' +
    '</tr>';
  });
  body.innerHTML = html;
  checkDueVaccinationsAlert();
}
