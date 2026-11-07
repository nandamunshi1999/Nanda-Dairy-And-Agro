function autoCalcExpectedCalving() {
  var aiVal = getEl('brAiDate').value;
  if (aiVal) {
    var d = new Date(aiVal);
    d.setDate(d.getDate() + 280);
    getEl('brExpCalvingDate').value = d.toISOString().split('T')[0];
  }
}

var eBrKey = null;
function editBreeding(k) {
  var d = farmStore.breeding[k]; if (!d) return; eBrKey = k;
  getEl('brCowTag').value = d.tag || ''; getEl('brAiDate').value = d.aiDate || ''; getEl('brSemenId').value = d.semenId || '';
  getEl('brCompany').value = d.company || ''; getEl('brAiCost').value = d.aiCost || ''; getEl('brPdDate').value = d.pdDate || '';
  getEl('brStatus').value = d.status || 'Pending'; getEl('brExpCalvingDate').value = d.expCalvingDate || d.calvingDate || ''; getEl('brActCalvingDate').value = d.actCalvingDate || '';
  getEl('brSubmitBtn').innerText = 'Update Breeding'; getEl('brCancelBtn').style.display = 'inline-flex';
  switchTab('breeding', document.querySelector('nav button:nth-child(3)'));
}

function cancelBreedingEdit() {
  eBrKey = null; ['brCowTag','brSemenId','brCompany','brAiCost','brPdDate','brExpCalvingDate','brActCalvingDate'].forEach(function(id){ if(getEl(id)) getEl(id).value=''; });
  getEl('brStatus').value = 'Pending'; getEl('brSubmitBtn').innerText = 'Save Breeding Record'; getEl('brCancelBtn').style.display = 'none';
}

function saveBreeding() {
  var tag = (getEl('brCowTag').value || '').trim(); if (!tag) return alert('Cattle ID দিন!');
  var data = { tag: tag, aiDate: getEl('brAiDate').value, semenId: getEl('brSemenId').value, company: getEl('brCompany').value, aiCost: parseFloat(getEl('brAiCost').value)||0, pdDate: getEl('brPdDate').value, status: getEl('brStatus').value, expCalvingDate: getEl('brExpCalvingDate').value, actCalvingDate: getEl('brActCalvingDate').value };
  if (db) eBrKey ? db.ref('breeding/' + eBrKey).update(data) : db.ref('breeding').push(data);
  cancelBreedingEdit();
}
