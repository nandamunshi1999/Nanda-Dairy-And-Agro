var eSemKey = null;
function editSemen(k) {
  var d = farmStore.semen[k]; if (!d) return; eSemKey = k;
  getEl('semBatch').value = d.batch || ''; getEl('semBreed').value = d.breed || ''; getEl('semSource').value = d.source || ''; getEl('semCount').value = d.count || '';
  getEl('semSubmitBtn').innerText = 'Update Semen'; getEl('semCancelBtn').style.display = 'inline-flex';
  switchTab('semen', document.querySelector('nav button:nth-child(11)'));
}

function cancelSemenEdit() {
  eSemKey = null; ['semBatch','semBreed','semSource','semCount'].forEach(function(i){ getEl(i).value=''; });
  getEl('semSubmitBtn').innerText = 'Save Semen Stock'; getEl('semCancelBtn').style.display = 'none';
}

function saveSemen() {
  var b = (getEl('semBatch').value || '').trim(); if (!b) return alert('Batch দিন!');
  var data = { batch: b, breed: getEl('semBreed').value, source: getEl('semSource').value, count: parseFloat(getEl('semCount').value)||0 };
  if (db) eSemKey ? db.ref('semen/' + eSemKey).update(data) : db.ref('semen').push(data);
  cancelSemenEdit();
}
