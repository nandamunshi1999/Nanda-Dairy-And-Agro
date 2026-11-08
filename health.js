var eHlthKey = null;
function editHealth(k) {
  var d = farmStore.health[k]; if (!d) return; eHlthKey = k;
  getEl('hlthDate').value = d.date || ''; getEl('hlthCowTag').value = d.cowTag || ''; getEl('hlthType').value = d.type || 'Vaccination';
  getEl('hlthDesc').value = d.desc || ''; getEl('hlthNextDate').value = d.nextDate || '';
  getEl('hlthSubmitBtn').innerText = 'Update Health'; getEl('hlthCancelBtn').style.display = 'inline-flex';
  switchTab('health', document.querySelector('nav button:nth-child(12)'));
}

function cancelHealthEdit() {
  eHlthKey = null; ['hlthCowTag','hlthDesc','hlthNextDate'].forEach(function(i){ getEl(i).value=''; });
  getEl('hlthSubmitBtn').innerText = 'Save Health Record'; getEl('hlthCancelBtn').style.display = 'none';
}

function saveHealth() {
  var tag = (getEl('hlthCowTag').value || '').trim(); if (!tag) return alert('Tag দিন!');
  var data = { date: getEl('hlthDate').value, cowTag: tag, type: getEl('hlthType').value, desc: getEl('hlthDesc').value, nextDate: getEl('hlthNextDate').value };
  if (db) eHlthKey ? db.ref('health/' + eHlthKey).update(data) : db.ref('health').push(data);
  cancelHealthEdit();
}
