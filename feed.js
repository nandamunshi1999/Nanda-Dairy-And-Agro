window.loadCattleDefaultRation = function() {
  var tag = (getEl('ratCowTag').value || '').trim();
  if (!tag) return;
  if (!getEl('ratPellet').value) getEl('ratPellet').value = "2.0";
  if (!getEl('ratAvgCostPerKg').value) getEl('ratAvgCostPerKg').value = "32";
  if (!getEl('ratSuppCost').value) getEl('ratSuppCost').value = "0";
  autoCalcRation();
};

function autoCalcRation() {
  var pellet = parseFloat(getEl('ratPellet').value) || 0;
  var avgCost = parseFloat(getEl('ratAvgCostPerKg').value) || 0;
  var suppCost = parseFloat(getEl('ratSuppCost').value) || 0;

  var totalCost = (pellet * avgCost) + suppCost;
  if (getEl('ratTotalCost')) getEl('ratTotalCost').value = totalCost.toFixed(2);
}

var eRatKey = null;
function editRation(k) {
  var d = farmStore.feedRations[k]; if (!d) return; eRatKey = k;
  getEl('rationDate').value = d.date || '';
  getEl('ratCowTag').value = d.cowTag || '';
  getEl('ratPellet').value = d.pellet || '';
  getEl('ratAvgCostPerKg').value = d.avgCostPerKg || '';
  getEl('ratSuppCost').value = d.suppCost || '';
  getEl('ratTotalCost').value = d.totalCost || '';

  getEl('ratSubmitBtn').innerText = 'Update Ration';
  getEl('ratCancelBtn').style.display = 'inline-flex';
  switchTab('feed', document.querySelector('nav button:nth-child(8)'));
}

function cancelRationEdit() {
  eRatKey = null;
  ['ratCowTag','ratPellet','ratAvgCostPerKg','ratSuppCost','ratTotalCost'].forEach(function(i){ if(getEl(i)) getEl(i).value=''; });
  getEl('ratSubmitBtn').innerText = 'Save & Deduct Stock';
  getEl('ratCancelBtn').style.display = 'none';
}

function saveRation() {
  var tag = (getEl('ratCowTag').value || '').trim();
  var dt = getEl('rationDate').value;
  if (!tag || !dt) return alert('তারিখ ও গরুর Tag ID দিন!');

  var pellet = parseFloat(getEl('ratPellet').value) || 0;
  var avgCost = parseFloat(getEl('ratAvgCostPerKg').value) || 0;
  var suppCost = parseFloat(getEl('ratSuppCost').value) || 0;
  var totalCost = (pellet * avgCost) + suppCost;

  var data = {
    date: dt,
    cowTag: tag,
    pellet: pellet,
    avgCostPerKg: avgCost,
    suppCost: suppCost,
    totalCost: totalCost
  };

  if (db) {
    if (eRatKey) {
      db.ref('feedRations/' + eRatKey).update(data);
    } else {
      db.ref('feedRations').push(data);
    }
  }
  cancelRationEdit();
}

var eFeedKey = null;
function editFeed(k) {
  var d = farmStore.feed[k]; if (!d) return; eFeedKey = k;
  getEl('feedDate').value = d.date || '';
  getEl('feedType').value = d.type || 'Cattle Feed / Pellets';
  getEl('feedQty').value = d.qty || '';
  getEl('feedCost').value = d.cost || '';
  getEl('feedNote').value = d.note || '';
  getEl('feedSubmitBtn').innerText = 'Update Feed';
  getEl('feedCancelBtn').style.display = 'inline-flex';
  switchTab('feed', document.querySelector('nav button:nth-child(8)'));
}

function cancelFeedEdit() {
  eFeedKey = null;
  ['feedQty','feedCost','feedNote'].forEach(function(i){ if(getEl(i)) getEl(i).value=''; });
  getEl('feedSubmitBtn').innerText = 'Save Feed Record';
  getEl('feedCancelBtn').style.display = 'none';
}

function saveFeed() {
  var dt = getEl('feedDate').value;
  var type = getEl('feedType').value;
  var qty = (getEl('feedQty').value || '').trim();
  var cost = parseFloat(getEl('feedCost').value) || 0;
  var note = (getEl('feedNote').value || '').trim();

  if (!dt || !qty || cost <= 0) return alert('তারিখ, পরিমাণ ও মোট খরচ দিন!');

  var data = { date: dt, type: type, qty: qty, cost: cost, note: note };
  if (db) {
    if (eFeedKey) {
      db.ref('feed/' + eFeedKey).update(data);
    } else {
      db.ref('feed').push(data);
    }
  }
  cancelFeedEdit();
}
