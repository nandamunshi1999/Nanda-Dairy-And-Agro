function onOrderCustomerInput() {
  var val = (getEl('orderCustomer').value || '').trim().toLowerCase();
  if (!val) return;
  for (var k in farmStore.customers) {
    var c = farmStore.customers[k];
    if ((c.name || '').trim().toLowerCase() === val) {
      if (c.phone) getEl('orderPhone').value = c.phone;
      if (c.area) getEl('orderArea').value = c.area;
      break;
    }
  }
}

function checkAndGenerateDailyOrders() {
  if (!db) return;
  var todayISO = new Date().toISOString().split('T')[0];
  
  db.ref('orders').once('value', function(orderSnap) {
    var existingOrders = orderSnap.val() || {};
    var todayProcessedMap = {};
    
    Object.keys(existingOrders).forEach(function(k) {
      var o = existingOrders[k];
      if (o && o.date === todayISO && o.customer) {
        todayProcessedMap[o.customer.trim().toLowerCase()] = true;
      }
    });

    db.ref('sales').once('value', function(saleSnap) {
      var existingSales = saleSnap.val() || {};
      Object.keys(existingSales).forEach(function(k) {
        var s = existingSales[k];
        if (s && s.date === todayISO && s.name) {
          todayProcessedMap[s.name.trim().toLowerCase()] = true;
        }
      });

      db.ref('customers').once('value', function(custSnap) {
        custSnap.forEach(function(cNode) {
          var cust = cNode.val();
          if (cust && cust.name && Number(cust.demand) > 0) {
            var cName = cust.name.trim();
            var cKey = cName.toLowerCase();
            
            if (!todayProcessedMap[cKey]) {
              var autoOrder = {
                date: todayISO,
                customer: cName,
                phone: cust.phone || '',
                area: cust.area || '',
                items: cust.demand + ' লিটার তরল দুধ',
                total: Number(cust.demand) * 50,
                paid: 0,
                status: 'Pending'
              };
              db.ref('orders').push(autoOrder);
            }
          }
        });
      });
    });
  });
}

var eOrdKey = null;
function editOrder(k) {
  var d = farmStore.orders[k]; if (!d) return; eOrdKey = k;
  getEl('orderDate').value = d.date || ''; getEl('orderCustomer').value = d.customer || ''; getEl('orderPhone').value = d.phone || '';
  getEl('orderArea').value = d.area || ''; getEl('orderItems').value = d.items || ''; getEl('orderTotal').value = d.total || '';
  getEl('orderPaid').value = d.paid || ''; getEl('orderStatus').value = d.status || 'Pending';
  getEl('orderSubmitBtn').innerText = 'Update Order'; getEl('orderCancelBtn').style.display = 'inline-flex';
  switchTab('orders', document.querySelector('nav button:nth-child(7)'));
}

function cancelOrderEdit() {
  eOrdKey = null; ['orderCustomer','orderPhone','orderArea','orderItems','orderTotal','orderPaid'].forEach(function(i){ if(getEl(i)) getEl(i).value=''; });
  getEl('orderStatus').value = 'Pending'; getEl('orderSubmitBtn').innerText = 'Save Order'; getEl('orderCancelBtn').style.display = 'none';
}

function saveOrder() {
  var cust = (getEl('orderCustomer').value || '').trim(); 
  var items = (getEl('orderItems').value || '').trim();
  if (!cust || !items) return alert('নাম ও বিবরণ দিন!');
  
  var status = getEl('orderStatus').value; 
  var total = parseFloat(getEl('orderTotal').value) || 0; 
  var paid = parseFloat(getEl('orderPaid').value) || 0;
  var deliveryDate = getEl('orderDate').value;
  var phone = (getEl('orderPhone') ? getEl('orderPhone').value : '').trim();
  var area = (getEl('orderArea') ? getEl('orderArea').value : '').trim();

  for (var ck in farmStore.customers) {
    var cObj = farmStore.customers[ck];
    if (cObj && cObj.name && cObj.name.trim().toLowerCase() === cust.toLowerCase()) {
      if (!phone && cObj.phone) phone = cObj.phone;
      if (!area && cObj.area) area = cObj.area.trim();
      break;
    }
  }

  if (db) {
    if (eOrdKey) {
      db.ref('orders/' + eOrdKey).remove();
      
      if (status === 'Delivered') {
        if (total > 0) {
          db.ref('sales').push({ 
            date: deliveryDate, 
            name: cust, 
            phone: phone, 
            area: area, 
            addr: '', 
            item: items, 
            qty: 1, 
            rate: total, 
            total: total, 
            paid: paid, 
            due: Math.max(0, total - paid), 
            payments: [] 
          });
        }
      } else if (status === 'Pending') {
        db.ref('orders').push({ 
          date: deliveryDate, 
          customer: cust, 
          phone: phone, 
          area: area, 
          items: items, 
          total: total, 
          paid: paid, 
          status: status 
        });
      }
      eOrdKey = null; 
    } else {
      if (status === 'Delivered') {
        if (total > 0) {
          db.ref('sales').push({ 
            date: deliveryDate, 
            name: cust, 
            phone: phone, 
            area: area, 
            addr: '', 
            item: items, 
            qty: 1, 
            rate: total, 
            total: total, 
            paid: paid, 
            due: Math.max(0, total - paid), 
            payments: [] 
          });
        }
      } else if (status === 'Pending') {
        db.ref('orders').push({ 
          date: deliveryDate, 
          customer: cust, 
          phone: phone, 
          area: area, 
          items: items, 
          total: total, 
          paid: paid, 
          status: status 
        });
      }
    }
  }
  cancelOrderEdit();
}
