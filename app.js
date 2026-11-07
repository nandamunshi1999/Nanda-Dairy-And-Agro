function getEl(id) {
  return document.getElementById(id);
}

// ফায়ারবেস কনফিগারেশন (আপনার নতুন প্রজেক্ট অনুযায়ী আপডেট করা)
var firebaseConfig = {
  apiKey: "AIzaSyCkp4T7qW616nGYOgiye7iaJzoHHuvBo_M",
  authDomain: "nanda-dairy-and-agro-7d69f.firebaseapp.com",
  databaseURL: "https://nanda-dairy-and-agro-7d69f-default-rtdb.firebaseio.com",
  projectId: "nanda-dairy-and-agro-7d69f",
  storageBucket: "nanda-dairy-and-agro-7d69f.firebasestorage.app",
  messagingSenderId: "615970755592",
  appId: "1:615970755592:web:e5eab220342fb572b7edbd",
  measurementId: "G-1ZCB00LL0M"
};

var db = null;
try {
  if (window.firebase && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  if (window.firebase) {
    db = firebase.database();
  }
} catch (e) {
  console.log(e);
}

// গ্লোবাল ফার্ম স্টোর (নতুন ৪টি অবজেক্ট সহ)
var farmStore = {
  cattle: {}, breeding: {}, milk: {}, sales: {},
  customers: {}, orders: {}, expenses: {}, stock: {},
  semen: {}, health: {}, feedRations: {}, feed: {},
  insemination: {}, heat: {}, vaccine: {}, deworm: {}
};
window.activeLedgerCustomerName = '';

// তারিখ ও সময় ফরম্যাট ফাংশন
window.formatDateBR = function(dtStr) {
  if (!dtStr || dtStr === '-') return '-';
  var clean = String(dtStr).trim();
  if (clean === 'শুরু') return 'শুরু';
  var parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return parts[2] + '-' + parts[1] + '-' + parts[0];
    }
    return clean;
  }
  return clean;
};

window.getCurrentTimeBR = function() {
  var d = new Date();
  var hours = d.getHours();
  var minutes = d.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + minutes + ' ' + ampm;
};

window.parseDateToTime = function(dtStr) {
  if (!dtStr) return 0;
  var clean = String(dtStr).trim();
  var t = new Date(clean).getTime();
  return isNaN(t) ? 0 : t;
};

window.getPaymentsArray = function(payments) {
  if (!payments) return [];
  if (Array.isArray(payments)) return payments;
  if (typeof payments === 'object') return Object.values(payments);
  return [];
};

window.switchTab = function(tab, btn) {
  var contents = document.querySelectorAll('.tab-content');
  for (var i = 0; i < contents.length; i++) {
    contents[i].style.display = 'none';
  }

  var navBtns = document.querySelectorAll('nav button');
  for (var j = 0; j < navBtns.length; j++) {
    navBtns[j].classList.remove('active');
  }

  var target = getEl('tab-' + tab);
  if (target) {
    target.style.display = 'block';
  }

  if (btn) {
    btn.classList.add('active');
  } else if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }
};

window.doLogin = function() {
  var u = (getEl('loginId') ? getEl('loginId').value : '').trim().toLowerCase();
  var p = (getEl('loginPass') ? getEl('loginPass').value : '').trim();

  if (u === 'nanda' && p === '1234') {
    localStorage.setItem('nanda_auth_status', 'logged_in');
    getEl('loginScreen').style.display = 'none';
    getEl('appBody').style.display = 'block';
    if (typeof window.listenAllData === 'function') {
      window.listenAllData();
    }
  } else {
    if (getEl('loginErr')) {
      getEl('loginErr').innerText = 'ভুল আইডি বা পাসওয়ার্ড!';
    }
  }
};

window.doLogout = function() {
  localStorage.removeItem('nanda_auth_status');
  location.reload();
};

window.onload = function() {
  var todayISO = new Date().toISOString().split('T')[0];
  var defaultDateIds = ['milkDate', 'saleDate', 'orderDate', 'expDate', 'brAiDate', 'hlthDate', 'ledgerPayDate', 'feedDate', 'rationDate', 'insAiDate', 'heatDate', 'vacDate', 'dewDate'];
  defaultDateIds.forEach(function(id) {
    if (getEl(id)) {
      getEl(id).value = todayISO;
    }
  });

  if (localStorage.getItem('nanda_auth_status') === 'logged_in') {
    if (getEl('loginScreen')) getEl('loginScreen').style.display = 'none';
    if (getEl('appBody')) getEl('appBody').style.display = 'block';
    if (typeof window.listenAllData === 'function') window.listenAllData();
  } else {
    if (getEl('loginScreen')) getEl('loginScreen').style.display = 'flex';
    if (getEl('appBody')) getEl('appBody').style.display = 'none';
  }
};

function deleteRecord(path, id) {
  if (confirm('আপনি কি নিশ্চিতভাবে এই তথ্যটি মুছে ফেলতে চান?')) {
    if (db) db.ref(path).child(id).remove();
  }
}

window.printSpecificModal = function(target) {
  document.body.setAttribute('data-print', target);
  var origTitle = document.title;
  document.title = " ";
  window.print();
  setTimeout(function() {
    document.title = origTitle;
    document.body.removeAttribute('data-print');
  }, 1000);
};

function calcNet() {
  var s = parseFloat((getEl('rep-sales') ? getEl('rep-sales').innerText : '0').replace(/[^0-9.-]+/g, "")) || 0;
  var e = parseFloat((getEl('rep-expenses') ? getEl('rep-expenses').innerText : '0').replace(/[^0-9.-]+/g, "")) || 0;
  var net = s - e;
  var pEl = getEl('rep-profit');
  if (pEl) {
    pEl.innerText = '₹ ' + net.toLocaleString();
    pEl.style.color = net >= 0 ? 'green' : 'red';
  }
}
