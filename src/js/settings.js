/* Shop settings dialog. */
function buildSet() {
  $('#priceRows').innerHTML = Object.keys(SIZES).map(k => `<label class="row"><span>${SIZES[k][0]}${k === 'custom' ? '' : ' <small style="color:var(--mute)">' + SIZES[k][1] + ' × ' + SIZES[k][2] + '</small>'}</span><input class="in" data-p="${k}" type="number" min="0" step="0.5" value="${S.pp[k]}" aria-label="Price per ${SIZES[k][0]} photo"></label>`).join('');
  $('#sCur').value = S.cur; $('#sMar').value = S.margin; $('#sGap').value = S.gap; $('#sCut').checked = S.cut; $('#sShow').checked = S.showPrice;
}
$('#openSet').onclick = () => { buildSet(); $('#set').showModal(); };
$('#setClose').onclick = () => $('#set').close();
const setChange = fn => e => { fn(e); saveSettings(); refresh(); };
$('#priceRows').oninput = setChange(e => { const k = e.target.dataset.p; if (k) S.pp[k] = Math.max(0, +e.target.value || 0); });
$('#sCur').oninput = setChange(e => { S.cur = e.target.value || '₹'; });
$('#sMar').oninput = setChange(e => { S.margin = Math.max(0, +e.target.value || 0); });
$('#sGap').oninput = setChange(e => { S.gap = Math.max(0, +e.target.value || 0); });
$('#sCut').onchange = setChange(e => { S.cut = e.target.checked; });
$('#sShow').onchange = setChange(e => { S.showPrice = e.target.checked; });
