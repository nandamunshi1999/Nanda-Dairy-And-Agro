var eCustKey = null;
function editCustomer(k) {
  var d = farmStore.customers[k]; if (!d) return; eCustKey = k;
  getEl('custName').value = d.name || ''; getEl('custPhone').value = d.phone || ''; getEl('custArea').value = d.area || '';
  getEl('custAddress').value = d.addr || ''; getEl('custDailyDemand').value = d.demand || '';
  if (getEl('custOpeningDue')) getEl('custOpeningDue').value = d.openingDue || 0;
  if (getEl('custType')) getEl('custType').value = d.type || 'Regular Retailer';
  if (getEl('custShift')) getEl('custShift').value = d.shift || 'Morning';
  getEl('custSubmitBtn').innerText = 'Update Customer'; getEl('custCancelBtn').style.display = 'inline-flex';
  switchTab('customers', document.querySelector('nav button:nth-child(6)'));
}

function cancelCustomerEdit() {
  eCustKey = null; ['custName','custPhone','custArea','custAddress','custDailyDemand','custOpeningDue'].forEach(function(i){ if(getEl(i)) getEl(i).value=''; });
  getEl('custSubmitBtn').innerText = 'Save Customer'; getEl('custCancelBtn').style.display = 'none';
}

function saveCustomer() {
  var name = (getEl('custName').value || '').trim(); if (!name) return alert('নাম দিন!');
  var data = { name: name, phone: (getEl('custPhone').value || '').trim(), area: (getEl('custArea').value || '').trim(), addr: (getEl('custAddress').value || '').trim(), demand: parseFloat(getEl('custDailyDemand').value)||0, openingDue: parseFloat(getEl('custOpeningDue')?.value)||0, type: getEl('custType')?.value||'Regular Retailer', shift: getEl('custShift')?.value||'Morning' };
  if (db) eCustKey ? db.ref('customers/' + eCustKey).update(data) : db.ref('customers').push(data);
  cancelCustomerEdit();
}
