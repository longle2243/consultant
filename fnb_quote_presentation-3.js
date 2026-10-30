const STORE_KEY="webQuoteDataV2";
let DEFAULTS;
let data;
let current=0;
const $=id=>document.getElementById(id);
function money(n){return Number(n||0).toLocaleString("vi-VN")+" VNĐ"}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function saveData(){try{localStorage.setItem(STORE_KEY,JSON.stringify(data))}catch(e){}}
function pctNum(s){const n=parseFloat(String(s).replace(",","."));return isNaN(n)?0:n}
function installments(price){
 // Tính tiền theo %; đợt cuối lấy phần còn lại để tổng luôn khớp giá gói.
 const pcts=data.payments.map(p=>pctNum(p.pct));
 const sum=pcts.reduce((a,b)=>a+b,0);
 let amounts=pcts.map(p=>Math.round(price*p/100));
 if(Math.abs(sum-100)<0.001&&amounts.length){amounts[amounts.length-1]=price-amounts.slice(0,-1).reduce((a,b)=>a+b,0)}
 return {amounts,sum,total:amounts.reduce((a,b)=>a+b,0)};
}
function countUp(el,to,dur=850){
 if(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches){el.textContent=money(to);return}
 const t0=performance.now();
 (function f(t){const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=money(Math.round(to*e));if(k<1)requestAnimationFrame(f)})(t0);
}
let enterTimer;
function replay(){
 const slides=document.querySelectorAll(".slide"),s=slides[current];
 slides.forEach(x=>x.classList.remove("enter"));void s.offsetWidth;s.classList.add("enter");
 clearTimeout(enterTimer);enterTimer=setTimeout(()=>s.classList.remove("enter"),1700);
}
function render(anim){
 const pkg=data.packages[data.selected]||data.packages[0];
 $("brandName").textContent=data.brand;$("footerBrand").textContent=data.brand+" · ĐỀ XUẤT DỊCH VỤ";$("footerBrand2").textContent=data.brand+" · BÁO GIÁ THIẾT KẾ WEBSITE";$("footerBrand3").textContent=data.brand+" · LỘ TRÌNH TRIỂN KHAI";
 $("heroTitle").innerHTML=escapeHTML(data.title).replace(/\n/g,"<br>");$("heroDesc").textContent=data.desc;$("scopeIntro").textContent=data.scopeIntro;
 // Màn 1: gom theo nhóm
 const groups=[];data.scope.forEach(r=>{let g=groups.find(x=>x.name===r[0]);if(!g){g={name:r[0],rows:[]};groups.push(g)}g.rows.push(r)});
 $("scopeGroups").innerHTML=groups.map((g,gi)=>`<article class="svc-group" style="--i:${gi}"><div class="svc-head"><div class="iconbox">${String.fromCharCode(65+gi)}</div><h3>${escapeHTML(g.name)}</h3></div><div class="svc-cols"><span>Hạng mục</span><span>Nội dung</span><span>Số lượng / thời gian</span></div>${g.rows.map(r=>`<div class="svc-row"><div class="svc-name">${escapeHTML(r[1])}</div><div class="svc-desc">${escapeHTML(r[2])}</div><div>${r[3]?`<span class="svc-qty">${escapeHTML(r[3])}</span>`:""}</div></div>`).join("")}</article>`).join("");
 // Màn 2
 $("priceCards").innerHTML=data.packages.map((p,i)=>`<article style="--i:${i}" class="card price-card ${p.featured?"featured":""} ${i===data.selected?"selected":""}">${p.featured?'<span class="ribbon">ĐƯỢC ĐỀ XUẤT</span>':""}<span class="tag">${i===0?"PHỔ THÔNG":i===1?"ƯA THÍCH":"CAO CẤP"}</span><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.sub)}</p><div class="price">${money(p.price)}<br><small>/ phí thiết kế website</small></div><ul class="scope-list">${p.features.map(f=>`<li>${escapeHTML(f)}</li>`).join("")}</ul><button class="btn" onclick="selectPackage(${i})">${i===data.selected?"Đang chọn ✓":"Chọn gói "+escapeHTML(p.name)+" →"}</button></article>`).join("");
 // Màn 3
 $("processSteps").innerHTML=data.process.map((p,i)=>`<div class="step" style="--i:${i}"><div class="step-head"><div class="num">0${i+1}</div></div><h3>${escapeHTML(p.name)}</h3><div class="time">${escapeHTML(p.time)}</div><p>${escapeHTML(p.desc)}</p></div>`).join("");
 const inst=installments(pkg.price);
 $("payPkgLine").textContent="Gói "+pkg.name+" · "+money(pkg.price)+" (chưa gồm tên miền, hosting)";
 $("payPills").innerHTML=data.packages.map((p,i)=>`<button class="pill ${i===data.selected?"active":""}" onclick="selectPackage(${i},true)">${escapeHTML(p.name)}</button>`).join("");
 $("paymentRows").innerHTML=data.payments.map((p,i)=>`<div class="payitem" style="--i:${i}"><div class="pct">${escapeHTML(p.pct)}</div><strong data-v="${inst.amounts[i]}">${money(inst.amounts[i])}</strong><span>${escapeHTML(p.name)}</span><p style="font-size:11px;color:#c8d4e7;margin:7px 0 0">${escapeHTML(p.desc)}</p></div>`).join("");
 $("payTotal").textContent=money(inst.total);
 if(anim){document.querySelectorAll("#paymentRows strong[data-v]").forEach(el=>countUp(el,Number(el.dataset.v)));countUp($("payTotal"),inst.total)}
 $("payWarn").textContent=Math.abs(inst.sum-100)<0.001?"":"Lưu ý: tổng tỷ lệ các đợt đang là "+inst.sum+"%, cần bằng 100%.";
 $("processNote").textContent=data.note;
 document.querySelectorAll(".navlinks button").forEach((b,i)=>b.classList.toggle("active",i===current));
 document.querySelectorAll(".dot").forEach((d,i)=>d.classList.toggle("active",i===current));
 $("prevBtn").disabled=current===0;$("nextBtn").disabled=current===2;
 $("progressBar").style.width=((current+1)/3*100)+"%";
}
function go(i){const prev=current;current=Math.max(0,Math.min(2,i));document.querySelectorAll(".slide").forEach((s,j)=>s.classList.toggle("active",j===current));render(current===2&&prev!==2);replay();window.scrollTo({top:0,behavior:"smooth"})}
function selectPackage(i,silent){
 data.selected=i;saveData();render(current===2);
 if(!silent)showToast("Đã chọn gói "+data.packages[i].name+". Bấm Tiếp theo để xem quy trình và số tiền từng đợt.");
}
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(Number(b.dataset.go))));
$("prevBtn").onclick=()=>go(current-1);$("nextBtn").onclick=()=>go(current+1);
function fillEditor(){
 $("editBrand").value=data.brand;$("editClient").value=data.client;$("editTitle").value=data.title;$("editDesc").value=data.desc;
 $("editScope").value=data.scope.map(s=>s.join(" | ")).join("\n");
 data.packages.forEach((p,i)=>{$("editPrice"+i).value=p.price;$("editSub"+i).value=p.sub;$("editFeatures"+i).value=p.features.join("\n")});
 $("editProcess").value=data.process.map(p=>p.name+" | "+p.time+" | "+p.desc).join("\n");
 $("editPayments").value=data.payments.map(p=>p.pct+" | "+p.name+" | "+p.desc).join("\n");$("editNote").value=data.note;
}
function parseLines(v,cols){return v.split("\n").map(x=>x.trim()).filter(Boolean).map(line=>{let parts=line.split("|").map(x=>x.trim());while(parts.length<cols)parts.push("");return parts})}
function openEditor(){fillEditor();$("editorOverlay").classList.add("open")}
$("openEditor").onclick=openEditor;$("closeEditor").onclick=()=>$("editorOverlay").classList.remove("open");
$("editorOverlay").addEventListener("click",e=>{if(e.target===$("editorOverlay"))$("editorOverlay").classList.remove("open")});
$("saveBtn").onclick=()=>{
 data.brand=$("editBrand").value.trim()||DEFAULTS.brand;data.client=$("editClient").value.trim();data.title=$("editTitle").value.trim()||DEFAULTS.title;data.desc=$("editDesc").value;
 data.scope=parseLines($("editScope").value,4).map(p=>[p[0]||"Dịch vụ",p[1],p[2],p[3]]);
 data.packages=data.packages.map((p,i)=>({...p,price:Number($("editPrice"+i).value)||0,sub:$("editSub"+i).value,features:$("editFeatures"+i).value.split("\n").map(s=>s.trim()).filter(Boolean)}));
 data.process=parseLines($("editProcess").value,3).map(p=>({name:p[0],time:p[1],desc:p[2]}));
 data.payments=parseLines($("editPayments").value,3).map(p=>({pct:p[0],name:p[1],desc:p[2]}));data.note=$("editNote").value;
 saveData();render();$("editorOverlay").classList.remove("open");showToast("Đã lưu nội dung trên trình duyệt này.");
};
$("resetBtn").onclick=()=>{if(confirm("Khôi phục toàn bộ nội dung mẫu?")){data=structuredClone(DEFAULTS);try{localStorage.removeItem(STORE_KEY)}catch(e){}fillEditor();render();showToast("Đã khôi phục nội dung mẫu.")}};
$("printBtn").onclick=()=>window.print();
let toastTimer;function showToast(msg){$("toast").textContent=msg;$("toast").style.display="block";clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").style.display="none",3200)}
document.addEventListener("keydown",e=>{const open=$("editorOverlay").classList.contains("open");if(e.key==="ArrowRight"&&!open)go(current+1);if(e.key==="ArrowLeft"&&!open)go(current-1);if(e.key==="Escape")$("editorOverlay").classList.remove("open")});
async function loadDefaults(){
 try{
  const response=await fetch("./fnb_quote_presentation-3.json");
  if(!response.ok)throw new Error("HTTP "+response.status);
  DEFAULTS=await response.json();
  data=structuredClone(DEFAULTS);
  try{const saved=localStorage.getItem(STORE_KEY);if(saved)data={...structuredClone(DEFAULTS),...JSON.parse(saved)}}catch(e){}
  if(!data.packages[data.selected])data.selected=1;
  render();replay();
 }catch(error){
  console.error("Không thể tải dữ liệu báo giá:",error);
  const loadError=$("loadError");
  loadError.hidden=false;
  loadError.textContent="Không tải được dữ liệu báo giá. Hãy chạy thư mục qua local web server (ví dụ: python3 -m http.server), rồi truy cập trang qua http://localhost:8000/fnb_quote_presentation-3.html.";
 }
}
loadDefaults();
