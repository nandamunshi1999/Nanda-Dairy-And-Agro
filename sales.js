function onSaleCustomerInput() {
  var val = (getEl('saleCustomer').value || '').trim().toLowerCase();
  if (!val) return;
  for (var k in farmStore.customers) {
    var c = farmStore.customers[k];
    if ((c.name || '').trim().toLowerCase() === val) {
      if (c.phone) getEl('salePhone').value = c.phone;
      if (c.area) getEl('saleArea').value = c.area;
      if (c.addr) getEl('saleAddr').value = c.addr;
      break;
    }
  }
}

function getCustomerLiveBalances() {
  var map = {};
  var now = new Date();
  var todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (var ck in farmStore.customers) {
    var cust = farmStore.customers[ck];
    if (!cust || !cust.name) continue;
    var cName = cust.name.trim();
    var cKey = cName.toLowerCase();
    var opDue = Number(cust.openingDue) || 0;

    if (!map[cKey]) {
      map[cKey] = { totalBilled: opDue, totalPaid: 0, currentDue: opDue, lastPaymentTime: 0, earliestBillTime: opDue > 0 ? todayTime : Infinity, phone: cust.phone || '', area: cust.area || '', addr: cust.addr || '' };
    }
  }

  for (var k in farmStore.sales) {
    var s = farmStore.sales[k];
    if (!s) continue;
    var cName = (s.name || '').trim();
    if (!cName) continue;
    var cKey = cName.toLowerCase();
    if (!map[cKey]) {
      map[cKey] = { totalBilled: 0, totalPaid: 0, currentDue: 0, lastPaymentTime: 0, earliestBillTime: Infinity, phone: '', area: '', addr: '' };
    }
    if (s.phone) map[cKey].phone = s.phone;
    if (s.area) map[cKey].area = s.area;
    if (s.addr) map[cKey].addr = s.addr;

    var bTot = Number(s.total) || (parseFloat(s.qty || 1) * parseFloat(s.rate || 0)) || 0;
    var bPaid = Number(s.paid) || 0;
    var billTime = parseDateToTime(s.date);

    if (bTot > 0 && !s.isPayment) {
      map[cKey].totalBilled += bTot;
      if (billTime && billTime < map[cKey].earliestBillTime) {
        map[cKey].earliestBillTime = billTime;
      }
    }

    var pList = getPaymentsArray(s.payments);
    if (pList.length > 0) {
      var subsequentSum = 0;
      pList.forEach(function(p) {
        var pAmt = Number(p.amount) || 0;
        subsequentSum += pAmt;
      });
      map[cKey].totalPaid += subsequentSum;
      var initialPaid = Math.max(0, bPaid - subsequentSum);
      map[cKey].totalPaid += initialPaid;
    } else {
      map[cKey].totalPaid += bPaid;
    }
  }

  for (var key in map) {
    var c = map[key];
    c.currentDue = Math.max(0, c.totalBilled - c.totalPaid);
  }
  return map;
}

function renderSalesTable() {
  var body = getEl('salesTableBody');
  if (!body) return;

  var custBalances = getCustomerLiveBalances();
  var searchQ = (getEl('saleSearchInput') ? getEl('saleSearchInput').value : '').trim().toLowerCase();
  var areaFilter = (getEl('saleAreaFilter') ? getEl('saleAreaFilter').value : '').trim().toLowerCase();

  var tS = 0;
  var uniqueAreas = {};
  var groupedMap = {};

  for (var k in farmStore.sales) {
    var s = farmStore.sales[k];
    if (!s || (s.isPayment && Number(s.total) === 0)) continue;
    tS += Number(s.total) || 0;
    if (s.area) uniqueAreas[s.area.trim()] = true;

    var rawName = (s.name || '').trim();
    if (!rawName) continue;
    var rawDate = (s.date || '').trim();
    var groupKey = rawDate + '_' + rawName.toLowerCase();

    if (!groupedMap[groupKey]) {
      groupedMap[groupKey] = {
        date: rawDate,
        name: rawName,
        phone: s.phone || '',
        area: s.area || s.addr || '',
        totalQty: 0,
        totalAmount: 0,
        totalPaid: 0,
        entries: [],
        latestTime: parseDateToTime(rawDate)
      };
    }

    var qtyVal = parseFloat(s.qty || s.quantity || 1) || 1;
    var amtVal = Number(s.total) || (parseFloat(s.qty || 1) * parseFloat(s.rate || 0));
    var paidVal = Number(s.paid) || 0;

    groupedMap[groupKey].totalQty += qtyVal;
    groupedMap[groupKey].totalAmount += amtVal;
    groupedMap[groupKey].totalPaid += paidVal;
    groupedMap[groupKey].entries.push({ key: k, sale: s });
  }

  var list = [];
  for (var gKey in groupedMap) {
    var g = groupedMap[gKey];
    var cKey = g.name.toLowerCase();
    var cBal = custBalances[cKey] || { currentDue: Math.max(0, g.totalAmount - g.totalPaid) };
    list.push({
      groupKey: gKey,
      date: g.date,
      name: g.name,
      phone: g.phone,
      area: g.area,
      totalQty: g.totalQty,
      totalAmount: g.totalAmount,
      totalPaid: g.totalPaid,
      entries: g.entries,
      latestTime: g.latestTime,
      liveCustomerDue: cBal.currentDue
    });
  }

  var totalLiveFarmDue = 0;
  for (var ck in custBalances) { totalLiveFarmDue += custBalances[ck].currentDue; }

  if (getEl('dash-total-sales')) getEl('dash-total-sales').innerText = '₹ ' + tS.toLocaleString();
  if (getEl('dash-total-due')) getEl('dash-total-due').innerText = '₹ ' + totalLiveFarmDue.toLocaleString();
  if (getEl('rep-sales')) getEl('rep-sales').innerText = '₹ ' + tS.toLocaleString();
  calcNet();

  var areaSelect = getEl('saleAreaFilter');
  if (areaSelect) {
    var currVal = areaSelect.value;
    var optH = '<option value="">সকল এলাকা</option>';
    Object.keys(uniqueAreas).sort().forEach(function(a) {
      optH += '<option value="' + a + '" ' + (currVal.toLowerCase() === a.toLowerCase() ? 'selected' : '') + '>' + a + '</option>';
    });
    areaSelect.innerHTML = optH;
  }

  var filtered = list.filter(function(item) {
    var nameMatch = item.name.toLowerCase().includes(searchQ);
    var phoneMatch = (item.phone || '').toLowerCase().includes(searchQ);
    return (!searchQ || nameMatch || phoneMatch) && (!areaFilter || (item.area || '').toLowerCase() === areaFilter);
  });

  filtered.sort(function(a, b) { return b.latestTime - a.latestTime; });

  if (filtered.length === 0) {
    body.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#888;">কোনো বিক্রয় রেকর্ড নেই।</td></tr>';
    if (getEl('salesNoData')) getEl('salesNoData').style.display = 'block';
    return;
  }
  if (getEl('salesNoData')) getEl('salesNoData').style.display = 'none';

  var html = '';
  filtered.forEach(function(item, idx) {
    var dateBR = formatDateBR(item.date);
    var dueVal = Math.max(0, item.liveCustomerDue);
    var subTableId = 'sub_sales_' + idx;
    var hasMultiple = item.entries.length > 1;
    var rowStyle = 'background:#fafafa; border-top:2px solid #e0e0e0;';
    var dueBadge = dueVal > 0 ? '<strong style="color:red;">₹ ' + dueVal + '</strong>' : '<span class="badge badge-success">পরিশোধ</span>';

    var productSummary = '';
    if (hasMultiple) {
      productSummary = '<span style="color:#1b5e20; font-weight:600;">মোট ' + item.entries.length + 'টি এন্ট্রি (' + item.totalQty + ' লিটার)</span><br>' +
                       '<a href="javascript:void(0)" onclick="toggleSubSales(\'' + subTableId + '\', this)" style="display:inline-block; margin-top:5px; padding:4px 10px; background:#e1f5fe; color:#0288d1; font-weight:bold; font-size:12px; border-radius:4px; text-decoration:none;">বিস্তারিত দেখুন ▼</a>';
    } else {
      var singleSale = item.entries[0].sale;
      productSummary = (singleSale.item || 'দুধ') + ' (' + (singleSale.qty || 1) + ')';
    }

    var actionBtns = '<button class="action-btn" style="background:#455a64; color:white; padding:4px 8px; font-size:11px;" onclick="showCustomerLedger(\'' + encodeURIComponent(item.name) + '\')">খাতা</button> ';
    if (!hasMultiple) {
      actionBtns += '<button class="action-btn btn-info" style="padding:4px 8px; font-size:11px;" onclick="showInvoice(\'' + item.entries[0].key + '\')">Invoice</button> ' +
                    '<button class="action-btn btn-warning" style="padding:4px 8px; font-size:11px;" onclick="editSale(\'' + item.entries[0].key + '\')">Edit</button> ' +
                    '<button class="action-btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="deleteRecord(\'sales\',\'' + item.entries[0].key + '\')">Delete</button>';
    }

    html += '<tr style="' + rowStyle + '">' +
      '<td>' + dateBR + '</td>' +
      '<td><strong>' + item.name + '</strong>' + (item.phone ? '<br><small style="color:#666;">📞 ' + item.phone + '</small>' : '') + '</td>' +
      '<td>' + item.area + '</td>' +
      '<td>' + productSummary + '</td>' +
      '<td><strong>₹ ' + item.totalAmount + '</strong></td>' +
      '<td style="color:green;">₹ ' + item.totalPaid + '</td>' +
      '<td>' + dueBadge + '</td>' +
      '<td>' + actionBtns + '</td>' +
    '</tr>';

    if (hasMultiple) {
      html += '<tr id="' + subTableId + '" style="display:none; background:#f1f8e9;"><td colspan="8" style="padding:10px 15px;">' +
        '<div style="font-size:12px; font-weight:bold; color:#2e7d32; margin-bottom:8px;">📋 এই দিনের পৃথক এন্ট্রিগুলোর বিবরণ ও এডিট/ডিলিট অপশন:</div>' +
        '<div style="overflow-x:auto;"><table style="width:100%; font-size:12px; background:white; border:1px solid #c8e6c9; border-collapse:collapse;">' +
          '<tr style="background:#e8f5e9;"><th style="padding:6px; border:1px solid #c8e6c9;">বিবরণ</th><th style="padding:6px; border:1px solid #c8e6c9;">পরিমাণ</th><th style="padding:6px; border:1px solid #c8e6c9;">মোট দাম</th><th style="padding:6px; border:1px solid #c8e6c9;">পরিশোধ</th><th style="padding:6px; border:1px solid #c8e6c9;">কার্যক্রম</th></tr>';
      
      item.entries.forEach(function(itemObj) {
        var sItem = itemObj.sale;
        html += '<tr>' +
          '<td style="padding:6px; border:1px solid #c8e6c9;">' + (sItem.item || 'দুধ') + '</td>' +
          '<td style="padding:6px; border:1px solid #c8e6c9;">' + (sItem.qty || 1) + '</td>' +
          '<td style="padding:6px; border:1px solid #c8e6c9;">₹ ' + (Number(sItem.total) || 0) + '</td>' +
          '<td style="padding:6px; border:1px solid #c8e6c9; color:green;">₹ ' + (Number(sItem.paid) || 0) + '</td>' +
          '<td style="padding:6px; border:1px solid #c8e6c9; white-space:nowrap;">' +
            '<button class="action-btn" style="padding:2px 5px; font-size:10px;" onclick="showInvoice(\'' + itemObj.key + '\')">Invoice</button> ' +
            '<button class="action-btn btn-warning" style="padding:2px 5px; font-size:10px;" onclick="editSale(\'' + itemObj.key + '\')">Edit</button> ' +
            '<button class="action-btn btn-danger" style="padding:2px 5px; font-size:10px;" onclick="deleteRecord(\'sales\',\'' + itemObj.key + '\')">Delete</button>' +
          '</td>' +
        '</tr>';
      });

      html += '</table></div></td></tr>';
    }
  });

  body.innerHTML = html;
}

function toggleSubSales(subId, linkEl) {
  var row = document.getElementById(subId);
  if (!row) return;
  if (row.style.display === 'none') {
    row.style.display = 'table-row';
    linkEl.innerText = 'সংক্ষিপ্ত দেখুন ▲';
    linkEl.style.background = '#ffebee';
    linkEl.style.color = '#c62828';
  } else {
    row.style.display = 'none';
    linkEl.innerText = 'বিস্তারিত দেখুন ▼';
    linkEl.style.background = '#e1f5fe';
    linkEl.style.color = '#0288d1';
  }
}

var eSaleKey = null;
function calcSale() {
  var q = parseFloat(getEl('saleQty').value) || 0;
  var r = parseFloat(getEl('saleRate').value) || 0;
  var t = q * r;
  getEl('saleTotal').value = t; 
  var paidVal = parseFloat(getEl('salePaid').value) || 0;
  getEl('saleDue').value = Math.max(0, t - paidVal);
}

function editSale(k) {
  var d = farmStore.sales[k]; if (!d) return; eSaleKey = k;
  getEl('saleDate').value = d.date || ''; 
  getEl('saleCustomer').value = d.name || ''; 
  getEl('salePhone').value = d.phone || '';
  getEl('saleArea').value = d.area || ''; 
  getEl('saleAddr').value = d.addr || ''; 
  getEl('saleItem').value = d.item || 'Liquid Milk';
  
  var qVal = parseFloat(d.qty) || 1;
  var tVal = parseFloat(d.total) || 0;
  var rVal = parseFloat(d.rate) || (qVal > 0 ? tVal / qVal : 0);
  var paidVal = parseFloat(d.paid) || 0;

  getEl('saleQty').value = qVal; 
  getEl('saleRate').value = rVal; 
  getEl('saleTotal').value = tVal;
  getEl('salePaid').value = paidVal; 
  getEl('saleDue').value = Math.max(0, tVal - paidVal);

  getEl('saleSubmitBtn').innerText = 'Update Sale'; 
  getEl('saleCancelBtn').style.display = 'inline-flex';
  switchTab('sales', document.querySelector('nav button:nth-child(5)'));
  getEl('saleCustomer').scrollIntoView({ behavior: 'smooth' });
}

function cancelSaleEdit() {
  eSaleKey = null; ['saleCustomer','salePhone','saleArea','saleAddr','saleQty','saleRate','saleTotal','salePaid','saleDue'].forEach(function(i){ getEl(i).value=''; });
  getEl('saleSubmitBtn').innerText = 'Save Sale'; 
  if(getEl('saleCancelBtn')) getEl('saleCancelBtn').style.display = 'none';
}

function saveSale() {
  var name = (getEl('saleCustomer').value || '').trim(); 
  if (!name) return alert('Customer Name দিন!');
  
  var q = parseFloat(getEl('saleQty').value) || 0;
  var r = parseFloat(getEl('saleRate').value) || 0;
  var totalVal = q * r;
  if (totalVal === 0) {
    totalVal = parseFloat(getEl('saleTotal').value) || 0;
  }
  var paidVal = parseFloat(getEl('salePaid').value) || 0;
  var dueVal = Math.max(0, totalVal - paidVal);

  var existingPayments = [];
  if (eSaleKey && farmStore.sales[eSaleKey] && farmStore.sales[eSaleKey].payments) {
    existingPayments = farmStore.sales[eSaleKey].payments;
  }

  var data = { 
    date: getEl('saleDate').value, 
    name: name, 
    phone: (getEl('salePhone').value || '').trim(), 
    area: (getEl('saleArea').value || '').trim(), 
    addr: (getEl('saleAddr').value || '').trim(), 
    item: getEl('saleItem').value, 
    qty: q, 
    rate: r, 
    total: totalVal, 
    paid: paidVal, 
    due: dueVal, 
    payments: existingPayments 
  };

  if (db) {
    if (eSaleKey) {
      db.ref('sales/' + eSaleKey).update(data);
    } else {
      db.ref('sales').push(data);
    }
  }
  cancelSaleEdit();
}

window.showCustomerLedger = function(encName) {
  var custName = decodeURIComponent(encName).trim();
  window.activeLedgerCustomerName = custName;
  document.body.setAttribute('data-print', 'ledger');
  
  var custLower = custName.toLowerCase();
  var cPhone = '', cArea = '', cAddr = '', opDue = 0;

  for (var ck in farmStore.customers) {
    var cust = farmStore.customers[ck];
    if (cust && cust.name && cust.name.trim().toLowerCase() === custLower) {
      cPhone = cust.phone || ''; cArea = cust.area || ''; cAddr = cust.addr || ''; opDue = Number(cust.openingDue) || 0;
      break;
    }
  }

  var events = [];
  var totalBillAmount = opDue, totalPaidAmount = 0;

  if (opDue > 0) {
    events.push({ date: 'শুরু', desc: 'প্রাথমিক বকেয়া', bill: opDue, paid: 0, netDiff: opDue, isOpening: true, timestamp: 0 });
  }

  for (var k in farmStore.sales) {
    var s = farmStore.sales[k];
    if (!s) continue;
    if ((s.name || '').trim().toLowerCase() === custLower) {
      if (s.phone && !cPhone) cPhone = s.phone;
      if (s.area && !cArea) cArea = s.area;
      if (s.addr && !cAddr) cAddr = s.addr;

      var bTot = Number(s.total) || 0;
      var bCurPaid = Number(s.paid) || 0;
      var pList = getPaymentsArray(s.payments);
      var subsequentSum = 0;
      pList.forEach(function(p) { subsequentSum += (Number(p.amount) || 0); });
      var initialPaid = Math.max(0, bCurPaid - subsequentSum);

      if (bTot > 0) {
        totalBillAmount += bTot; totalPaidAmount += initialPaid;
        events.push({ date: formatDateBR(s.date), desc: (s.item || 'পণ্য') + (s.qty ? ' (' + s.qty + ')' : ''), bill: bTot, paid: initialPaid, netDiff: bTot - initialPaid, isSale: true, saleKey: k, timestamp: parseDateToTime(s.date) });
      }

      pList.forEach(function(p, pIdx) {
        var pAmt = Number(p.amount) || 0; totalPaidAmount += pAmt;
        events.push({ date: formatDateBR(p.date || s.date), desc: '💳 বকেয়া জমা (' + (p.note || 'ক্যাশ') + ')', bill: 0, paid: pAmt, netDiff: -pAmt, isPayment: true, payObj: p, saleKey: k, timestamp: parseDateToTime(p.date || s.date) + (pIdx + 1) });
      });
    }
  }

  events.sort(function(a, b) { return a.timestamp - b.timestamp; });
  var runningBalance = 0;
  events.forEach(function(ev) { runningBalance += ev.netDiff; ev.cumDue = Math.max(0, runningBalance); });
  events.reverse();

  getEl('ledgerCustSub').innerHTML = 'গ্রাহক: <strong>' + custName + '</strong> ' + (cPhone ? '| 📞 ' + cPhone : '');
  getEl('ledgerTotalBill').innerText = '₹ ' + totalBillAmount.toLocaleString();
  getEl('ledgerTotalPaid').innerText = '₹ ' + totalPaidAmount.toLocaleString();
  getEl('ledgerTotalDue').innerText = '₹ ' + Math.max(0, totalBillAmount - totalPaidAmount).toLocaleString();

  if (getEl('ledgerPayDate')) getEl('ledgerPayDate').value = new Date().toISOString().split('T')[0];
  if (getEl('ledgerPayAmount')) getEl('ledgerPayAmount').value = '';
  if (getEl('ledgerPayNote')) getEl('ledgerPayNote').value = '';

  var tbody = getEl('ledgerTableBody');
  if (events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">কোনো রেকর্ড নেই।</td></tr>';
  } else {
    var html = '';
    events.forEach(function(ev) {
      if (ev.isOpening) {
        html += '<tr style="background:#fff9c4;"><td>' + ev.date + '</td><td><strong>' + ev.desc + '</strong></td><td>₹ ' + ev.bill + '</td><td>₹ 0</td><td style="color:#e65100; font-weight:bold;">₹ ' + ev.cumDue + '</td><td>-</td></tr>';
      } else if (ev.isSale) {
        html += '<tr><td>' + ev.date + '</td><td><strong>' + ev.desc + '</strong></td><td>₹ ' + ev.bill + '</td><td style="color:green; font-weight:600;">₹ ' + ev.paid + '</td><td style="color:#e65100; font-weight:bold;">₹ ' + ev.cumDue + '</td><td><button class="action-btn btn-info" onclick="showInvoice(\'' + ev.saleKey + '\')">📄 Invoice</button></td></tr>';
      } else {
        html += '<tr style="background:#f9fdfa;"><td>' + ev.date + '</td><td><strong style="color:#1b5e20;">' + ev.desc + '</strong></td><td>₹ 0</td><td style="color:green; font-weight:700;">₹ ' + ev.paid + '</td><td style="color:#e65100; font-weight:bold;">₹ ' + ev.cumDue + '</td><td>-</td></tr>';
      }
    });
    tbody.innerHTML = html;
  }
  getEl('ledgerModal').style.display = 'flex';
};

window.closeLedger = function() {
  getEl('ledgerModal').style.display = 'none';
  window.activeLedgerCustomerName = '';
  document.body.removeAttribute('data-print');
};

window.saveCustomerPayment = function() {
  var amt = parseFloat(getEl('ledgerPayAmount').value) || 0;
  if (amt <= 0) return alert('জমার পরিমাণ দিন!');
  var pDate = getEl('ledgerPayDate').value || new Date().toISOString().split('T')[0];
  var pNote = (getEl('ledgerPayNote').value || 'নগদ জমা').trim();
  var custName = window.activeLedgerCustomerName;

  var unpaidSales = [];
  for (var k in farmStore.sales) {
    var s = farmStore.sales[k];
    if (s && (s.name || '').trim().toLowerCase() === custName.toLowerCase() && Number(s.due) > 0) {
      unpaidSales.push({ key: k, data: s });
    }
  }
  unpaidSales.sort(function(a, b) { return (a.data.date || '').localeCompare(b.data.date || ''); });

  var paymentId = 'PAY-' + Date.now();
  var rem = amt;
  unpaidSales.forEach(function(item) {
    if (rem <= 0) return;
    var curDue = Number(item.data.due) || 0;
    var curPaid = Number(item.data.paid) || 0;
    var payAmount = Math.min(rem, curDue);
    rem -= payAmount;
    var pList = getPaymentsArray(item.data.payments);
    pList.push({ id: paymentId, date: pDate, amount: payAmount, note: pNote });
    
    var newPaid = curPaid + payAmount;
    var newDue = Math.max(0, Number(item.data.total || 0) - newPaid);
    if (db) db.ref('sales/' + item.key).update({ paid: newPaid, due: newDue, payments: pList });
  });

  if (rem > 0) {
    var advRecord = { date: pDate, name: custName, phone: '', area: '', addr: '', item: 'অগ্রিম জমা (' + pNote + ')', qty: 1, rate: 0, total: 0, paid: rem, due: 0, isPayment: true, payments: [{ id: paymentId, date: pDate, amount: rem, note: pNote }] };
    if (db) db.ref('sales').push(advRecord);
  }

  alert('পেমেন্ট সফলভাবে জমা হয়েছে!');
  getEl('ledgerPayAmount').value = ''; getEl('ledgerPayNote').value = '';
  setTimeout(function() { showCustomerLedger(encodeURIComponent(custName)); }, 300);
};

window.showInvoice = function(k) {
  var d = farmStore.sales[k];
  if (!d) return;
  document.body.setAttribute('data-print', 'invoice');
  getEl('invMainDocTitle').innerText = 'ইনভয়েস (ক্যাশ মেমো)';
  var liveDue = getCustomerLiveBalances()[(d.name || '').trim().toLowerCase()]?.currentDue || 0;
  getEl('invoiceDetails').innerHTML = '<div style="display:flex; justify-content:space-between; margin-bottom:12px;"><div><strong>গ্রাহক:</strong> ' + d.name + '<br>মোবাইল: ' + (d.phone || '-') + '</div><div style="text-align:right;">তারিখ: ' + formatDateBR(d.date) + '<br>ইনভয়েস: #NDA-' + k.substring(1, 6).toUpperCase() + '</div></div><table class="invoice-table" style="border:1px solid #ddd; width:100%;"><thead><tr style="background:#e8f5e9;"><th>পণ্য</th><th>পরিমাণ</th><th>দর</th><th style="text-align:right;">মোট</th></tr></thead><tbody><tr><td>' + d.item + '</td><td>' + d.qty + '</td><td>₹ ' + d.rate + '</td><td style="text-align:right; font-weight:bold;">₹ ' + d.total + '</td></tr></tbody></table><div style="text-align:right; margin-top:10px;">চালান মূল্য: ₹ ' + d.total + '<br>নগদ পরিশোধ: ₹ ' + d.paid + '<br><span style="color:red; font-weight:bold;">মোট বকেয়া: ₹ ' + liveDue + '</span></div>';
  getEl('invoiceModal').style.display = 'flex';
};
