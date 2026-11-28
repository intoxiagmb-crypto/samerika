(() => {
  if (window.__samerikaAndroid) return;
  window.__samerikaAndroid = true;
  window.print = () => window.prompt('samerika:print', '');
  const exportAnchor = anchor => {
    if (!anchor || !anchor.hasAttribute('download') || !anchor.href.startsWith('blob:')) return false;
    // Start reading before the website revokes its temporary object URL.
    fetch(anchor.href).then(response => response.blob()).then(blob => {
      if (blob.size > 8 * 1024 * 1024) throw new Error('Export exceeds the 8 MB app limit. Use the website to export this report.');
      const reader = new FileReader();
      reader.onload = () => window.prompt('samerika:save', JSON.stringify({
        name: anchor.download || 'samerika-export.csv',
        mime: blob.type || 'text/csv',
        data: reader.result.split(',')[1]
      }));
      reader.readAsDataURL(blob);
    }).catch(error => window.alert(error.message || 'Export failed. Please try again.'));
    return true;
  };
  // The portal invokes click() on a detached anchor, which never bubbles to document.
  const originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (!exportAnchor(this)) originalClick.call(this);
  };
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[download]');
    if (exportAnchor(anchor)) event.preventDefault();
  }, true);
})();
