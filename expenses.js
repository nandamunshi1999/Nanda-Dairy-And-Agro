window.toggleExpenseDate = function(safeDt) {
  var row = getEl('exp-det-' + safeDt); var btn = getEl('exp-btn-' + safeDt);
  if (row) {
    if (row.style.display === 'none' || !row.style.display) { row.style.display = 'table-row'; if(btn) btn.innerText = 'সংকুচিত করুন ▲'; }
    else { row.style.display = 'none'; if(btn) btn.innerText = 'বিস্তারিত দেখুন ▼'; }
  }
};

var eExpKey = null;
function editExpense(k) {
  var d = farmStore.expenses[k]; if (!d) return; eExpKey = k;
  getEl('expDate').value = d.date || ''; getEl('expCategory').value = d.category || 'Other';
  getEl('expTitle').value = d.title || ''; getEl('expAmount').value = d.amount || '';
  getEl('expSubmitBtn').innerText = 'Update Expense'; getEl('expCancelBtn').style.display = 'inline-flex';
  switchTab('expenses', document.querySelector('nav button:nth-child(9)'));
}

function cancelExpenseEdit() {
  eExpKey = null; getEl('expTitle').value = ''; getEl('expAmount').value = '';
  getEl('expSubmitBtn').innerText = 'Save Expense'; getEl('expCancelBtn').style.display = 'none';
}

function saveExpense() {
  var title = (getEl('expTitle').value || '').trim(), amt = parseFloat(getEl('expAmount').value)||0, dt = getEl('expDate').value;
  if (!title || !amt || !dt) return alert('সকল তথ্য দিন!');
  var data = { date: dt, category: getEl('expCategory').value, title: title, amount: amt };
  if (db) eExpKey ? db.ref('expenses/' + eExpKey).update(data) : db.ref('expenses').push(data);
  cancelExpenseEdit();
}
