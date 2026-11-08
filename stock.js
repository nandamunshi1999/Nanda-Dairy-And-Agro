function renderStockAutocomplete() {
  var stockDL = getEl('stockItemList');
  if (!stockDL) return;
  var optHtml = '';
  for (var k in farmStore.stock) {
    var sName = farmStore.stock[k].name;
    if (sName) {
      optHtml += '<option value="' + sName + '">';
    }
  }
  stockDL.innerHTML = optHtml;
  updateStockLabels();
}

function updateStockLabels() {
  var stockMap = {};
  for (var sk in farmStore.stock) {
    var st = farmStore.stock[sk];
    if (st && st.name) {
      stockMap[st.name.trim().toLowerCase()] = Number(st.qty) || 0;
    }
  }

  ['Cattle Feed', 'Wheat Bran', 'Corn', 'Oilcake'].forEach(function(item) {
    var qty = 0;
    for (var sName in stockMap) {
      if (sName.includes(item.toLowerCase()) || item.toLowerCase().includes(sName)) {
        qty = stockMap[sName];
        break;
      }
    }
    var lbl = document.getElementById('stkLbl-' + item);
    if (lbl) lbl.innerText = qty;
  });
}

var eStkKey = null;
function editStock(k) {
  var d = farmStore.stock[k]; if (!d) return; eStkKey = k;
  getEl('stkName').value = d.name || ''; getEl('stkQty').value = d.qty || ''; getEl('stkUnit').value = d.unit || 'kg'; getEl('stkAlert').value = d.alertLevel || '';
  getEl('stkSubmitBtn').innerText = 'Update Stock'; getEl('stkCancelBtn').style.display = 'inline-flex';
  switchTab('stock', document.querySelector('nav button:nth-child(10)'));
}

function cancelStockEdit() {
  eStkKey = null; getEl('stkName').value = ''; getEl('stkQty').value = ''; getEl('stkAlert').value = '';
  getEl('stkSubmitBtn').innerText = 'Save Stock'; getEl('stkCancelBtn').style.display = 'none';
}

function saveStock() {
  var name = (getEl('stkName').value || '').trim(); if (!name) return alert('নাম দিন!');
  var data = { name: name, qty: parseFloat(getEl('stkQty').value)||0, unit: getEl('stkUnit').value, alertLevel: parseFloat(getEl('stkAlert').value)||0 };
  if (db) eStkKey ? db.ref('stock/' + eStkKey).update(data) : db.ref('stock').push(data);
  cancelStockEdit();
}
