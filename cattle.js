window.openCattleFeedModal = function(tag) {
  var cowInfo = null;
  for (var k in farmStore.cattle) {
    if ((farmStore.cattle[k].tag || '').trim().toUpperCase() === tag.toUpperCase()) {
      cowInfo = farmStore.cattle[k];
      break;
    }
  }

  var titleEl = getEl('modalCattleTitle');
  var contentEl = getEl('modalCattleContent');
  if (!titleEl || !contentEl) return;

  titleEl.innerText = 'গরুর খাদ্য ও পুষ্টি প্রোফাইল (Tag: ' + tag + ')';

  var profileHtml = '<div style="background:#e8f5e9; padding:12px; border-radius:8px; margin-bottom:12px;">' +
    '<strong>জাত (Breed):</strong> ' + (cowInfo?.breed || '-') + ' | ' +
    '<strong>জেনারেশন:</strong> ' + (cowInfo?.generation || '-') + ' | ' +
    '<strong>স্ট্যাটাস:</strong> ' + (cowInfo?.status || '-') + '<br>' +
    '<strong>ওজন:</strong> ' + (cowInfo?.weight || 0) + ' kg | ' +
    '<strong>বিয়ান:</strong> ' + (cowInfo?.lactation || 0) +
  '</div>';

  profileHtml += '<strong>সাম্প্রতিক খাদ্য বরাদ্দ ও খরচ (Feeding History):</strong>';
  profileHtml += '<div class="table-container" style="max-height:220px; overflow-y:auto; margin-top:8px;"><table><thead><tr style="background:#f1f5f2;"><th>তারিখ</th><th>ফিড (কেজি)</th><th>ফিড রেট (₹)</th><th>সাপ্লিমেন্ট/ভিটামিন (₹)</th><th>মোট খরচ (₹)</th></tr></thead><tbody>';

  var hasRation = false;
  for (var rk in farmStore.feedRations) {
    var r = farmStore.feedRations[rk];
    if (r && (r.cowTag || '').trim().toUpperCase() === tag.toUpperCase()) {
      hasRation = true;
      profileHtml += '<tr>' +
        '<td>' + formatDateBR(r.date) + '</td>' +
        '<td>' + (r.pellet || 0) + ' kg</td>' +
        '<td>₹ ' + (r.avgCostPerKg || 0) + '</td>' +
        '<td>₹ ' + (r.suppCost || 0) + '</td>' +
        '<td style="color:green; font-weight:bold;">₹ ' + (r.totalCost || 0) + '</td>' +
      '</tr>';
    }
  }

  if (!hasRation) {
    profileHtml += '<tr><td colspan="5" style="text-align:center; color:#777;">এই গরুর জন্য কোনো রেশন রেকর্ড এন্ট্রি করা হয়নি।</td></tr>';
  }

  profileHtml += '</tbody></table></div>';
  contentEl.innerHTML = profileHtml;
  getEl('cattleFeedModal').style.display = 'flex';
};

window.closeCattleFeedModal = function() {
  getEl('cattleFeedModal').style.display = 'none';
};

function renderCattleTable() {
  var milkStats = getMilkStatsByTag();
  var list = [];
  for (var k in farmStore.cattle) list.push({ key: k, data: farmStore.cattle[k] });

  list.sort(function(a, b) {
    var tagA = (a.data.tag || '').toString();
    var tagB = (b.data.tag || '').toString();
    return tagA.localeCompare(tagB, undefined, { numeric: true, sensitivity: 'base' });
  });

  var dl = getEl('cattleTagList');
  if (dl) {
    var optHtml = '';
    list.forEach(function(item) {
      var t = (item.data.tag || '').trim();
      var b = (item.data.breed || '').trim();
      if (t) optHtml += '<option value="' + t + '">' + (b ? t + ' (' + b + ')' : t) + '</option>';
    });
    dl.innerHTML = optHtml;
  }

  var body = getEl('cattleTableBody'); 
  if (body) {
    body.innerHTML = '';
    list.forEach(function(item, index) {
      var d = item.data, k = item.key;
      var tagKey = (d.tag || '').trim().toUpperCase();
      var mInfo = milkStats[tagKey];
      var milkDisplay = mInfo && mInfo.total > 0 ? '<strong style="color:var(--primary); font-size:13px;">' + mInfo.total.toFixed(1) + ' L</strong> (' + mInfo.days + ' দিন)' : (d.milkDay ? d.milkDay + ' L/day' : '০ L');

      body.innerHTML += '<tr>' +
        '<td><strong>' + (index + 1) + '</strong></td>' +
        '<td><a href="javascript:void(0)" onclick="openCattleFeedModal(\'' + (d.tag || '') + '\')" style="color:var(--primary); font-weight:bold; text-decoration:underline;" title="প্রোফাইল দেখতে ক্লিক করুন">🐄 ' + (d.tag || '-') + '</a></td>' +
        '<td>' + (d.breed || '-') + '</td>' +
        '<td>' + (d.breedType || '-') + '</td>' +
        '<td>' + (d.generation || '-') + '</td>' +
        '<td>' + formatDateBR(d.dob) + '</td>' +
        '<td>' + (d.weight || 0) + ' kg</td>' +
        '<td>' + (d.lactation || 0) + '</td>' +
        '<td><span class="badge badge-success">' + (d.status || '-') + '</span></td>' +
        '<td>' + milkDisplay + '</td>' +
        '<td>' + (d.sire || '-') + '</td>' +
        '<td>' + formatDateBR(d.expCalving) + '</td>' +
        '<td>' +
          '<button class="action-btn btn-info" onclick="editCattle(\'' + k + '\')">Edit</button>' +
          '<button class="action-btn btn-danger" onclick="deleteRecord(\'cattle\',\'' + k + '\')">Delete</button>' +
        '</td>' +
      '</tr>';
    });
  }
  if (getEl('dash-cow-count')) getEl('dash-cow-count').innerText = list.length;
}

var eCatKey = null;
function editCattle(k) {
  var d = farmStore.cattle[k]; if (!d) return; eCatKey = k;
  getEl('cowTag').value = d.tag || ''; getEl('cowBreed').value = d.breed || ''; getEl('cowBreedType').value = d.breedType || '';
  getEl('cowGeneration').value = d.generation || 'F1'; getEl('cowDob').value = d.dob || ''; getEl('cowWeight').value = d.weight || '';
  getEl('cowLactation').value = d.lactation || ''; getEl('cowStatus').value = d.status || 'Milking'; getEl('cowMilkDay').value = d.milkDay || '';
  getEl('cowSire').value = d.sire || ''; getEl('cowDam').value = d.dam || ''; getEl('cowExpCalving').value = d.expCalving || '';
  getEl('cowSubmitBtn').innerText = 'Update Cattle'; getEl('cowCancelBtn').style.display = 'inline-flex';
  switchTab('cattle', document.querySelector('nav button:nth-child(2)'));
}

function cancelCattleEdit() {
  eCatKey = null; ['cowTag','cowBreed','cowBreedType','cowDob','cowWeight','cowLactation','cowMilkDay','cowSire','cowDam','cowExpCalving'].forEach(function(i){ getEl(i).value=''; });
  getEl('cowSubmitBtn').innerText = 'Save Cattle'; getEl('cowCancelBtn').style.display = 'none';
}

function saveCattle() {
  var tag = (getEl('cowTag').value || '').trim(); 
  if (!tag) return alert('Tag ID দিন!');
  
  var data = { 
    tag: tag, 
    breed: getEl('cowBreed').value, 
    breedType: getEl('cowBreedType').value, 
    generation: getEl('cowGeneration').value, 
    dob: getEl('cowDob').value, 
    weight: parseFloat(getEl('cowWeight').value) || 0, 
    lactation: parseFloat(getEl('cowLactation').value) || 0, 
    status: getEl('cowStatus').value, 
    milkDay: parseFloat(getEl('cowMilkDay').value) || 0, 
    sire: getEl('cowSire').value, 
    dam: getEl('cowDam').value, 
    expCalving: getEl('cowExpCalving').value 
  };

  if (db) {
    if (eCatKey) {
      db.ref('cattle/' + eCatKey).update(data).then(function() {
        console.log('Cattle updated successfully');
      }).catch(function(error) {
        console.error('Error updating cattle:', error);
        alert('ডেটা আপডেট করতে সমস্যা হয়েছে: ' + error.message);
      });
    } else {
      db.ref('cattle').push(data).then(function() {
        console.log('Cattle saved successfully');
      }).catch(function(error) {
        console.error('Error saving cattle:', error);
        alert('ডেটা সেভ করতে সমস্যা হয়েছে: ' + error.message);
      });
    }
  } else {
    alert('ডেটাবেস কানেকশন পাওয়া যায়নি!');
  }
  cancelCattleEdit();
}
