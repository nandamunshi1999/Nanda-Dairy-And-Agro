window.listenAllData = function() {
  if (!db) return;
  if (typeof checkAndGenerateDailyOrders === 'function') {
    checkAndGenerateDailyOrders();
  }

  // ১. Cattle Data
  db.ref('cattle').on('value', function(snap) { 
    farmStore.cattle = {}; 
    snap.forEach(function(c){ farmStore.cattle[c.key] = c.val(); }); 
    if (typeof renderCattleTable === 'function') renderCattleTable(); 
  });

  // ২. Breeding Data (AI, Pregnancy, Calving)
  db.ref('breeding').on('value', function(snap) {
    farmStore.breeding = {}; 
    var body = getEl('breedingTableBody'); 
    if (body) body.innerHTML = ''; 
    var count = 0;
    
    snap.forEach(function(c) {
      count++; 
      var d = c.val(), k = c.key; 
      farmStore.breeding[k] = d;
      var badgeClass = d.status === 'Pregnant' ? 'badge-success' : (d.status === 'Failed' ? 'badge-danger' : 'badge-warning');
      
      if (body) {
        body.innerHTML += '<tr>' +
          '<td><strong>' + (d.tag || '-') + '</strong></td>' +
          '<td>' + formatDateBR(d.aiDate) + '</td>' +
          '<td>' + (d.semenId || '-') + '</td>' +
          '<td>' + (d.company || '-') + '</td>' +
          '<td>₹ ' + (d.aiCost || 0) + '</td>' +
          '<td>' + formatDateBR(d.pdDate) + '</td>' +
          '<td><span class="badge ' + badgeClass + '">' + (d.status || 'Pending') + '</span></td>' +
          '<td>' + formatDateBR(d.expCalvingDate || d.calvingDate) + '</td>' +
          '<td>' + formatDateBR(d.actCalvingDate) + '</td>' +
          '<td>' +
            '<button class="action-btn btn-info" onclick="editBreeding(\'' + k + '\')">Edit</button>' +
            '<button class="action-btn btn-danger" onclick="deleteRecord(\'breeding\',\'' + k + '\')">Delete</button>' +
          '</td>' +
        '</tr>';
      }
    });
    if (getEl('breedingNoData')) getEl('breedingNoData').style.display = count === 0 ? 'block' : 'none';
  });

  // ৩. Insemination Data (নতুন অপশন)
  db.ref('insemination').on('value', function(snap) {
    farmStore.insemination = {}; 
    snap.forEach(function(c){ farmStore.insemination[c.key] = c.val(); }); 
    if (typeof renderInseminationTable === 'function') renderInseminationTable(); 
  });

  // ৪. Heat Register Data (নতুন অপশন)
  db.ref('heat').on('value', function(snap) {
    farmStore.heat = {}; 
    snap.forEach(function(c){ farmStore.heat[c.key] = c.val(); }); 
    if (typeof renderHeatTable === 'function') renderHeatTable(); 
  });

  // ৫. Vaccination Data (নতুন অপশন)
  db.ref('vaccine').on('value', function(snap) {
    farmStore.vaccine = {}; 
    snap.forEach(function(c){ farmStore.vaccine[c.key] = c.val(); }); 
    if (typeof renderVaccineTable === 'function') renderVaccineTable(); 
  });

  // ৬. Deworming Data (নতুন অপশন)
  db.ref('deworm').on('value', function(snap) {
    farmStore.deworm = {}; 
    snap.forEach(function(c){ farmStore.deworm[c.key] = c.val(); }); 
    if (typeof renderDewormTable === 'function') renderDewormTable(); 
  });

  // ৭. Milk Data
  db.ref('milk').on('value', function(snap) { 
    farmStore.milk = {}; 
    snap.forEach(function(c){ farmStore.milk[c.key] = c.val(); }); 
    if (typeof renderGroupedMilkTable === 'function') renderGroupedMilkTable(); 
    if (typeof renderCattleTable === 'function') renderCattleTable(); 
  });

  // ৮. Sales Data
  db.ref('sales').on('value', function(snap) {
    farmStore.sales = {}; 
    snap.forEach(function(c){ farmStore.sales[c.key] = c.val(); });
    if (typeof renderSalesTable === 'function') renderSalesTable();
    if (window.activeLedgerCustomerName && typeof showCustomerLedger === 'function') {
      showCustomerLedger(encodeURIComponent(window.activeLedgerCustomerName));
    }
  });

  // ৯. Customers Data
  db.ref('customers').on('value', function(snap) {
    farmStore.customers = {}; 
    var body = getEl('customerTableBody'); 
    if (body) body.innerHTML = '';
    var nameOpt = '', areaOpt = '', areaSet = {};
    
    snap.forEach(function(c) {
      var d = c.val(), k = c.key; 
      farmStore.customers[k] = d;
      if (d.name) nameOpt += '<option value="' + d.name + '">' + (d.phone ? d.name + ' (' + d.phone + ')' : d.name) + '</option>';
      if (d.area && !areaSet[d.area]) { areaSet[d.area] = true; areaOpt += '<option value="' + d.area + '">'; }
      if (body) {
        body.innerHTML += '<tr>' +
          '<td><strong>' + (d.name || '-') + '</strong></td>' +
          '<td>' + (d.phone || '-') + '</td>' +
          '<td>' + (d.area ? '<span class="badge badge-warning">' + d.area + '</span>' : '-') + '</td>' +
          '<td>' + (d.addr || '-') + '</td>' +
          '<td>' + (d.demand || 0) + ' L</td>' +
          '<td>₹ ' + (d.openingDue || 0) + '</td>' +
          '<td><span style="font-size:11px; background:#e3f2fd; padding:2px 6px;">' + (d.type || 'Retail') + '</span> / <span style="font-size:11px; color:#1b5e20;">' + (d.shift || 'Morning') + '</span></td>' +
          '<td>' +
            '<button class="action-btn btn-info" onclick="editCustomer(\'' + k + '\')">Edit</button>' +
            '<button class="action-btn btn-danger" onclick="deleteRecord(\'customers\',\'' + k + '\')">Delete</button>' +
          '</td>' +
        '</tr>';
      }
    });
    
    if (getEl('customerNameList')) getEl('customerNameList').innerHTML = nameOpt;
    if (getEl('customerAreaList')) getEl('customerAreaList').innerHTML = areaOpt;
    if (typeof renderSalesTable === 'function') renderSalesTable();
    if (typeof renderOrdersTable === 'function') renderOrdersTable();
  });

  // ১০. Orders Data
  db.ref('orders').on('value', function(snap) {
    farmStore.orders = {};
    snap.forEach(function(c) {
      farmStore.orders[c.key] = c.val();
    });
    if (typeof renderOrdersTable === 'function') renderOrdersTable();
  });

  // ১১. Feed Data
  db.ref('feed').on('value', function(snap) {
    farmStore.feed = {};
    snap.forEach(function(c) {
      farmStore.feed[c.key] = c.val();
    });
    if (typeof renderFeedTable === 'function') renderFeedTable();
  });

  // ১২. Feed Rations Data
  db.ref('feedRations').on('value', function(snap) {
    farmStore.feedRations = {};
    snap.forEach(function(c) {
      farmStore.feedRations[c.key] = c.val();
    });
    if (typeof renderRationTable === 'function') renderRationTable();
  });

  // ১৩. Expenses Data
  db.ref('expenses').on('value', function(snap) {
    farmStore.expenses = {}; 
    snap.forEach(function(c){ farmStore.expenses[c.key] = c.val(); });
    if (typeof renderGroupedExpenseTable === 'function') renderGroupedExpenseTable();
  });

  // ১৪. Stock Data
  db.ref('stock').on('value', function(snap) {
    farmStore.stock = {}; 
    var body = getEl('stockTableBody'); 
    if (body) body.innerHTML = '';
    
    snap.forEach(function(c) {
      var d = c.val(), k = c.key; 
      farmStore.stock[k] = d;
      var isLow = Number(d.qty) <= Number(d.alertLevel);
      if (body) {
        body.innerHTML += '<tr>' +
          '<td><strong>' + (d.name || '-') + '</strong></td>' +
          '<td style="color:' + (isLow ? 'red' : 'inherit') + ';font-weight:bold;">' + (d.qty || 0) + '</td>' +
          '<td>' + (d.unit || '-') + '</td>' +
          '<td>' + (d.alertLevel || 0) + '</td>' +
          '<td>' +
            '<button class="action-btn btn-info" onclick="editStock(\'' + k + '\')">Edit</button>' +
            '<button class="action-btn btn-danger" onclick="deleteRecord(\'stock\',\'' + k + '\')">Delete</button>' +
          '</td>' +
        '</tr>';
      }
    });
    if (typeof renderStockAutocomplete === 'function') renderStockAutocomplete();
  });

  // ১৫. Semen Data
  db.ref('semen').on('value', function(snap) {
    farmStore.semen = {}; 
    var body = getEl('semenTableBody'); 
    if (body) body.innerHTML = '';
    
    snap.forEach(function(c) {
      var d = c.val(), k = c.key; 
      farmStore.semen[k] = d;
      if (body) {
        body.innerHTML += '<tr>' +
          '<td><strong>' + (d.batch || '-') + '</strong></td>' +
          '<td>' + (d.breed || '-') + '</td>' +
          '<td>' + (d.source || '-') + '</td>' +
          '<td><strong>' + (d.count || 0) + ' Straws</strong></td>' +
          '<td>' +
            '<button class="action-btn btn-info" onclick="editSemen(\'' + k + '\')">Edit</button>' +
            '<button class="action-btn btn-danger" onclick="deleteRecord(\'semen\',\'' + k + '\')">Delete</button>' +
          '</td>' +
        '</tr>';
      }
    });
  });

  // ১৬. Health Data
  db.ref('health').on('value', function(snap) {
    farmStore.health = {}; 
    var body = getEl('healthTableBody'); 
    if (body) body.innerHTML = '';
    
    snap.forEach(function(c) {
      var d = c.val(), k = c.key; 
      farmStore.health[k] = d;
      if (body) {
        body.innerHTML += '<tr>' +
          '<td>' + formatDateBR(d.date) + '</td>' +
          '<td><strong>' + (d.cowTag || '-') + '</strong></td>' +
          '<td>' + (d.type || '-') + '</td>' +
          '<td>' + (d.desc || '-') + '</td>' +
          '<td>' + formatDateBR(d.nextDate) + '</td>' +
          '<td>' +
            '<button class="action-btn btn-info" onclick="editHealth(\'' + k + '\')">Edit</button>' +
            '<button class="action-btn btn-danger" onclick="deleteRecord(\'health\',\'' + k + '\')">Delete</button>' +
          '</td>' +
        '</tr>';
      }
    });
  });
};
