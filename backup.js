function downloadBackup() {
  if (!db) return alert('ডাটাবেস নেই!');
  db.ref('/').once('value', function(snap) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snap.val(), null, 2));
    var a = document.createElement('a'); 
    a.setAttribute("href", dataStr); 
    a.setAttribute("download", "Nanda_Dairy_Backup.json"); 
    a.click();
  });
}
