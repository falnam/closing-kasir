const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const STORAGE = "closing-kasir-v1";

let expenses = [];

function today(){
  const d = new Date();
  const local = new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,10);
}

$("date").value = today();

function addExpense(name="", amount=0){
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random());
  expenses.push({id,name,amount:Number(amount)||0});
  renderExpenses();
  calculate();
}

function renderExpenses(){
  const box = $("expenseList");
  box.innerHTML = "";
  expenses.forEach((e,i)=>{
    const row = document.createElement("div");
    row.className="expense";
    row.innerHTML = `
      <input type="text" placeholder="Keterangan" value="${escapeHtml(e.name)}" data-i="${i}" class="ename">
      <input type="number" min="0" step="100" value="${e.amount}" data-i="${i}" class="eamount">
      <button type="button" data-id="${e.id}" aria-label="hapus">×</button>`;
    row.querySelector(".ename").addEventListener("input", ev => { expenses[i].name=ev.target.value; });
    row.querySelector(".eamount").addEventListener("input", ev => { expenses[i].amount=Number(ev.target.value)||0; calculate(); });
    row.querySelector("button").addEventListener("click",()=>{expenses=expenses.filter(x=>x.id!==e.id);renderExpenses();calculate();});
    box.appendChild(row);
  });
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}

function val(id){return Number($(id).value)||0;}

function calculate(){
  const cashSales=val("cashSales"), qris=val("qris"), tax=val("tax");
  const totalExpenses=expenses.reduce((a,e)=>a+(Number(e.amount)||0),0);
  const omzet=cashSales+qris;
  // Expected cash is opening cash + cash sales - expenses - tax.
  const expected=val("openingCash")+cashSales-totalExpenses-tax;
  const actual=val("outsideCash")+val("drawerCash")+val("untrackedCash");
  const variance=actual-expected;
  $("omzet").textContent=money(omzet);
  $("expenseTotal").textContent=money(totalExpenses);
  $("expectedCash").textContent=money(expected);
  $("actualCash").textContent=money(actual);
  $("variance").textContent=(variance>=0?"+":"")+money(variance);
  $("sumOmzet").textContent=money(omzet);
  $("sumExpected").textContent=money(expected);
  $("sumActual").textContent=money(actual);
  $("sumVariance").textContent=(variance>=0?"+":"")+money(variance);
  $("sumVariance").className=variance===0?"":"";
}

["cashSales","qris","tax","openingCash","outsideCash","drawerCash","untrackedCash"].forEach(id=>$(id).addEventListener("input",calculate));
$("addExpense").addEventListener("click",()=>addExpense());

function getHistory(){return JSON.parse(localStorage.getItem(STORAGE)||"[]");}
function saveHistory(items){localStorage.setItem(STORAGE,JSON.stringify(items));}

function collect(){
  const cashSales=val("cashSales"), qris=val("qris"), tax=val("tax");
  const totalExpenses=expenses.reduce((a,e)=>a+(Number(e.amount)||0),0);
  const omzet=cashSales+qris;
  const expected=val("openingCash")+cashSales-totalExpenses-tax;
  const actual=val("outsideCash")+val("drawerCash")+val("untrackedCash");
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date:$("date").value, cashier:$("cashier").value.trim(),
    cashSales,qris,omzet,tax,taxNote:$("taxNote").value.trim(),
    expenses:expenses.filter(e=>e.name.trim()||e.amount).map(e=>({name:e.name.trim(),amount:Number(e.amount)||0})),
    totalExpenses,openingCash:val("openingCash"),outsideCash:val("outsideCash"),
    drawerCash:val("drawerCash"),untrackedCash:val("untrackedCash"),
    actual,expected,variance:actual-expected,note:$("note").value.trim(),
    savedAt:new Date().toISOString()
  };
}

$("closingForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!$("cashier").value.trim()){alert("Nama kasir wajib diisi.");return;}
  const item=collect();
  const items=getHistory();
  const existing=items.findIndex(x=>x.date===item.date);
  if(existing>=0){
    if(!confirm("Sudah ada closing untuk tanggal ini. Timpa data tersebut?")) return;
    item.id=items[existing].id;
    items[existing]=item;
  }else items.push(item);
  items.sort((a,b)=>b.date.localeCompare(a.date));
  saveHistory(items);
  renderHistory();
  alert("Closing berhasil disimpan.");
});

function resetForm(){
  $("closingForm").reset();
  $("date").value=today();
  expenses=[];
  renderExpenses();calculate();
}
$("resetBtn").addEventListener("click",resetForm);

function loadItem(item){
  $("date").value=item.date;$("cashier").value=item.cashier;
  $("cashSales").value=item.cashSales;$("qris").value=item.qris;$("tax").value=item.tax;
  $("taxNote").value=item.taxNote||"";$("openingCash").value=item.openingCash;
  $("outsideCash").value=item.outsideCash;$("drawerCash").value=item.drawerCash;$("untrackedCash").value=item.untrackedCash;
  $("note").value=item.note||"";
  expenses=(item.expenses||[]).map((e,i)=>({id:String(i),name:e.name,amount:e.amount}));
  renderExpenses();calculate();
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderHistory(){
  const box=$("history"), items=getHistory();
  if(!items.length){box.innerHTML='<div class="history-empty">Belum ada closing.</div>';return;}
  box.innerHTML=items.map(item=>{
    const sign=item.variance>=0?"+":"";
    const cls=item.variance===0?"":item.variance>0?"positive":"negative";
    const exp=(item.expenses||[]).map(e=>`${escapeHtml(e.name||"Tanpa keterangan")}: ${money(e.amount)}`).join("<br>");
    return `<article class="history-item">
      <div class="history-head"><strong>${escapeHtml(item.date)} · ${escapeHtml(item.cashier)}</strong><span class="badge ${cls}">${sign}${money(item.variance)}</span></div>
      <div class="history-grid">
        <div><span>Omzet</span><b>${money(item.omzet)}</b></div>
        <div><span>QRIS/Transfer</span><b>${money(item.qris)}</b></div>
        <div><span>Pengeluaran</span><b>${money(item.totalExpenses)}</b></div>
        <div><span>Pajak</span><b>${money(item.tax)}</b></div>
        <div><span>Cash seharusnya</span><b>${money(item.expected)}</b></div>
        <div><span>Cash aktual</span><b>${money(item.actual)}</b></div>
      </div>
      ${exp?`<div class="history-note"><b>Pengeluaran:</b><br>${exp}</div>`:""}
      ${item.note?`<div class="history-note"><b>Catatan:</b> ${escapeHtml(item.note)}</div>`:""}
      <div class="history-actions">
        <button class="secondary small" onclick='window.loadClosing(${JSON.stringify(item.id)})'>Edit</button>
        <button class="danger small" onclick='window.deleteClosing(${JSON.stringify(item.id)})'>Hapus</button>
      </div>
    </article>`;
  }).join("");
}
window.loadClosing=id=>{const x=getHistory().find(i=>i.id===id);if(x)loadItem(x);};
window.deleteClosing=id=>{
  if(!confirm("Hapus closing ini?"))return;
  saveHistory(getHistory().filter(i=>i.id!==id));renderHistory();
};

$("clearBtn").addEventListener("click",()=>{
  if(confirm("Hapus seluruh riwayat closing dari browser ini?")){localStorage.removeItem(STORAGE);renderHistory();}
});

$("exportBtn").addEventListener("click",()=>{
  const items=getHistory();
  if(!items.length){alert("Belum ada data untuk diexport.");return;}
  const header=["Tanggal","Kasir","Tunai","QRIS/Transfer","Omzet","Pajak","Total Pengeluaran","Saldo Awal","Cash Luar Laci","Cash Laci","Cash Belum Dihitung","Cash Aktual","Cash Seharusnya","Selisih","Catatan"];
  const rows=items.map(x=>[x.date,x.cashier,x.cashSales,x.qris,x.omzet,x.tax,x.totalExpenses,x.openingCash,x.outsideCash,x.drawerCash,x.untrackedCash,x.actual,x.expected,x.variance,x.note||""]);
  const csv=[header,...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="riwayat-closing.csv";a.click();URL.revokeObjectURL(a.href);
});

addExpense("Receh",0);
renderHistory();
calculate();
