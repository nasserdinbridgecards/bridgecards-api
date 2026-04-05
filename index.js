<!DOCTYPE html>
<html lang="ar" dir="rtl" id="htmlRoot">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BridgeCards – جسر الكروت</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#07080f;--bg2:#0d0e1a;--surface:#111220;--card:#161728;
  --border:#252740;--border2:#2e3155;
  --accent:#3d6bff;--accent2:#ff4f7b;--accent3:#00d4aa;--gold:#ffbe00;
  --text:#eef0ff;--sub:#9294b8;
  --r:14px;--rsm:8px;--rpill:100px;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);font-family:'Cairo',sans-serif;overflow-x:hidden;min-height:100vh;}
[dir=ltr]{font-family:'Sora',sans-serif;}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 800px 600px at 10% 20%,rgba(61,107,255,.07),transparent 70%),
             radial-gradient(ellipse 600px 500px at 90% 80%,rgba(255,79,123,.06),transparent 70%),
             linear-gradient(rgba(61,107,255,.025) 1px,transparent 1px),
             linear-gradient(90deg,rgba(61,107,255,.025) 1px,transparent 1px);
  background-size:auto,auto,52px 52px,52px 52px;}

/* TOPBAR */
.topbar{background:linear-gradient(90deg,var(--accent),var(--accent2));padding:8px;text-align:center;font-size:13px;font-weight:700;position:relative;z-index:200;}

/* NAV */
nav{position:sticky;top:0;z-index:150;background:rgba(7,8,15,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);height:66px;display:flex;align-items:center;padding:0 16px;gap:10px;overflow:visible;}
.logo{display:flex;align-items:center;gap:9px;text-decoration:none;flex-shrink:0;}
.logo-icon{width:36px;height:36px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;}
.logo-text{font-size:16px;font-weight:900;color:var(--text);}
.logo-text small{display:block;font-size:10px;color:var(--sub);line-height:1;}
.nav-cats{display:flex;gap:1px;flex:1;justify-content:center;list-style:none;min-width:0;overflow:hidden;}
.nav-cat{position:relative;}
.nav-cat>a{padding:5px 8px;border-radius:var(--rsm);color:var(--sub);text-decoration:none;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:3px;transition:all .2s;white-space:nowrap;}
.nav-cat>a:hover,.nav-cat.open>a{color:var(--text);background:rgba(255,255,255,.05);}
.chev{font-size:9px;opacity:.6;transition:transform .2s;}
.nav-cat.open .chev{transform:rotate(180deg);}
.drop{display:none;position:fixed;top:66px;left:0;right:0;background:rgba(9,9,20,.97);backdrop-filter:blur(20px);border-bottom:1px solid var(--border2);z-index:140;padding:24px 32px 28px;animation:fadeDown .2s ease;}
.nav-cat.open .drop{display:block;}
.sdrop{display:none;position:absolute;top:calc(100% + 6px);inset-inline-start:0;min-width:170px;background:rgba(9,9,20,.97);border:1px solid var(--border2);border-radius:var(--r);padding:5px;z-index:141;animation:fadeDown .2s ease;}
.nav-cat.open .sdrop{display:block;}
.sdrop a{display:block;padding:8px 12px;border-radius:8px;color:var(--sub);font-size:13px;font-weight:600;text-decoration:none;cursor:pointer;transition:all .18s;}
.sdrop a:hover{background:rgba(61,107,255,.1);color:var(--text);}
.drop-inner{max-width:1200px;margin:0 auto;display:grid;gap:24px;}
.drop-inner.c2{grid-template-columns:repeat(2,1fr);}
.drop-inner.c3{grid-template-columns:repeat(3,1fr);}
.drop-inner.c4{grid-template-columns:repeat(4,1fr);}
.drop-col-title{font-size:10px;font-weight:800;color:var(--sub);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:12px;padding-bottom:7px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;}
.ditem{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:9px;text-decoration:none;color:var(--sub);font-size:12px;font-weight:600;transition:all .18s;cursor:pointer;}
.ditem:hover{background:rgba(61,107,255,.1);color:var(--text);}
.ditem-logo{width:32px;height:24px;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
.ditem-logo img{max-width:28px;max-height:20px;object-fit:contain;}
.ditem-info{}
.ditem-name{font-size:12px;font-weight:700;color:var(--text);line-height:1.2;}
.ditem-sub{font-size:10px;color:var(--sub);}
.dbadge{margin-inline-start:auto;font-size:10px;font-weight:800;background:rgba(255,79,123,.15);color:var(--accent2);padding:2px 5px;border-radius:4px;flex-shrink:0;}
@keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

/* NAV RIGHT */
.nav-right{display:flex;gap:8px;align-items:center;flex-shrink:0;}
.curr-sel{background:var(--bg2);border:1px solid var(--border2);border-radius:var(--rsm);color:var(--text);font-family:inherit;font-size:11px;font-weight:700;padding:5px 6px;cursor:pointer;outline:none;max-width:82px;}
.lang-btn{display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid var(--border2);border-radius:var(--rsm);background:transparent;color:var(--sub);cursor:pointer;font-size:11px;font-weight:700;font-family:inherit;transition:all .2s;}
.lang-btn:hover{border-color:var(--accent);color:var(--accent);}
.cart-btn{position:relative;padding:5px 9px;border:1px solid var(--border2);border-radius:var(--rsm);background:transparent;color:var(--text);cursor:pointer;display:flex;align-items:center;gap:4px;font-size:12px;font-family:inherit;font-weight:700;transition:all .2s;}
.cart-btn:hover{border-color:var(--accent);}
.cart-n{position:absolute;top:-7px;inset-inline-end:-7px;background:var(--accent2);color:#fff;font-size:10px;font-weight:900;width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.cart-n.bump{animation:bump .3s ease;}
@keyframes bump{0%{transform:scale(1)}50%{transform:scale(1.5)}100%{transform:scale(1)}}
.btn-o{padding:5px 10px;border:1px solid var(--border2);border-radius:var(--rsm);background:transparent;color:var(--text);cursor:pointer;font-size:11px;font-family:inherit;font-weight:700;transition:all .2s;}
.btn-o:hover{border-color:var(--accent);color:var(--accent);}
.btn-f{padding:5px 10px;border:none;border-radius:var(--rsm);background:var(--accent);color:#fff;cursor:pointer;font-size:11px;font-family:inherit;font-weight:700;transition:all .2s;}
.btn-f:hover{background:#2f5ae0;}
.nav-user{display:none;align-items:center;gap:7px;cursor:pointer;position:relative;}
.nav-user-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;}
.nav-user-name{font-size:13px;font-weight:700;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.udrop{display:none;position:absolute;top:42px;inset-inline-end:0;background:var(--card);border:1px solid var(--border2);border-radius:var(--r);min-width:150px;z-index:300;padding:5px;}
.nav-user.open .udrop{display:block;}
.udrop a{display:block;padding:9px 13px;font-size:13px;color:var(--sub);text-decoration:none;border-radius:7px;transition:all .18s;cursor:pointer;}
.udrop a:hover{background:rgba(61,107,255,.08);color:var(--text);}

/* HERO */
.hero{position:relative;z-index:1;padding:72px 24px 48px;text-align:center;max-width:800px;margin:0 auto;}
.hero-badge{display:inline-flex;align-items:center;gap:7px;background:rgba(61,107,255,.12);border:1px solid rgba(61,107,255,.3);border-radius:var(--rpill);padding:5px 16px;font-size:12px;font-weight:700;color:var(--accent);margin-bottom:20px;}
.hero h1{font-size:clamp(24px,5vw,50px);font-weight:900;line-height:1.15;margin-bottom:14px;}
.hero h1 em{font-style:normal;background:linear-gradient(100deg,var(--accent),var(--accent2) 60%,var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.hero p{font-size:15px;color:var(--sub);line-height:1.75;max-width:520px;margin:0 auto 28px;}
.hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
.btn-big{padding:13px 26px;border-radius:12px;font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .25s;}
.btn-big-p{background:linear-gradient(135deg,var(--accent),#6b4eff);color:#fff;border:none;box-shadow:0 8px 28px rgba(61,107,255,.4);}
.btn-big-p:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(61,107,255,.5);}
.btn-big-g{background:transparent;color:var(--text);border:1px solid var(--border2);}
.btn-big-g:hover{border-color:var(--accent);color:var(--accent);}

/* STATS */
.stats{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);gap:1px;margin-bottom:56px;}
.stat{background:var(--bg2);padding:22px 18px;text-align:center;}
.stat-n{font-size:26px;font-weight:900;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:block;margin-bottom:3px;}
.stat-l{font-size:12px;color:var(--sub);font-weight:600;}

/* SECTION */
.sec{position:relative;z-index:1;max-width:1200px;margin:0 auto 64px;padding:0 24px;}
.sec-hd{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;}
.sec-title{font-size:20px;font-weight:800;}
.sec-title em{font-style:normal;color:var(--accent);}
.sec-sub{font-size:12px;color:var(--sub);margin-top:2px;}

/* FILTER TABS */
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:22px;}
.tab{padding:7px 14px;border-radius:var(--rsm);border:1px solid var(--border);background:transparent;color:var(--sub);cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;transition:all .2s;}
.tab:hover{color:var(--text);border-color:var(--border2);}
.tab.on{background:var(--accent);border-color:var(--accent);color:#fff;}

/* PRODUCT GRID */
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:13px;}
.pc{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:all .22s;display:flex;flex-direction:column;}
.pc:hover{border-color:var(--accent);transform:translateY(-4px);box-shadow:0 14px 36px rgba(61,107,255,.18);}
.pc-head{height:120px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:12px;}
.pc-head::after{content:'';position:absolute;top:-50%;left:-60%;width:40%;height:200%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);transform:skewX(-15deg);transition:left .6s;pointer-events:none;}
.pc:hover .pc-head::after{left:130%;}
.pc-logo{max-height:60px;max-width:110px;object-fit:contain;border-radius:4px;transition:transform .3s;}
.pc:hover .pc-logo{transform:scale(1.06);}
.pc-badge{position:absolute;top:8px;inset-inline-start:8px;background:var(--accent2);color:#fff;font-size:10px;font-weight:900;padding:2px 7px;border-radius:5px;}
.pc-chip{position:absolute;bottom:7px;inset-inline-end:7px;background:rgba(0,0,0,.45);backdrop-filter:blur(4px);color:rgba(255,255,255,.7);font-size:9px;font-weight:800;padding:2px 6px;border-radius:20px;letter-spacing:.6px;text-transform:uppercase;}
.pc-fallback{font-size:11px;font-weight:800;color:rgba(255,255,255,.9);text-align:center;padding:4px;display:none;}
.pc-body{padding:10px 12px 12px;flex:1;display:flex;flex-direction:column;min-height:0;}
.pc-name{font-size:13px;font-weight:800;margin-bottom:3px;}
.pc-reg{font-size:11px;color:var(--sub);margin-bottom:8px;}
.denoms{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;}
.den{padding:3px 7px;border-radius:5px;border:1px solid var(--border2);background:transparent;color:var(--sub);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s;}
.den:hover{border-color:var(--accent);color:var(--accent);}
.den.on{background:var(--accent);border-color:var(--accent);color:#fff;}
.pc-pr-row{display:flex;align-items:center;justify-content:space-between;margin-top:auto;}
.pc-old{font-size:10px;color:var(--sub);text-decoration:line-through;line-height:1;}
.pc-price{font-size:15px;font-weight:900;color:var(--accent3);line-height:1.2;}
.pc-disc{font-size:10px;font-weight:800;color:var(--accent2);background:rgba(255,79,123,.12);padding:2px 5px;border-radius:4px;margin-top:2px;display:inline-block;}
.add-btn{padding:5px 12px;border:none;border-radius:var(--rsm);background:var(--accent);color:#fff;font-size:12px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .2s;}
.add-btn:hover{background:#2f5ae0;transform:scale(1.05);}

/* BENEFITS */
.ben-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:13px;}
.ben{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:18px;display:flex;gap:12px;align-items:flex-start;transition:border-color .2s;}
.ben:hover{border-color:var(--accent);}
.ben-ic{width:40px;height:40px;border-radius:10px;background:rgba(61,107,255,.1);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
.ben-title{font-size:13px;font-weight:800;margin-bottom:4px;}
.ben-desc{font-size:12px;color:var(--sub);line-height:1.6;}

/* TIERS */
.tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.tier{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:26px 20px;text-align:center;position:relative;transition:all .25s;}
.tier:hover{transform:translateY(-4px);}
.tier.hot{border-color:var(--accent);background:linear-gradient(160deg,#181a36,var(--card));box-shadow:0 0 40px rgba(61,107,255,.15);}
.tier-pop{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,var(--accent),var(--accent2));color:#fff;font-size:11px;font-weight:800;padding:3px 14px;border-radius:var(--rpill);white-space:nowrap;}
.tier-name{font-size:11px;font-weight:800;color:var(--sub);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;}
.tier-disc{font-size:44px;font-weight:900;line-height:1;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px;}
.tier-vol{font-size:12px;color:var(--sub);margin-bottom:14px;}
.tier-ul{list-style:none;text-align:start;margin-bottom:18px;}
.tier-ul li{font-size:12px;color:var(--sub);padding:5px 0;border-bottom:1px solid var(--border);display:flex;gap:7px;align-items:center;}
.tier-ul li:last-child{border:none;}
.tier-ul li::before{content:'✓';color:var(--accent3);font-weight:900;flex-shrink:0;}
.tier-btn{width:100%;padding:10px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-size:13px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .2s;}
.tier-btn:hover{background:#2f5ae0;transform:translateY(-1px);}

/* STEPS */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;}
.step{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:22px 16px;position:relative;}
.step-n{font-size:34px;font-weight:900;color:var(--border2);position:absolute;top:10px;inset-inline-end:12px;line-height:1;}
.step-ic{font-size:26px;margin-bottom:10px;display:block;}
.step-title{font-size:13px;font-weight:800;margin-bottom:4px;}
.step-desc{font-size:12px;color:var(--sub);line-height:1.6;}

/* CONTACT */
.contact{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start;}
.ci h2{font-size:26px;font-weight:900;margin-bottom:10px;}
.ci p{color:var(--sub);line-height:1.75;margin-bottom:18px;font-size:14px;}
.cpts{list-style:none;display:flex;flex-direction:column;gap:10px;}
.cpt{display:flex;gap:9px;align-items:center;font-size:13px;color:var(--sub);}
.cform{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.fg{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;}
.fg label{font-size:11px;font-weight:800;color:var(--sub);text-transform:uppercase;letter-spacing:.7px;}
.fg input,.fg select,.fg textarea{background:var(--bg2);border:1px solid var(--border);border-radius:9px;padding:10px 12px;color:var(--text);font-family:inherit;font-size:13px;outline:none;transition:border-color .2s;}
.fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--accent);}
.fg select option{background:var(--card);}
.fg textarea{resize:vertical;min-height:75px;}
.fsub{width:100%;padding:12px;border:none;border-radius:9px;background:linear-gradient(135deg,var(--accent),#6b4eff);color:#fff;font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .25s;box-shadow:0 6px 20px rgba(61,107,255,.3);}
.fsub:hover{transform:translateY(-1px);}

/* FOOTER — see new CSS above */

/* CART DRAWER */
.cart-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:400;opacity:0;pointer-events:none;transition:opacity .3s;}
.cart-ov.open{opacity:1;pointer-events:all;}
.cart-dr{position:fixed;top:0;inset-inline-end:0;width:400px;max-width:100vw;height:100vh;background:var(--surface);border-inline-start:1px solid var(--border);z-index:450;transform:translateX(110%);transition:transform .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;}
[dir=rtl] .cart-dr{transform:translateX(-110%);}
.cart-dr.open{transform:translateX(0)!important;}
.cart-hd{padding:18px 18px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.cart-hd h3{font-size:15px;font-weight:800;}
.close-x{width:30px;height:30px;border-radius:50%;border:1px solid var(--border);background:transparent;color:var(--sub);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.close-x:hover{border-color:var(--accent2);color:var(--accent2);}
.cart-list{flex:1;overflow-y:auto;padding:13px;}
.cart-empty{text-align:center;padding:48px 20px;color:var(--sub);}
.ci-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:10px;display:flex;gap:9px;align-items:flex-start;margin-bottom:8px;}
.ci-thumb{width:50px;height:36px;border-radius:5px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.ci-thumb img{max-width:44px;max-height:30px;object-fit:contain;}
.ci-info{flex:1;min-width:0;}
.ci-name{font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ci-den{font-size:11px;color:var(--sub);margin-bottom:3px;}
.ci-qty{display:flex;align-items:center;gap:5px;}
.qbtn{width:20px;height:20px;border-radius:4px;border:1px solid var(--border2);background:transparent;color:var(--text);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .2s;font-family:inherit;}
.qbtn:hover{border-color:var(--accent);color:var(--accent);}
.qnum{font-size:12px;font-weight:700;min-width:16px;text-align:center;}
.ci-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;}
.ci-price{font-size:13px;font-weight:900;color:var(--accent3);}
.ci-del{width:24px;height:24px;border-radius:50%;border:1px solid var(--border);background:transparent;color:var(--sub);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
.ci-del:hover{border-color:var(--accent2);color:var(--accent2);}
.cart-foot{padding:14px;border-top:1px solid var(--border);flex-shrink:0;}
.crow{display:flex;justify-content:space-between;font-size:12px;color:var(--sub);margin-bottom:4px;}
.crow.total{font-size:14px;font-weight:900;color:var(--text);border-top:1px solid var(--border);padding-top:8px;margin-top:4px;}
.crow.total span:last-child{color:var(--accent3);}
.checkout-btn{width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--accent),#6b4eff);color:#fff;font-size:14px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .25s;box-shadow:0 6px 20px rgba(61,107,255,.35);margin-top:11px;}
.checkout-btn:hover{transform:translateY(-1px);}
.checkout-btn:disabled{opacity:.4;cursor:not-allowed;transform:none;}

/* MODAL */
.modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:500;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s;padding:20px;}
.modal-ov.open{opacity:1;pointer-events:all;}
.modal{background:var(--surface);border:1px solid var(--border2);border-radius:18px;width:100%;max-height:90vh;overflow-y:auto;}
.mhd{padding:20px 22px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
.mhd h2{font-size:16px;font-weight:800;}
.mbody{padding:20px 22px;}

/* CHECKOUT */
#ckModal .modal{max-width:640px;}
.ck-steps{display:flex;gap:0;margin-bottom:20px;border-radius:9px;overflow:hidden;border:1px solid var(--border);}
.cks{flex:1;padding:9px;text-align:center;font-size:11px;font-weight:700;color:var(--sub);background:var(--bg2);cursor:pointer;border-inline-end:1px solid var(--border);}
.cks:last-child{border:none;}
.cks.active{background:var(--accent);color:#fff;}
.cks.done{background:rgba(0,212,170,.1);color:var(--accent3);}
.ck-panel{display:none;}
.ck-panel.active{display:block;}
.pm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:9px;margin-bottom:14px;}
.pmc{background:var(--card);border:2px solid var(--border);border-radius:10px;padding:12px 10px;text-align:center;cursor:pointer;transition:all .2s;}
.pmc:hover{border-color:var(--accent);}
.pmc.sel{border-color:var(--accent);background:rgba(61,107,255,.08);}
.pmc-icon{font-size:24px;margin-bottom:5px;}
.pmc-name{font-size:11px;font-weight:700;color:var(--text);}
.pmc-sub{font-size:10px;color:var(--sub);margin-top:1px;}
.pmc-reg{font-size:10px;color:var(--accent);margin-top:2px;font-weight:700;}
.ck-actions{display:flex;gap:9px;margin-top:16px;}
.btn-back{flex:1;padding:11px;border:1px solid var(--border2);border-radius:9px;background:transparent;color:var(--text);font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;transition:all .2s;}
.btn-back:hover{border-color:var(--accent);}
.btn-next{flex:2;padding:11px;border:none;border-radius:9px;background:linear-gradient(135deg,var(--accent),#6b4eff);color:#fff;font-size:13px;font-weight:800;font-family:inherit;cursor:pointer;transition:all .25s;}
.btn-next:hover{transform:translateY(-1px);}
.os-row{display:flex;justify-content:space-between;font-size:12px;color:var(--sub);padding:5px 0;border-bottom:1px solid var(--border);}
.os-row:last-child{border:none;font-weight:800;color:var(--text);font-size:14px;}
.os-row span:last-child{color:var(--accent3);}
.os-box{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px;}
.success-box{text-align:center;padding:20px 0;}
.code-box{background:var(--bg2);border:1px dashed var(--accent3);border-radius:9px;padding:12px;margin:14px 0;font-size:16px;font-weight:900;letter-spacing:3px;color:var(--accent3);text-align:center;cursor:pointer;}
.fst{font-size:12px;font-weight:800;color:var(--sub);text-transform:uppercase;letter-spacing:.7px;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid var(--border);}

/* AUTH */
#authModal .modal{max-width:400px;}
.auth-tabs{display:flex;background:var(--bg2);border-radius:9px;padding:3px;margin-bottom:18px;}
.atab{flex:1;padding:8px;border-radius:7px;text-align:center;font-size:13px;font-weight:700;cursor:pointer;color:var(--sub);transition:all .2s;}
.atab.on{background:var(--accent);color:#fff;}
.apanel{display:none;}
.apanel.on{display:block;}
.auth-div{text-align:center;color:var(--sub);font-size:12px;margin:12px 0;position:relative;}
.auth-div::before,.auth-div::after{content:'';position:absolute;top:50%;width:38%;height:1px;background:var(--border);}
.auth-div::before{inset-inline-start:0;}
.auth-div::after{inset-inline-end:0;}
.soc-btns{display:flex;gap:7px;}
.soc-btn{flex:1;padding:9px;border:1px solid var(--border2);border-radius:8px;background:transparent;color:var(--text);font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .2s;}
.soc-btn:hover{border-color:var(--accent);}
.auth-sub{width:100%;padding:12px;border:none;border-radius:9px;background:linear-gradient(135deg,var(--accent),#6b4eff);color:#fff;font-size:13px;font-weight:800;font-family:inherit;cursor:pointer;margin-top:3px;transition:all .25s;}
.auth-sub:hover{transform:translateY(-1px);}
.auth-ft{text-align:center;font-size:12px;color:var(--sub);margin-top:10px;}
.auth-ft a{color:var(--accent);cursor:pointer;font-weight:700;}
.aerr{background:rgba(255,79,123,.1);border:1px solid rgba(255,79,123,.3);border-radius:7px;padding:9px 12px;font-size:12px;color:var(--accent2);margin-bottom:10px;display:none;}
.aerr.show{display:block;}

/* TOAST */
.toast{position:fixed;bottom:22px;inset-inline-end:22px;z-index:600;background:var(--accent3);color:#07080f;font-size:13px;font-weight:800;padding:10px 16px;border-radius:9px;transform:translateY(60px);opacity:0;transition:all .3s;pointer-events:none;}
.toast.show{transform:translateY(0);opacity:1;}

/* RESPONSIVE */
@media(max-width:960px){.tiers{grid-template-columns:1fr;}.steps{grid-template-columns:1fr 1fr;}.contact{grid-template-columns:1fr;}.stats{grid-template-columns:repeat(2,1fr);}}
@media(max-width:640px){nav{padding:0 12px;gap:8px;}.nav-cats{display:none;}.hero{padding:48px 16px 32px;}.sec{padding:0 14px;}.steps{grid-template-columns:1fr;}.frow{grid-template-columns:1fr;}footer{flex-direction:column;align-items:flex-start;}.cart-dr{width:100vw;}}


/* ─── STAR RATINGS ─── */
.pc-stars{display:flex;align-items:center;flex-wrap:nowrap;margin-bottom:5px;line-height:1;}
/* ─── SEARCH SYSTEM ─── */
.search-wrap{position:relative;margin-bottom:14px;}
.search-input{width:100%;padding:11px 44px 11px 16px;background:var(--card);border:1px solid var(--border2);border-radius:11px;color:var(--text);font-family:inherit;font-size:14px;outline:none;transition:border-color .25s,box-shadow .25s;}
.search-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(61,107,255,.12);}
.search-input::placeholder{color:var(--sub);}
.search-clear{position:absolute;top:50%;transform:translateY(-50%);inset-inline-end:12px;background:none;border:none;color:var(--sub);font-size:15px;cursor:pointer;padding:4px 6px;border-radius:50%;transition:all .2s;display:none;line-height:1;}
.search-clear:hover{color:var(--accent2);background:rgba(255,79,123,.1);}
.search-clear.vis{display:block;}
.search-stats{font-size:11px;color:var(--sub);min-height:15px;}
.search-stats em{color:var(--accent3);font-style:normal;font-weight:700;}
.no-results{grid-column:1/-1;text-align:center;padding:52px 20px;}
.no-results-icon{font-size:48px;margin-bottom:12px;}
.no-results h3{font-size:15px;font-weight:800;color:var(--text);margin-bottom:5px;}
.no-results p{font-size:13px;color:var(--sub);}
.no-res-btn{margin-top:14px;padding:8px 20px;border:1px solid var(--accent);border-radius:8px;background:transparent;color:var(--accent);cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;transition:all .2s;}
.no-res-btn:hover{background:var(--accent);color:#fff;}

/* ─── SORT BAR ─── */
.sort-bar{display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
.sort-lbl{font-size:11px;color:var(--sub);font-weight:700;flex-shrink:0;}
.sort-btn{padding:5px 12px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--sub);font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .18s;}
.sort-btn:hover{border-color:var(--border2);color:var(--text);}
.sort-btn.on{background:var(--accent);border-color:var(--accent);color:#fff;}
.sort-right{margin-inline-start:auto;}

/* ─── AVAILABILITY ─── */
.av-badge{position:absolute;top:8px;inset-inline-end:8px;font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px;letter-spacing:.4px;text-transform:uppercase;}
.av-in {background:rgba(0,212,170,.15);color:var(--accent3);border:1px solid rgba(0,212,170,.3);}
.av-low{background:rgba(255,190,0,.15);color:var(--gold);border:1px solid rgba(255,190,0,.3);}
.av-out{background:rgba(255,79,123,.15);color:var(--accent2);border:1px solid rgba(255,79,123,.3);}
.add-btn:disabled,.add-btn.sold{opacity:.45;cursor:not-allowed !important;transform:none !important;background:var(--border2);color:var(--sub);}

/* ─── PAYMENT COMING SOON ─── */
.pmc.csoon{opacity:.45;cursor:not-allowed;}
.pmc.csoon::after{content:attr(data-soon);display:block;font-size:9px;color:var(--gold);font-weight:800;margin-top:3px;}

/* ─── FOOTER GRID ─── */
footer{position:relative;z-index:1;background:var(--bg2);border-top:1px solid var(--border);padding:52px 40px 28px;}
.footer-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.8fr 1fr 1fr 1.1fr;gap:48px;margin-bottom:40px;}
.footer-brand-desc{font-size:12px;color:var(--sub);line-height:1.8;margin-top:12px;max-width:280px;}
.footer-col h4{font-size:10px;font-weight:800;color:var(--sub);text-transform:uppercase;letter-spacing:1.4px;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid var(--border);}
.footer-col a{display:block;font-size:13px;color:var(--sub);text-decoration:none;margin-bottom:9px;transition:color .2s;cursor:pointer;}
.footer-col a:hover{color:var(--text);}
.fci{display:flex;align-items:flex-start;gap:9px;font-size:12px;color:var(--sub);margin-bottom:10px;line-height:1.5;}
.fci a{color:var(--accent3);text-decoration:none;font-size:12px;}
.fci a:hover{color:var(--text);}
.footer-bottom{max-width:1200px;margin:0 auto;border-top:1px solid var(--border);padding-top:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
.footer-bottom p{font-size:11px;color:var(--sub);}
.fbl{display:flex;gap:16px;flex-wrap:wrap;}
.fbl a{font-size:11px;color:var(--sub);text-decoration:none;cursor:pointer;transition:color .2s;}
.fbl a:hover{color:var(--accent3);}
@media(max-width:960px){.footer-grid{grid-template-columns:1fr 1fr;gap:32px;}}
@media(max-width:480px){.footer-grid{grid-template-columns:1fr 1fr;gap:18px;}.footer-brand-desc{display:none;}}

/* ─── PRODUCT DETAIL MODAL ─── */
#pdModal .modal{max-width:600px;}
.pd-head{border-radius:12px;height:155px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:18px;}
.pd-logo{max-height:80px;max-width:140px;object-fit:contain;}
.pd-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:18px;}
.pd-info-box{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:11px;text-align:center;}
.pd-info-lbl{font-size:10px;color:var(--sub);margin-bottom:3px;}
.pd-info-val{font-size:12px;font-weight:800;}
.pd-dens{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:7px;margin-bottom:16px;}
.pd-den{padding:9px 8px;border:2px solid var(--border);border-radius:9px;text-align:center;cursor:pointer;transition:all .18s;}
.pd-den:hover{border-color:var(--accent);}
.pd-den.on{border-color:var(--accent);background:rgba(61,107,255,.1);}
.pd-den-l{display:block;font-size:12px;font-weight:800;color:var(--text);}
.pd-den-p{display:block;font-size:11px;color:var(--accent3);margin-top:2px;}
.pd-den-s{display:block;font-size:10px;color:var(--accent2);}
.pd-price-box{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px;}
.pd-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;}
.pd-row.big{font-size:16px;font-weight:900;margin-bottom:0;}

</style>
<script src="https://js.stripe.com/v3/"></script>
</head>
<body>

<div class="topbar" id="topbar-txt">🎉 خصم 2% عند الدفع بالكريبتو — كود: CRYPTO2 &nbsp;|&nbsp; تسليم فوري ⚡</div>

<nav>
  <a href="#" class="logo">
    <div class="logo-icon">🌉</div>
    <div class="logo-text">BridgeCards<small id="logo-sub">جسر الكروت</small></div>
  </a>

  <ul class="nav-cats" id="navCats">
    <li class="nav-cat" data-ni="0"><a id="nc0">🎁 <span id="nc0t">بطاقات الهدايا</span> <span class="chev">▾</span></a>
      <div class="drop"><div class="drop-inner c4" id="drop0">
        <div><div class="drop-col-title"><span>🛍️</span><span id="dc00">تسوق وتقنية</span></div>
          <a class="ditem" onclick="jcat('gift','amazon')"><div class="ditem-logo" style="background:linear-gradient(135deg,#131921,#ff9900)"><img src="https://www.google.com/s2/favicons?domain=amazon.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Amazon</div><div class="ditem-sub">$10–$200</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('gift','ebay')"><div class="ditem-logo" style="background:linear-gradient(135deg,#e53238,#0064d2)"><img src="https://www.google.com/s2/favicons?domain=ebay.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">eBay</div><div class="ditem-sub">$25–$200</div></div><span class="dbadge">-6%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🎵</span><span id="dc01">ترفيه</span></div>
          <a class="ditem" onclick="jcat('gift','netflix')"><div class="ditem-logo" style="background:linear-gradient(135deg,#141414,#e50914)"><img src="https://www.google.com/s2/favicons?domain=netflix.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Netflix</div><div class="ditem-sub">$15–$100</div></div><span class="dbadge">-5%</span></a>
          <a class="ditem" onclick="jcat('gift','spotify')"><div class="ditem-logo" style="background:linear-gradient(135deg,#121212,#1db954)"><img src="https://www.google.com/s2/favicons?domain=spotify.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Spotify</div><div class="ditem-sub">$10–$60</div></div><span class="dbadge">-5%</span></a>
        </div>
        <div><div class="drop-col-title"><span>📱</span><span id="dc02">تطبيقات</span></div>
          <a class="ditem" onclick="jcat('gift','google')"><div class="ditem-logo" style="background:linear-gradient(135deg,#01875f,#4285f4)"><img src="https://www.google.com/s2/favicons?domain=play.google.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Google Play</div><div class="ditem-sub">$5–$100</div></div><span class="dbadge">-8%</span></a>
          <a class="ditem" onclick="jcat('gift','apple')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1c1c1e,#3a3a3c)"><img src="https://www.google.com/s2/favicons?domain=apple.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">App Store</div><div class="ditem-sub">$10–$100</div></div><span class="dbadge">-7%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🏠</span><span id="dc03">أثاث ومنزل</span></div>
          <a class="ditem" onclick="jcat('home','ikea')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0051a2,#ffda1a)"><img src="https://www.google.com/s2/favicons?domain=ikea.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">IKEA</div><div class="ditem-sub">€25–€250</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('home','wayfair')"><div class="ditem-logo" style="background:linear-gradient(135deg,#7b2d8b,#a044b0)"><img src="https://www.google.com/s2/favicons?domain=wayfair.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Wayfair</div><div class="ditem-sub">$25–$200</div></div><span class="dbadge">-6%</span></a>
        </div>
      </div></div>
    </li>

    <li class="nav-cat" data-ni="1"><a id="nc1">🎮 <span id="nc1t">رصيد الألعاب</span> <span class="chev">▾</span></a>
      <div class="drop"><div class="drop-inner c4">
        <div><div class="drop-col-title"><span>🖥️</span><span id="dc10">كونسول</span></div>
          <a class="ditem" onclick="jcat('game','psn')"><div class="ditem-logo" style="background:linear-gradient(135deg,#003087,#0070d1)"><img src="https://www.google.com/s2/favicons?domain=playstation.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">PlayStation</div><div class="ditem-sub">$10–$100</div></div><span class="dbadge">-10%</span></a>
          <a class="ditem" onclick="jcat('game','xbox')"><div class="ditem-logo" style="background:linear-gradient(135deg,#107c10,#52b043)"><img src="https://www.google.com/s2/favicons?domain=xbox.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Xbox</div><div class="ditem-sub">$5–$50</div></div><span class="dbadge">-9%</span></a>
          <a class="ditem" onclick="jcat('game','nintendo')"><div class="ditem-logo" style="background:linear-gradient(135deg,#e60012,#ff4444)"><img src="https://www.google.com/s2/favicons?domain=nintendo.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Nintendo eShop</div><div class="ditem-sub">$10–$50</div></div><span class="dbadge">-8%</span></a>
        </div>
        <div><div class="drop-col-title"><span>💻</span><span id="dc11">PC</span></div>
          <a class="ditem" onclick="jcat('game','steam')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1b2838,#2a475e)"><img src="https://www.google.com/s2/favicons?domain=steampowered.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Steam</div><div class="ditem-sub">$5–$100</div></div><span class="dbadge">-8%</span></a>
          <a class="ditem" onclick="jcat('game','ea')"><div class="ditem-logo" style="background:linear-gradient(135deg,#ff4500,#ff6a00)"><img src="https://www.google.com/s2/favicons?domain=ea.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">EA Play</div><div class="ditem-sub">Monthly/Annual</div></div><span class="dbadge">-18%</span></a>
          <a class="ditem" onclick="jcat('game','razer')"><div class="ditem-logo" style="background:linear-gradient(135deg,#000,#00c800)"><img src="https://www.google.com/s2/favicons?domain=razer.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Razer Gold</div><div class="ditem-sub">$5–$25</div></div><span class="dbadge">-10%</span></a>
        </div>
        <div><div class="drop-col-title"><span>📱</span><span id="dc12">موبايل</span></div>
          <a class="ditem" onclick="jcat('game','pubg')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1a1a1a,#f7a21b)"><img src="https://www.google.com/s2/favicons?domain=pubg.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">PUBG Mobile</div><div class="ditem-sub">60–1800 UC</div></div><span class="dbadge">-12%</span></a>
          <a class="ditem" onclick="jcat('game','freefire')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1a0a2e,#ff4500)"><img src="https://www.google.com/s2/favicons?domain=garena.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Free Fire</div><div class="ditem-sub">100–1060 💎</div></div><span class="dbadge">-9%</span></a>
          <a class="ditem" onclick="jcat('game','roblox')"><div class="ditem-logo" style="background:linear-gradient(135deg,#cc0000,#ff4444)"><img src="https://www.google.com/s2/favicons?domain=roblox.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Roblox</div><div class="ditem-sub">$10–$50</div></div><span class="dbadge">-7%</span></a>
          <a class="ditem" onclick="jcat('game','yalla-ludo')"><div class="ditem-logo" style="background:linear-gradient(135deg,#4a0072,#ff4d00)"><span style="font-size:9px;font-weight:900;color:#ffe066;">Yalla</span></div><div class="ditem-info"><div class="ditem-name">Yalla Ludo 💎</div><div class="ditem-sub">50–3000 💎</div></div><span class="dbadge">-10%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🏆</span><span id="dc13">Battle Royale</span></div>
          <a class="ditem" onclick="jcat('game','fortnite')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1900ff,#00cfff)"><img src="https://www.google.com/s2/favicons?domain=epicgames.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Fortnite V-Bucks</div><div class="ditem-sub">1000–5000</div></div><span class="dbadge">-11%</span></a>
        </div>
      </div></div>
    </li>

    <li class="nav-cat" data-ni="2"><a id="nc2">💳 <span id="nc2t">مسبقة الدفع</span> <span class="chev">▾</span></a>
      <div class="drop"><div class="drop-inner c3">
        <div><div class="drop-col-title"><span>💳</span><span id="dc20">بطاقات دولية</span></div>
          <a class="ditem" onclick="jcat('prepaid','visa')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1a1f71,#0057b7)"><img src="https://www.google.com/s2/favicons?domain=visa.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Visa Prepaid</div><div class="ditem-sub">$10–$200</div></div><span class="dbadge">-4%</span></a>
          <a class="ditem" onclick="jcat('prepaid','mc')"><div class="ditem-logo" style="background:linear-gradient(135deg,#252525,#eb001b)"><img src="https://www.google.com/s2/favicons?domain=mastercard.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Mastercard</div><div class="ditem-sub">$10–$250</div></div><span class="dbadge">-5%</span></a>
          <a class="ditem" onclick="jcat('prepaid','amex')"><div class="ditem-logo" style="background:linear-gradient(135deg,#007bc1,#00a3e0)"><img src="https://www.google.com/s2/favicons?domain=americanexpress.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">American Express</div><div class="ditem-sub">$25–$200</div></div><span class="dbadge">-4%</span></a>
          <a class="ditem" onclick="jcat('prepaid','visa-gift')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1a1f71,#ff9900)"><img src="https://www.google.com/s2/favicons?domain=visa.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Visa Gift</div><div class="ditem-sub">$10–$200</div></div><span class="dbadge">-4%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🌐</span><span id="dc21">محافظ رقمية</span></div>
          <a class="ditem" onclick="jcat('prepaid','astropay')"><div class="ditem-logo" style="background:linear-gradient(135deg,#003087,#009cde)"><img src="https://www.google.com/s2/favicons?domain=astropay.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">AstroPay</div><div class="ditem-sub">$10–$100</div></div><span class="dbadge">-5%</span></a>
          <a class="ditem" onclick="jcat('prepaid','jetoncash')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0d0d26,#5c6bc0)"><img src="https://www.google.com/s2/favicons?domain=jeton.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">JetonCash</div><div class="ditem-sub">€10–€200</div></div><span class="dbadge">-5%</span></a>
          <a class="ditem" onclick="jcat('prepaid','neosurf')"><div class="ditem-logo" style="background:linear-gradient(135deg,#7f0000,#e53935)"><img src="https://www.google.com/s2/favicons?domain=neosurf.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Neosurf</div><div class="ditem-sub">€10–€100</div></div><span class="dbadge">-5%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🔐</span><span id="dc22">PIN Cards</span></div>
          <a class="ditem" onclick="jcat('prepaid','flexepin')"><div class="ditem-logo" style="background:linear-gradient(135deg,#003066,#0080ff)"><img src="https://www.google.com/s2/favicons?domain=flexepin.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Flexepin</div><div class="ditem-sub">$10–$150</div></div><span class="dbadge">-5%</span></a>
          <a class="ditem" onclick="jcat('prepaid','prepaidy')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0d47a1,#42a5f5)"><img src="https://www.google.com/s2/favicons?domain=prepaidy.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Prepaidy</div><div class="ditem-sub">€10–€100</div></div><span class="dbadge">-5%</span></a>
        </div>
      </div></div>
    </li>

    <li class="nav-cat" data-ni="3"><a id="nc3">₿ <span id="nc3t">كريبتو</span> <span class="chev">▾</span></a>
      <div class="drop"><div class="drop-inner c4">
        <div><div class="drop-col-title"><span>🏦</span><span id="dc30">بورصات</span></div>
          <a class="ditem" onclick="jcat('crypto','binance')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1a1208,#f3ba2f)"><img src="https://www.google.com/s2/favicons?domain=binance.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Binance</div><div class="ditem-sub">$10–$500</div></div></a>
          <a class="ditem" onclick="jcat('crypto','bybit')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0d0d1a,#f7a600)"><img src="https://www.google.com/s2/favicons?domain=bybit.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Bybit</div><div class="ditem-sub">$10–$200</div></div></a>
          <a class="ditem" onclick="jcat('crypto','coinbase')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0a0b1e,#0052ff)"><img src="https://www.google.com/s2/favicons?domain=coinbase.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Coinbase</div><div class="ditem-sub">$25–$200</div></div></a>
          <a class="ditem" onclick="jcat('crypto','okx')"><div class="ditem-logo" style="background:#000"><img src="https://www.google.com/s2/favicons?domain=okx.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">OKX</div><div class="ditem-sub">$25–$250</div></div></a>
        </div>
        <div><div class="drop-col-title"><span>₿</span><span id="dc31">عملات</span></div>
          <a class="ditem" onclick="jcat('crypto','btc')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1a0d00,#f7931a)"><span style="font-size:16px;">₿</span></div><div class="ditem-info"><div class="ditem-name">Bitcoin BTC</div><div class="ditem-sub">$25–$500</div></div></a>
          <a class="ditem" onclick="jcat('crypto','eth')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0d1435,#627eea)"><span style="font-size:16px;">Ξ</span></div><div class="ditem-info"><div class="ditem-name">Ethereum ETH</div><div class="ditem-sub">$25–$500</div></div></a>
          <a class="ditem" onclick="jcat('crypto','bnb')"><div class="ditem-logo" style="background:linear-gradient(135deg,#1a1000,#f3ba2f)"><span style="font-size:12px;font-weight:900;color:#f3ba2f;">BNB</span></div><div class="ditem-info"><div class="ditem-name">BNB</div><div class="ditem-sub">$25–$250</div></div></a>
        </div>
        <div><div class="drop-col-title"><span>💵</span><span id="dc32">مستقرة</span></div>
          <a class="ditem" onclick="jcat('crypto','usdt')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0d2818,#26a17b)"><span style="font-size:14px;font-weight:900;color:#26a17b;">₮</span></div><div class="ditem-info"><div class="ditem-name">USDT</div><div class="ditem-sub">$10–$1000</div></div></a>
          <a class="ditem" onclick="jcat('crypto','usdc')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0a1f45,#2775ca)"><span style="font-size:10px;font-weight:900;color:#2775ca;">USDC</span></div><div class="ditem-info"><div class="ditem-name">USDC</div><div class="ditem-sub">$10–$500</div></div></a>
        </div>
        <div><div class="drop-col-title"><span>🔄</span><span id="dc33">منصات أخرى</span></div>
          <a class="ditem" onclick="jcat('crypto','kucoin')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0a1628,#24ae8f)"><img src="https://www.google.com/s2/favicons?domain=kucoin.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">KuCoin</div><div class="ditem-sub">$10–$100</div></div></a>
          <a class="ditem" onclick="jcat('crypto','gateio')"><div class="ditem-logo" style="background:linear-gradient(135deg,#0b1426,#00b897)"><img src="https://www.google.com/s2/favicons?domain=gate.io&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Gate.io</div><div class="ditem-sub">$10–$100</div></div></a>
        </div>
      </div></div>
    </li>

    <li class="nav-cat" data-ni="4"><a id="nc4">👗 <span id="nc4t">أزياء</span> <span class="chev">▾</span></a>
      <div class="drop"><div class="drop-inner c4">
        <div><div class="drop-col-title"><span>🌐</span><span id="dc40">عالمي</span></div>
          <a class="ditem" onclick="jcat('fashion','zara')"><div class="ditem-logo" style="background:#000"><img src="https://www.google.com/s2/favicons?domain=zara.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Zara</div><div class="ditem-sub">€20–€150</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('fashion','hm')"><div class="ditem-logo" style="background:#cc0000"><img src="https://www.google.com/s2/favicons?domain=hm.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">H&M</div><div class="ditem-sub">€20–€100</div></div><span class="dbadge">-7%</span></a>
          <a class="ditem" onclick="jcat('fashion','nike')"><div class="ditem-logo" style="background:#111"><img src="https://www.google.com/s2/favicons?domain=nike.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Nike</div><div class="ditem-sub">$25–$100</div></div><span class="dbadge">-7%</span></a>
          <a class="ditem" onclick="jcat('fashion','adidas')"><div class="ditem-logo" style="background:#000"><img src="https://www.google.com/s2/favicons?domain=adidas.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Adidas</div><div class="ditem-sub">$25–$100</div></div><span class="dbadge">-7%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🇬🇧</span><span id="dc41">UK / Online</span></div>
          <a class="ditem" onclick="jcat('fashion','asos')"><div class="ditem-logo" style="background:linear-gradient(135deg,#2c2c2c,#2a6ebb)"><img src="https://www.google.com/s2/favicons?domain=asos.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">ASOS</div><div class="ditem-sub">£10–£100</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('fashion','macys')"><div class="ditem-logo" style="background:linear-gradient(135deg,#8b0000,#b22222)"><img src="https://www.google.com/s2/favicons?domain=macys.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Macy's</div><div class="ditem-sub">$25–$100</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('fashion','uniqlo')"><div class="ditem-logo" style="background:#cc0000"><img src="https://www.google.com/s2/favicons?domain=uniqlo.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Uniqlo</div><div class="ditem-sub">¥1000–¥5000</div></div><span class="dbadge">-7%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🇹🇷</span><span id="dc42">تركية 1</span></div>
          <a class="ditem" onclick="jcat('fashion','lcwaikiki')"><div class="ditem-logo" style="background:#e60026"><img src="https://www.google.com/s2/favicons?domain=lcwaikiki.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">LC Waikiki</div><div class="ditem-sub">250–5000 ₺</div></div><span class="dbadge">-7%</span></a>
          <a class="ditem" onclick="jcat('fashion','defacto')"><div class="ditem-logo" style="background:#000"><img src="https://www.google.com/s2/favicons?domain=defacto.com.tr&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">DeFacto</div><div class="ditem-sub">250–2000 ₺</div></div><span class="dbadge">-7%</span></a>
          <a class="ditem" onclick="jcat('fashion','koton')"><div class="ditem-logo" style="background:#1a1a1a"><img src="https://www.google.com/s2/favicons?domain=koton.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Koton</div><div class="ditem-sub">250–2000 ₺</div></div><span class="dbadge">-7%</span></a>
          <a class="ditem" onclick="jcat('fashion','boyner')"><div class="ditem-logo" style="background:#e60033"><img src="https://www.google.com/s2/favicons?domain=boyner.com.tr&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Boyner</div><div class="ditem-sub">250–5000 ₺</div></div><span class="dbadge">-7%</span></a>
        </div>
        <div><div class="drop-col-title"><span>👑</span><span id="dc43">تركية فاخرة</span></div>
          <a class="ditem" onclick="jcat('fashion','beymen')"><div class="ditem-logo" style="background:#1c1c1c"><img src="https://www.google.com/s2/favicons?domain=beymen.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Beymen</div><div class="ditem-sub">1000–10000 ₺</div></div><span class="dbadge">-7%</span></a>
          <a class="ditem" onclick="jcat('fashion','vakko')"><div class="ditem-logo" style="background:#0d0d0d"><img src="https://www.google.com/s2/favicons?domain=vakko.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Vakko</div><div class="ditem-sub">1000–5000 ₺</div></div><span class="dbadge">-7%</span></a>
          <a class="ditem" onclick="jcat('fashion','mango-tr')"><div class="ditem-logo" style="background:#111"><img src="https://www.google.com/s2/favicons?domain=mango.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Mango</div><div class="ditem-sub">500–2000 ₺</div></div><span class="dbadge">-7%</span></a>
        </div>
      </div></div>
    </li>

    <li class="nav-cat" data-ni="5"><a id="nc5">🛒 <span id="nc5t">سوبرماركت</span> <span class="chev">▾</span></a>
      <div class="drop"><div class="drop-inner c3">
        <div><div class="drop-col-title"><span>🇺🇸</span><span id="dc50">أمريكا</span></div>
          <a class="ditem" onclick="jcat('retail','walmart')"><div class="ditem-logo" style="background:linear-gradient(135deg,#004c97,#0071ce)"><img src="https://www.google.com/s2/favicons?domain=walmart.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Walmart</div><div class="ditem-sub">$10–$500</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('retail','target')"><div class="ditem-logo" style="background:#cc0000"><img src="https://www.google.com/s2/favicons?domain=target.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Target</div><div class="ditem-sub">$10–$200</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('retail','costco')"><div class="ditem-logo" style="background:#005daa"><img src="https://www.google.com/s2/favicons?domain=costco.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Costco</div><div class="ditem-sub">$25–$500</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('retail','kroger')"><div class="ditem-logo" style="background:#1b3a6b"><img src="https://www.google.com/s2/favicons?domain=kroger.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Kroger</div><div class="ditem-sub">$10–$100</div></div><span class="dbadge">-6%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🌍</span><span id="dc51">عالمي وخليجي</span></div>
          <a class="ditem" onclick="jcat('retail','carrefour')"><div class="ditem-logo" style="background:#004a97"><img src="https://www.google.com/s2/favicons?domain=carrefour.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Carrefour</div><div class="ditem-sub">SAR / AED</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('retail','noon')"><div class="ditem-logo" style="background:#feee00"><img src="https://www.google.com/s2/favicons?domain=noon.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Noon</div><div class="ditem-sub">UAE/KSA/EGY</div></div><span class="dbadge">-5%</span></a>
          <a class="ditem" onclick="jcat('retail','lulu-hypermarket')"><div class="ditem-logo" style="background:#e63946"><img src="https://www.google.com/s2/favicons?domain=luluhypermarket.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">LuLu</div><div class="ditem-sub">AED</div></div><span class="dbadge">-5%</span></a>
          <a class="ditem" onclick="jcat('retail','aliexpress')"><div class="ditem-logo" style="background:#ff4747"><img src="https://www.google.com/s2/favicons?domain=aliexpress.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">AliExpress</div><div class="ditem-sub">$10–$100</div></div><span class="dbadge">-6%</span></a>
        </div>
        <div><div class="drop-col-title"><span>🍔</span><span id="dc52">طعام ومطاعم</span></div>
          <a class="ditem" onclick="jcat('food','starbucks')"><div class="ditem-logo" style="background:linear-gradient(135deg,#00704a,#008f5d)"><img src="https://www.google.com/s2/favicons?domain=starbucks.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Starbucks</div><div class="ditem-sub">$10–$50</div></div><span class="dbadge">-5%</span></a>
          <a class="ditem" onclick="jcat('food','mcdonalds')"><div class="ditem-logo" style="background:linear-gradient(135deg,#da291c,#ffc72c)"><img src="https://www.google.com/s2/favicons?domain=mcdonalds.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">McDonald's</div><div class="ditem-sub">$10–$50</div></div><span class="dbadge">-6%</span></a>
          <a class="ditem" onclick="jcat('food','ubereats')"><div class="ditem-logo" style="background:linear-gradient(135deg,#000,#06c167)"><img src="https://www.google.com/s2/favicons?domain=ubereats.com&sz=128" onerror="this.style.display='none'"></div><div class="ditem-info"><div class="ditem-name">Uber Eats</div><div class="ditem-sub">$15–$100</div></div><span class="dbadge">-6%</span></a>
        </div>
      </div></div>
    </li>

    <li class="nav-cat" data-ni="6"><a id="nc6">🤝 <span id="nc6t">الجملة</span> <span class="chev">▾</span></a>
      <div class="sdrop">
        <a onclick="openAuth('register')" id="sd1">انضم كشريك</a>
        <a onclick="document.getElementById('sec-products').scrollIntoView({behavior:'smooth'})" id="sd2">تصفح الكتالوج</a>
        <a onclick="openAuth('login')" id="sd3">تسجيل الدخول</a>
      </div>
    </li>
  </ul>

  <div class="nav-right">
    <select class="curr-sel" id="currSel">
      <option value="USD">$ USD</option><option value="EUR">€ EUR</option>
      <option value="GBP">£ GBP</option><option value="NOK">kr NOK</option>
      <option value="SEK">kr SEK</option><option value="SAR">﷼ SAR</option>
      <option value="KWD">د.ك KWD</option><option value="AED">د.إ AED</option>
      <option value="EGP">ج.م EGP</option><option value="MAD">د.م MAD</option>
      <option value="TRY">₺ TRY</option><option value="LYD">ل.د LYD</option>
    </select>
    <button class="lang-btn" onclick="toggleLang()">🌐 <span id="lang-lbl">EN</span></button>
    <button class="cart-btn" onclick="openCart()">🛒 <span id="cart-nav-total">$0.00</span><div class="cart-n" id="cartN">0</div></button>
    <div id="guestBtns" style="display:flex;gap:7px;">
      <button class="btn-o" onclick="openAuth('login')" id="btn-login">تسجيل الدخول</button>
      <button class="btn-f" onclick="openAuth('register')" id="btn-reg">إنشاء حساب</button>
    </div>
    <div class="nav-user" id="navUser">
      <div class="nav-user-av" id="navAv">م</div>
      <span class="nav-user-name" id="navName">مستخدم</span>
      <div class="udrop">
        <a id="dd1" onclick="openMyOrders()">طلباتي</a>
        <a id="dd2">الملف الشخصي</a>
        <a onclick="logout()">تسجيل الخروج</a>
      </div>
    </div>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-badge" id="hb">🤝 برنامج شركاء الجملة العالمي</div>
  <h1 id="hh">اشترِ بطاقات الهدايا<br><em>بأسعار الجملة الحصرية</em></h1>
  <p id="hp">انضم لآلاف الموزعين حول العالم. تسليم فوري، خصومات تصل لـ 15%، ودعم على مدار الساعة.</p>
  <div class="hero-btns">
    <button class="btn-big btn-big-p" id="hbtn1" onclick="openAuth('register')">ابدأ كشريك الآن</button>
    <button class="btn-big btn-big-g" id="hbtn2" onclick="document.getElementById('sec-products').scrollIntoView({behavior:'smooth'})">تصفح الكتالوج</button>
  </div>
</section>

<!-- STATS -->
<div class="stats">
  <div class="stat"><span class="stat-n">+18,000</span><div class="stat-l" id="sl1">شريك نشط</div></div>
  <div class="stat"><span class="stat-n">87+</span><div class="stat-l" id="sl2">منتج رقمي</div></div>
  <div class="stat"><span class="stat-n">15%</span><div class="stat-l" id="sl3">أقصى خصم</div></div>
  <div class="stat"><span class="stat-n">24/7</span><div class="stat-l" id="sl4">تسليم فوري</div></div>
</div>

<!-- PRODUCTS -->
<div class="sec" id="sec-products">
  <div class="sec-hd">
    <div><div class="sec-title" id="st1">كتالوج <em>المنتجات</em></div><div class="sec-sub" id="st2">اختر الفئة والسعر المناسب</div></div>
  </div>
  <!-- SEARCH -->
  <div class="search-wrap">
    <input class="search-input" id="searchInput"
      placeholder="🔍 ابحث عن بطاقة... (Steam, Amazon, PSN, كريبتو...)"
      oninput="handleSearch()" onkeydown="if(event.key==='Escape')clearSearch()"
      autocomplete="off" spellcheck="false">
    <button class="search-clear" id="searchClear" onclick="clearSearch()">✕</button>
  </div>
  <!-- SORT BAR -->
  <div class="sort-bar">
    <span class="sort-lbl" id="sort-lbl">ترتيب:</span>
    <button class="sort-btn on" id="s-def" onclick="setSort('default',this)">الافتراضي</button>
    <button class="sort-btn" id="s-pa"  onclick="setSort('price-asc',this)">الأرخص</button>
    <button class="sort-btn" id="s-pd"  onclick="setSort('price-desc',this)">الأغلى</button>
    <button class="sort-btn" id="s-disc" onclick="setSort('discount',this)">أعلى خصم</button>
    <span class="search-stats sort-right" id="searchStats"></span>
  </div>
  <div class="tabs" id="filterTabs">
    <button class="tab on" onclick="filterTab(this,'all')" id="tb-all">🏷️ <span id="tbl-all">الكل</span></button>
    <button class="tab" onclick="filterTab(this,'game')" id="tb-game">🎮 <span id="tbl-game">ألعاب</span></button>
    <button class="tab" onclick="filterTab(this,'gift')" id="tb-gift">🎁 <span id="tbl-gift">هدايا</span></button>
    <button class="tab" onclick="filterTab(this,'prepaid')" id="tb-pre">💳 <span id="tbl-pre">مسبقة الدفع</span></button>
    <button class="tab" onclick="filterTab(this,'crypto')" id="tb-crypto">₿ <span id="tbl-crypto">كريبتو</span></button>
    <button class="tab" onclick="filterTab(this,'fashion')" id="tb-fash">👗 <span id="tbl-fash">أزياء</span></button>
    <button class="tab" onclick="filterTab(this,'retail')" id="tb-ret">🛒 <span id="tbl-ret">سوبرماركت</span></button>
    <button class="tab" onclick="filterTab(this,'home')" id="tb-home">🛋️ <span id="tbl-home">أثاث</span></button>
    <button class="tab" onclick="filterTab(this,'electronics')" id="tb-elec">📱 <span id="tbl-elec">إلكترونيات</span></button>
    <button class="tab" onclick="filterTab(this,'food')" id="tb-food">🍔 <span id="tbl-food">طعام</span></button>
  </div>
  <div class="pgrid" id="pgrid"></div>
</div>

<!-- BENEFITS -->
<div class="sec">
  <div class="sec-hd"><div><div class="sec-title" id="bent">لماذا <em>BridgeCards؟</em></div></div></div>
  <div class="ben-grid">
    <div class="ben"><div class="ben-ic">💸</div><div><div class="ben-title" id="b1t">خصومات متدرجة</div><div class="ben-desc" id="b1d">كلما زادت مشترياتك كلما ارتفع خصمك تلقائياً حتى 15%.</div></div></div>
    <div class="ben"><div class="ben-ic">⚡</div><div><div class="ben-title" id="b2t">تسليم فوري 100%</div><div class="ben-desc" id="b2d">جميع الأكواد تُسلَّم خلال ثوانٍ من إتمام الدفع.</div></div></div>
    <div class="ben"><div class="ben-ic">🔗</div><div><div class="ben-title" id="b3t">API للمطورين</div><div class="ben-desc" id="b3d">دمج سلس عبر REST API موثق لأتمتة طلباتك.</div></div></div>
    <div class="ben"><div class="ben-ic">🛡️</div><div><div class="ben-title" id="b4t">ضمان الاسترداد</div><div class="ben-desc" id="b4d">كود معطل؟ نستبدله فوراً أو نرد المبلغ كاملاً.</div></div></div>
    <div class="ben"><div class="ben-ic">🌍</div><div><div class="ben-title" id="b5t">تغطية عالمية</div><div class="ben-desc" id="b5d">منتجات لأمريكا وأوروبا وآسيا والشرق الأوسط.</div></div></div>
    <div class="ben"><div class="ben-ic">🪙</div><div><div class="ben-title" id="b6t">دفع بالكريبتو</div><div class="ben-desc" id="b6d">نقبل USDT وBTC وETH مع خصم 2% إضافي.</div></div></div>
  </div>
</div>

<!-- TIERS -->
<div class="sec">
  <div class="sec-hd"><div><div class="sec-title" id="tt">مستويات <em>الشراكة</em></div></div></div>
  <div class="tiers">
    <div class="tier">
      <div class="tier-name">Silver</div><div class="tier-disc">5%</div><div class="tier-vol" id="tv1">من $500 / شهر</div>
      <ul class="tier-ul"><li id="tl1">شراء يبدأ من $500 شهرياً</li><li id="tl2">دعم عبر البريد</li><li id="tl3">تسليم فوري</li><li id="tl4">250+ منتج</li></ul>
      <button class="tier-btn" onclick="openAuth('register')" id="tb1">ابدأ الآن</button>
    </div>
    <div class="tier hot">
      <div class="tier-pop" id="tpop">الأكثر طلباً ⭐</div>
      <div class="tier-name">Gold</div><div class="tier-disc">10%</div><div class="tier-vol" id="tv2">من $2,000 / شهر</div>
      <ul class="tier-ul"><li id="tg1">شراء من $2,000 شهرياً</li><li id="tg2">دعم VIP 24/7</li><li id="tg3">تسليم + API كامل</li><li id="tg4">أسعار حصرية</li></ul>
      <button class="tier-btn" onclick="openAuth('register')" id="tb2">ابدأ الآن</button>
    </div>
    <div class="tier">
      <div class="tier-name">Platinum</div><div class="tier-disc">15%</div><div class="tier-vol" id="tv3">من $10,000 / شهر</div>
      <ul class="tier-ul"><li id="tp1">شراء من $10,000 شهرياً</li><li id="tp2">مدير حساب مخصص</li><li id="tp3">API + تكامل كامل</li><li id="tp4">عروض حصرية</li></ul>
      <button class="tier-btn" id="tb3">تواصل معنا</button>
    </div>
  </div>
</div>

<!-- STEPS -->
<div class="sec">
  <div class="sec-hd"><div><div class="sec-title" id="howt">كيف <em>يعمل؟</em></div></div></div>
  <div class="steps">
    <div class="step"><div class="step-n">01</div><span class="step-ic">📝</span><div class="step-title" id="s1t">سجّل حساباً</div><div class="step-desc" id="s1d">أنشئ حسابك مجاناً كزبون أو شريك جملة.</div></div>
    <div class="step"><div class="step-n">02</div><span class="step-ic">✅</span><div class="step-title" id="s2t">تفعيل فوري</div><div class="step-desc" id="s2d">حسابك يُفعَّل فوراً وتبدأ الشراء بأسعار الجملة.</div></div>
    <div class="step"><div class="step-n">03</div><span class="step-ic">🛒</span><div class="step-title" id="s3t">اشترِ بأسعار مميزة</div><div class="step-desc" id="s3d">أضف للسلة وادفع بالطريقة المناسبة.</div></div>
    <div class="step"><div class="step-n">04</div><span class="step-ic">⚡</span><div class="step-title" id="s4t">استلم فورياً</div><div class="step-desc" id="s4d">الأكواد تصلك في ثوانٍ داخل حسابك.</div></div>
  </div>
</div>

<!-- CONTACT -->
<div class="sec">
  <div class="contact">
    <div class="ci">
      <h2 id="cht">انضم للبرنامج<br><span style="color:var(--accent)">اليوم</span></h2>
      <p id="chp">أرسل طلب انضمام وسيتواصل معك فريقنا خلال ساعات.</p>
      <ul class="cpts">
        <li class="cpt"><span>📧</span><span><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="a8dbddd8d8c7dadce8cadac1cccfcdcbc9daccdb86c7dacf">[email&#160;protected]</a></span></li>
        <li class="cpt"><span>💬</span><span>Telegram: @BridgeCards</span></li>
        <li class="cpt"><span>🕐</span><span id="cp1">رد خلال 24 ساعة</span></li>
        <li class="cpt"><span>🌍</span><span id="cp2">نخدم أكثر من 80 دولة</span></li>
      </ul>
    </div>
    <div class="cform">
      <div class="frow">
        <div class="fg"><label id="fl1">الاسم</label><input type="text" id="fp1" placeholder="محمد أحمد"></div>
        <div class="fg"><label id="fl2">البريد</label><input type="email" id="fp2" placeholder="you@company.com"></div>
      </div>
      <div class="frow">
        <div class="fg"><label id="fl3">الشركة</label><input type="text" id="fp3" placeholder="اسم شركتك"></div>
        <div class="fg"><label id="fl4">الدولة</label>
          <select><option>اختر</option><option>النرويج</option><option>السويد</option><option>بريطانيا</option><option>USA</option><option>السعودية</option><option>الإمارات</option><option>الكويت</option><option>مصر</option><option>المغرب</option><option>ليبيا</option><option>تركيا</option></select>
        </div>
      </div>
      <div class="fg"><label id="fl5">حجم الشراء / شهر</label>
        <select><option>اختر</option><option>$500–$2,000</option><option>$2,000–$10,000</option><option>$10,000+</option></select>
      </div>
      <div class="fg"><label id="fl6">رسالتك</label><textarea id="fpa" placeholder="أخبرنا عن نشاطك..."></textarea></div>
      <button class="fsub" id="fsub">إرسال طلب الانضمام ←</button>
    </div>
  </div>
</div>

<footer>
  <div class="footer-grid">
    <div>
      <a href="#" class="logo" style="text-decoration:none;">
        <div class="logo-icon">🌉</div>
        <div class="logo-text">BridgeCards<small id="f-sub">جسر الكروت</small></div>
      </a>
      <p class="footer-brand-desc">منصة متخصصة في بيع بطاقات الهدايا الرقمية بأسعار الجملة. تسليم فوري، أكواد مضمونة 100%، ودعم احترافي 24/7 في 80+ دولة.</p>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
        <a href="https://t.me/bridgecards" target="_blank" style="display:inline-flex;align-items:center;gap:5px;padding:7px 13px;background:rgba(61,107,255,.12);border:1px solid rgba(61,107,255,.28);border-radius:8px;color:var(--accent);font-size:12px;font-weight:700;text-decoration:none;">💬 Telegram</a>
        <a href="mailto:support@bridgecards.org" style="display:inline-flex;align-items:center;gap:5px;padding:7px 13px;background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.22);border-radius:8px;color:var(--accent3);font-size:12px;font-weight:700;text-decoration:none;">📧 Email</a>
      </div>
    </div>
    <div class="footer-col">
      <h4 id="fc-products">المنتجات</h4>
      <a id="fl-a" onclick="filterTab(document.getElementById('tb-gift'),'gift');document.getElementById('sec-products').scrollIntoView({behavior:'smooth'})">🎁 بطاقات الهدايا</a>
      <a id="fl-b" onclick="filterTab(document.getElementById('tb-pre'),'prepaid');document.getElementById('sec-products').scrollIntoView({behavior:'smooth'})">💳 مسبقة الدفع</a>
      <a id="fl-c" onclick="filterTab(document.getElementById('tb-game'),'game');document.getElementById('sec-products').scrollIntoView({behavior:'smooth'})">🎮 رصيد الألعاب</a>
      <a onclick="filterTab(document.getElementById('tb-crypto'),'crypto');document.getElementById('sec-products').scrollIntoView({behavior:'smooth'})">₿ كريبتو</a>
      <a onclick="filterTab(document.getElementById('tb-fash'),'fashion');document.getElementById('sec-products').scrollIntoView({behavior:'smooth'})">👗 أزياء</a>
      <a onclick="filterTab(document.getElementById('tb-ret'),'retail');document.getElementById('sec-products').scrollIntoView({behavior:'smooth'})">🛒 سوبرماركت</a>
    </div>
    <div class="footer-col">
      <h4 id="fc-support">الدعم</h4>
      <a onclick="openM('termsModal')">📄 الشروط والأحكام</a>
      <a onclick="openM('refundModal')">↩️ سياسة الاسترجاع</a>
      <a onclick="openM('privacyModal')">🔒 سياسة الخصوصية</a>
      <a id="fl-d" onclick="openAuth('register')">🤝 شركاء الجملة</a>
      <a onclick="document.querySelector('.contact').scrollIntoView({behavior:'smooth'})">📝 طلب انضمام</a>
    </div>
    <div class="footer-col">
      <h4 id="fc-contact">تواصل معنا</h4>
      <div class="fci">📧 <a href="mailto:support@bridgecards.org">support@bridgecards.org</a></div>
      <div class="fci">💬 <a href="https://t.me/bridgecards" target="_blank">Telegram: @BridgeCards</a></div>
      <div class="fci">🕐 <span id="fc-hours">دعم 24/7 · رد خلال ساعة</span></div>
      <div class="fci">🌍 <span id="fc-countries">80+ دولة حول العالم</span></div>
      <div class="fci">🏢 <span>Zetony LLC · United States</span></div>
    </div>
  </div>
  <div class="footer-bottom">
    <p id="f-copy">© 2026 BridgeCards · Zetony LLC (USA) · جميع الحقوق محفوظة</p>
    <div class="fbl">
      <a onclick="openM('termsModal')">الشروط</a>
      <a onclick="openM('refundModal')">الاسترجاع</a>
      <a onclick="openM('privacyModal')">الخصوصية</a>
    </div>
  </div>
</footer>

<!-- CART DRAWER -->
<div class="cart-ov" id="cartOv" onclick="closeCart()"></div>
<div class="cart-dr" id="cartDr">
  <div class="cart-hd"><h3 id="cart-title">🛒 سلة المشتريات</h3><button class="close-x" onclick="closeCart()">✕</button></div>
  <div class="cart-list" id="cartList"></div>
  <div class="cart-foot">
    <div class="crow"><span id="ct1">العناصر</span><span id="ct1v">$0.00</span></div>
    <div class="crow"><span id="ct2">الخصم</span><span id="ct2v" style="color:var(--accent3)">-$0.00</span></div>
    <div class="crow total"><span id="ct3">الإجمالي</span><span id="ct3v">$0.00</span></div>
    <button class="checkout-btn" id="checkoutBtn" onclick="goCheckout()">إتمام الشراء →</button>
  </div>
</div>

<!-- CHECKOUT MODAL -->
<div class="modal-ov" id="ckModal">
  <div class="modal" style="max-width:640px;">
    <div class="mhd"><h2 id="ck-title">إتمام الشراء</h2><button class="close-x" onclick="closeM('ckModal')">✕</button></div>
    <div class="mbody">
      <div class="ck-steps">
        <div class="cks active" id="cks1">1. <span id="cks1l">ملخص</span></div>
        <div class="cks" id="cks2">2. <span id="cks2l">طريقة الدفع</span></div>
        <div class="cks" id="cks3">3. <span id="cks3l">التفاصيل</span></div>
        <div class="cks" id="cks4">4. <span id="cks4l">تأكيد</span></div>
      </div>
      <div class="ck-panel active" id="ckp1">
        <div class="fst" id="ck-s1">ملخص الطلب</div>
        <div id="ck-list"></div>
        <div class="os-box" id="ck-sum"></div>
        <div class="ck-actions"><button class="btn-next" onclick="ckNext(2)" id="ck-n1">التالي →</button></div>
      </div>
      <div class="ck-panel" id="ckp2">
        <div class="fst" id="ck-s2">اختر طريقة الدفع</div>
        <div class="pm-grid" id="pmGrid"></div>
        <div class="ck-actions">
          <button class="btn-back" onclick="ckNext(1)" id="ck-b2">← رجوع</button>
          <button class="btn-next" onclick="ckNext(3)" id="ck-n2">التالي →</button>
        </div>
      </div>
      <div class="ck-panel" id="ckp3">
        <div id="pmDetails"></div>
        <div class="ck-actions">
          <button class="btn-back" onclick="ckNext(2)" id="ck-b3">← رجوع</button>
          <div style="background:rgba(255,190,0,.08);border:1px solid rgba(255,190,0,.2);border-radius:8px;padding:9px 12px;margin-bottom:10px;font-size:11px;color:#ffbe00;text-align:center;width:100%;">⚡ سيتم التحقق من توفر المنتج قبل الخصم من بطاقتك</div>
          <button class="btn-next" onclick="ckNext(4)" id="ck-n3">تأكيد ودفع →</button>
        </div>
      </div>
      <div class="ck-panel" id="ckp4">
        <div class="success-box">
          <div style="font-size:52px;margin-bottom:12px;">🎉</div>
          <h3 id="suc-t" style="font-size:18px;font-weight:800;margin-bottom:7px;">تم الدفع بنجاح!</h3>
          <p id="suc-p" style="font-size:13px;color:var(--sub);">أكواد بطاقاتك جاهزة أدناه — انقر للنسخ</p>
          <div id="codesArea"></div>
          <button class="btn-next" style="max-width:260px;margin:10px auto 0;display:block;" onclick="closeM('ckModal');clearCart()">إغلاق</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- AUTH MODAL -->
<div class="modal-ov" id="authModal">
  <div class="modal" style="max-width:390px;">
    <div class="mhd"><h2 id="auth-t">الحساب</h2><button class="close-x" onclick="closeM('authModal')">✕</button></div>
    <div class="mbody">
      <div class="auth-tabs">
        <div class="atab on" id="atab-login" onclick="switchAuth('login')"><span id="at1">تسجيل الدخول</span></div>
        <div class="atab" id="atab-reg" onclick="switchAuth('register')"><span id="at2">إنشاء حساب</span></div>
      </div>
      <div class="apanel on" id="apanel-login">
        <div class="aerr" id="lerr"></div>
        <div class="fg"><label id="ll1">البريد الإلكتروني</label><input type="email" id="l-email" placeholder="you@email.com"></div>
        <div class="fg"><label id="ll2">كلمة المرور</label><input type="password" id="l-pass" placeholder="••••••••"></div>
        <button class="auth-sub" onclick="doLogin()" id="l-sub">تسجيل الدخول</button>
        <div class="auth-div" id="or1">أو</div>
        <div class="soc-btns">
          <button class="soc-btn" onclick="socialLogin('Google')">🔵 Google</button>
          <button class="soc-btn" onclick="socialLogin('Apple')">⚫ Apple</button>
        </div>
        <div class="auth-ft" id="no-acc">ليس لديك حساب؟ <a onclick="switchAuth('register')">أنشئ حساباً</a></div>
      </div>
      <div class="apanel" id="apanel-register">
        <div class="aerr" id="rerr"></div>
        <div class="frow">
          <div class="fg"><label id="rl1">الاسم الأول</label><input type="text" id="r-fname" placeholder="محمد"></div>
          <div class="fg"><label id="rl2">الاسم الأخير</label><input type="text" id="r-lname" placeholder="أحمد"></div>
        </div>
        <div class="fg"><label id="rl3">البريد الإلكتروني</label><input type="email" id="r-email" placeholder="you@email.com"></div>
        <div class="fg"><label id="rl4">كلمة المرور</label><input type="password" id="r-pass" placeholder="6 أحرف على الأقل"></div>
        <div class="fg"><label id="rl5">نوع الحساب</label>
          <select id="r-type"><option value="customer" id="rt1">زبون عادي</option><option value="wholesale" id="rt2">شريك جملة</option></select>
        </div>
        <button class="auth-sub" onclick="doRegister()" id="r-sub">إنشاء الحساب</button>
        <div class="auth-div" id="or2">أو</div>
        <div class="soc-btns">
          <button class="soc-btn" onclick="socialLogin('Google')">🔵 Google</button>
          <button class="soc-btn" onclick="socialLogin('Apple')">⚫ Apple</button>
        </div>
        <div class="auth-ft" id="has-acc">لديك حساب؟ <a onclick="switchAuth('login')">سجّل الدخول</a></div>
      </div>
    </div>
  </div>
</div>

<!-- ══ MODAL: Product Detail ══ -->
<div class="modal-ov" id="pdModal" onclick="if(event.target===this)closeM('pdModal')">
  <div class="modal" style="max-width:600px;">
    <div class="mhd" style="position:sticky;top:0;background:var(--surface);z-index:2;">
      <h2 id="pd-name">تفاصيل المنتج</h2>
      <button class="close-x" onclick="closeM('pdModal')">✕</button>
    </div>
    <div class="mbody" id="pd-body"></div>
  </div>
</div>

<!-- ══ MODAL: الشروط والأحكام ══ -->
<div class="modal-ov" id="termsModal" onclick="if(event.target===this)closeM('termsModal')">
  <div class="modal" style="max-width:680px;">
    <div class="mhd" style="position:sticky;top:0;background:var(--surface);z-index:2;">
      <h2>📄 الشروط والأحكام</h2>
      <button class="close-x" onclick="closeM('termsModal')">✕</button>
    </div>
    <div class="mbody" style="font-size:13px;color:var(--sub);line-height:1.85;">
      <div style="background:rgba(61,107,255,.07);border:1px solid rgba(61,107,255,.2);border-radius:10px;padding:13px 16px;margin-bottom:22px;">
        <p style="color:var(--accent);font-weight:700;">BridgeCards — Zetony LLC شركة أمريكية مسجلة في الولايات المتحدة. نخضع للقانون الفيدرالي الأمريكي.</p>
      </div>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">1. طبيعة المنتجات</h3>
      <p style="margin-bottom:18px;">جميع المنتجات عبارة عن <strong style="color:var(--text);">رموز رقمية (Digital Codes)</strong> لبطاقات الهدايا ورصيد الألعاب. تُسلَّم فورياً إلكترونياً فور إتمام الدفع. لا يوجد شحن مادي.</p>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">2. شروط الاستخدام</h3>
      <ul style="padding-inline-start:18px;margin-bottom:18px;">
        <li style="margin-bottom:6px;">يجب أن يكون عمر المستخدم 18 سنة أو أكثر.</li>
        <li style="margin-bottom:6px;">يُحظر استخدام الموقع لأغراض احتيالية أو غير مشروعة.</li>
        <li style="margin-bottom:6px;">يُحظر إعادة بيع الأكواد على منصات غير مرخصة.</li>
        <li>يلتزم المستخدم بسياسات الشركة المصدِّرة (Microsoft, Sony, Amazon…).</li>
      </ul>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">3. التسعير والدفع</h3>
      <p style="margin-bottom:18px;">الأسعار ديناميكية بناءً على تكلفة المورد. <strong style="color:var(--text);">نضمن تسليمك بالسعر المؤكد وقت إتمام الدفع.</strong> نقبل Visa/Mastercard عبر Stripe، وكريبتو مع خصم 2%، وطرق دفع محلية متعددة.</p>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">4. الحماية ومكافحة الاحتيال</h3>
      <p style="margin-bottom:18px;">نحتفظ بالحق في إيقاف أي طلب مشبوه وطلب التحقق من الهوية (KYC). الطلبات المحجوبة تُسترد تلقائياً.</p>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">5. القانون المطبق</h3>
      <p style="margin-bottom:18px;">تخضع هذه الشروط للقانون الفيدرالي الأمريكي وقوانين الولايات المتحدة. أي نزاع يُحسم وفق قواعد التحكيم الأمريكية.</p>
      <div style="background:var(--bg2);border-radius:9px;padding:13px;text-align:center;font-size:11px;">آخر تحديث: يناير 2026 · <a href="mailto:support@bridgecards.org" style="color:var(--accent3);">support@bridgecards.org</a></div>
    </div>
  </div>
</div>

<!-- ══ MODAL: سياسة الاسترجاع ══ -->
<div class="modal-ov" id="refundModal" onclick="if(event.target===this)closeM('refundModal')">
  <div class="modal" style="max-width:680px;">
    <div class="mhd" style="position:sticky;top:0;background:var(--surface);z-index:2;">
      <h2>↩️ سياسة الاسترجاع</h2>
      <button class="close-x" onclick="closeM('refundModal')">✕</button>
    </div>
    <div class="mbody" style="font-size:13px;color:var(--sub);line-height:1.85;">
      <div style="background:rgba(255,79,123,.08);border:1px solid rgba(255,79,123,.25);border-radius:10px;padding:13px 16px;margin-bottom:22px;">
        <p style="color:var(--accent2);font-weight:700;">⚠️ بسبب الطبيعة الرقمية للمنتجات، لا يمكن الاسترجاع بعد إصدار الكود إلا في الحالات الموضحة.</p>
      </div>
      <h3 style="color:var(--accent3);font-size:13px;font-weight:800;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);">✅ حالات يحق فيها الاسترجاع</h3>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
        <div style="background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.18);border-radius:9px;padding:10px 14px;">الكود <strong style="color:var(--text);">تالف أو لا يعمل</strong> عند الاستخدام الأول.</div>
        <div style="background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.18);border-radius:9px;padding:10px 14px;">الكود <strong style="color:var(--text);">مستخدم مسبقاً</strong> قبل التسليم من المصدر.</div>
        <div style="background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.18);border-radius:9px;padding:10px 14px;"><strong style="color:var(--text);">تسليم منتج مختلف</strong> عما طُلب.</div>
        <div style="background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.18);border-radius:9px;padding:10px 14px;"><strong style="color:var(--text);">فشل تقني من جانبنا</strong> أدى إلى عدم التسليم.</div>
      </div>
      <h3 style="color:var(--accent2);font-size:13px;font-weight:800;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);">❌ حالات لا يُقبل فيها الاسترجاع</h3>
      <ul style="padding-inline-start:18px;margin-bottom:20px;">
        <li style="margin-bottom:6px;">تغيير الرأي بعد الشراء.</li>
        <li style="margin-bottom:6px;">إدخال الكود في المنطقة الجغرافية الخاطئة.</li>
        <li style="margin-bottom:6px;">انتهاء صلاحية الكود.</li>
        <li style="margin-bottom:6px;">مشاكل ناتجة عن سياسات الشركة المصدِّرة.</li>
        <li>طلبات مقدَّمة بعد 48 ساعة من الشراء.</li>
      </ul>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border);">📋 خطوات تقديم طلب الاسترجاع</h3>
      <ol style="padding-inline-start:18px;margin-bottom:20px;">
        <li style="margin-bottom:6px;">أرسل إلى: <a href="mailto:support@bridgecards.org" style="color:var(--accent3);">support@bridgecards.org</a></li>
        <li style="margin-bottom:6px;">اذكر رقم الطلب + البريد المستخدم.</li>
        <li style="margin-bottom:6px;">أرفق لقطة شاشة تُثبت المشكلة.</li>
        <li style="margin-bottom:6px;">الرد خلال <strong style="color:var(--text);">24 ساعة عمل</strong>.</li>
        <li>عند القبول: استبدال فوري أو استرداد خلال <strong style="color:var(--text);">3–5 أيام عمل</strong>.</li>
      </ol>
      <div style="background:var(--bg2);border-radius:9px;padding:13px;text-align:center;font-size:11px;">للدعم الفوري: <a href="https://t.me/bridgecards" style="color:var(--accent3);" target="_blank">Telegram @BridgeCards</a></div>
    </div>
  </div>
</div>

<!-- ══ MODAL: سياسة الخصوصية ══ -->
<div class="modal-ov" id="privacyModal" onclick="if(event.target===this)closeM('privacyModal')">
  <div class="modal" style="max-width:680px;">
    <div class="mhd" style="position:sticky;top:0;background:var(--surface);z-index:2;">
      <h2>🔒 سياسة الخصوصية</h2>
      <button class="close-x" onclick="closeM('privacyModal')">✕</button>
    </div>
    <div class="mbody" style="font-size:13px;color:var(--sub);line-height:1.85;">
      <div style="background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.2);border-radius:10px;padding:13px 16px;margin-bottom:22px;">
        <p style="color:var(--accent3);font-weight:700;">✅ لا نبيع بياناتك ولا نشاركها لأي طرف إعلاني — بدون cookies إعلانية.</p>
      </div>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">1. ما المعلومات التي نجمعها؟</h3>
      <ul style="padding-inline-start:18px;margin-bottom:18px;">
        <li style="margin-bottom:6px;"><strong style="color:var(--text);">بيانات الحساب:</strong> الاسم، البريد، كلمة المرور (مُشفَّرة bcrypt).</li>
        <li style="margin-bottom:6px;"><strong style="color:var(--text);">بيانات المعاملات:</strong> سجل الطلبات (لا نحفظ أرقام البطاقات — Stripe يتولى ذلك).</li>
        <li style="margin-bottom:6px;"><strong style="color:var(--text);">بيانات تقنية:</strong> IP، المتصفح — للأمان ومنع الاحتيال فقط.</li>
        <li><strong style="color:var(--text);">لا cookies إعلانية</strong> ولا شبكات تتبع.</li>
      </ul>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">2. مع من نشارك بياناتك؟</h3>
      <ul style="padding-inline-start:18px;margin-bottom:18px;">
        <li style="margin-bottom:6px;"><strong style="color:var(--text);">Stripe Inc.</strong> — معالج الدفع الآمن (PCI-DSS Level 1).</li>
        <li><strong style="color:var(--text);">Reloadly</strong> — مزود بطاقات الهدايا، لتنفيذ الطلبات فقط.</li>
      </ul>
      <h3 style="color:var(--text);font-size:13px;font-weight:800;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);">3. الأمان وحقوقك</h3>
      <ul style="padding-inline-start:18px;margin-bottom:18px;">
        <li style="margin-bottom:6px;">تشفير SSL/TLS 256-bit — كلمات المرور bcrypt.</li>
        <li style="margin-bottom:6px;"><strong style="color:var(--text);">حق الوصول:</strong> الاطلاع على بياناتك.</li>
        <li style="margin-bottom:6px;"><strong style="color:var(--text);">حق الحذف:</strong> حذف حسابك وبياناتك نهائياً.</li>
        <li><strong style="color:var(--text);">حق الاعتراض:</strong> إيقاف أي استخدام لبياناتك.</li>
      </ul>
      <div style="background:var(--bg2);border-radius:9px;padding:13px;text-align:center;font-size:11px;">آخر تحديث: يناير 2026 · <a href="mailto:support@bridgecards.org" style="color:var(--accent3);">support@bridgecards.org</a></div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
/* ══════════════════════════════════════════
   SAFE DOM HELPER
══════════════════════════════════════════ */
function g(id){
  const el=document.getElementById(id);
  if(el) return el;
  return {
    classList:{add:()=>{},remove:()=>{},toggle:()=>{},contains:()=>false},
    get textContent(){return'';},set textContent(v){},
    get innerHTML(){return'';},set innerHTML(v){},
    get value(){return'';},set value(v){},
    get placeholder(){return'';},set placeholder(v){},
    get checked(){return false;},set checked(v){},
    get disabled(){return false;},set disabled(v){},
    style:{},focus:()=>{},blur:()=>{},click:()=>{}
  };
}

/* ══════════════════════════════════════════
   LOGO LOOKUP
══════════════════════════════════════════ */
const LOGOS={
  steam:'steampowered.com',psn:'playstation.com',xbox:'xbox.com',
  pubg:'pubg.com',roblox:'roblox.com',fortnite:'epicgames.com',
  nintendo:'nintendo.com',razer:'razer.com',freefire:'garena.com',
  ea:'ea.com','yalla-ludo':'yallagames.com',
  amazon:'amazon.com',google:'play.google.com',apple:'apple.com',
  netflix:'netflix.com',ebay:'ebay.com',spotify:'spotify.com',
  visa:'visa.com',mc:'mastercard.com',amex:'americanexpress.com',
  astropay:'astropay.com','visa-gift':'visa.com','mc-eur':'mastercard.com',
  'mc-virtual':'mastercard.com',prepaidy:'prepaidy.com',
  jetoncash:'jeton.com',neosurf:'neosurf.com',
  flexepin:'flexepin.com','flexepin-eur':'flexepin.com',
  ikea:'ikea.com',wayfair:'wayfair.com',homebase:'homedepot.com',
  zara:'zara.com',hm:'hm.com',nike:'nike.com',adidas:'adidas.com',
  uniqlo:'uniqlo.com',asos:'asos.com',macys:'macys.com',
  lcwaikiki:'lcwaikiki.com',defacto:'defacto.com.tr',koton:'koton.com',
  'mango-tr':'mango.com',beymen:'beymen.com',vakko:'vakko.com',
  boyner:'boyner.com.tr',ipekyol:'ipekyol.com',machka:'machka.com.tr',
  'network-turkey':'network.com.tr',
  bestbuy:'bestbuy.com',newegg:'newegg.com',samsung:'samsung.com',
  microsoft:'microsoft.com','apple-store':'apple.com',currys:'currys.co.uk',
  starbucks:'starbucks.com',mcdonalds:'mcdonalds.com',
  ubereats:'ubereats.com',deliveroo:'deliveroo.co.uk',
  walmart:'walmart.com',target:'target.com',costco:'costco.com',
  samsclub:'samsclub.com','dollar-general':'dollargeneral.com',
  kroger:'kroger.com',carrefour:'carrefour.com',
  'lulu-hypermarket':'luluhypermarket.com',noon:'noon.com',
  aliexpress:'aliexpress.com',
  binance:'binance.com','binance-usdc':'binance.com',
  'binance-euri':'binance.com',bybit:'bybit.com',
  coinbase:'coinbase.com',kucoin:'kucoin.com',okx:'okx.com',
  gateio:'gate.io','crypto-com':'crypto.com',bitget:'bitget.com',
  usdt:'tether.to',btc:'bitcoin.org',eth:'ethereum.org',
  bnb:'binance.com',sol:'solana.com',usdc:'circle.com',
  paysafecard:'paysafe.com',bitsa:'bitsacard.com',cashlib:'cashlib.eu',
  mifinity:'mifinity.com',transcash:'transcash.com',icash:'icash.one',
  cryptovoucher:'crypto-voucher.com',giftmecrypto:'giftmecrypto.com',
    xrp:'ripple.com','usdt-large':'tether.to',
};
function getLogo(id){
  var d = LOGOS[id] || id+'.com';
  return 'https://www.google.com/s2/favicons?domain='+d+'&sz=128';
}

/* ══════════════════════════════════════════
   PRODUCTS DATA
══════════════════════════════════════════ */
const P=[
  // GAMING
  {id:'steam',rating:4.8,reviews:1205,reloadlyId:15803,cat:'game',name:{ar:'Steam Wallet',en:'Steam Wallet'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1b2838,#2a475e)',d:[{l:'$5',p:5.73,o:5},{l:'$10',p:11.17,o:10},{l:'$20',p:22.03,o:20},{l:'$50',p:54.63,o:50},{l:'$100',p:108.96,o:100}]},
  {id:'psn',rating:4.7,reviews:892,reloadlyId:15584,cat:'game',name:{ar:'PlayStation Network',en:'PlayStation Network'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#003087,#0070d1)',d:[{l:'$10',p:11.17,o:10},{l:'$20',p:22.03,o:20},{l:'$50',p:54.63,o:50},{l:'$100',p:108.96,o:100}]},
  {id:'xbox',rating:4.6,reviews:654,reloadlyId:16061,cat:'game',name:{ar:'Xbox Gift Card',en:'Xbox Gift Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#107c10,#52b043)',d:[{l:'$5',p:5.79,o:5},{l:'$10',p:11.28,o:10},{l:'$25',p:27.75,o:25},{l:'$50',p:55.2,o:50}]},
  {id:'pubg',rating:4.4,reviews:987,reloadlyId:15552,cat:'game',name:{ar:'PUBG Mobile UC',en:'PUBG Mobile UC'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1a1a1a,#f7a21b)',d:[{l:'60 UC',p:1.47,o:1},{l:'325 UC',p:5.79,o:5},{l:'660 UC',p:11.28,o:10},{l:'1800 UC',p:27.75,o:25}]},
  {id:'roblox',rating:4.3,reviews:876,cat:'game',name:{ar:'Roblox Gift Card',en:'Roblox Gift Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#cc0000,#ff4444)',d:[{l:'$10',p:10.83,o:10},{l:'$25',p:26.62,o:25},{l:'$50',p:52.37,o:50}]},
  {id:'fortnite',rating:4.5,reviews:1234,reloadlyId:17559,cat:'game',name:{ar:'Fortnite V-Bucks',en:'Fortnite V-Bucks'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1900ff,#00cfff)',d:[{l:'1000 V',p:9.07,o:7.99},{l:'2800 V',p:22.25,o:19.99},{l:'5000 V',p:38.77,o:34.99}]},
  {id:'nintendo',cat:'game',name:{ar:'Nintendo eShop',en:'Nintendo eShop'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#e60012,#ff4444)',d:[{l:'$10',p:10.71,o:10},{l:'$20',p:21.13,o:20},{l:'$35',p:36.75,o:35},{l:'$50',p:52.37,o:50}]},
  {id:'razer',cat:'game',name:{ar:'Razer Gold',en:'Razer Gold'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#000,#00c800)',d:[{l:'$5',p:5.39,o:5},{l:'$10',p:10.49,o:10},{l:'$25',p:25.77,o:25}]},
  {id:'freefire',cat:'game',name:{ar:'Free Fire Diamonds',en:'Free Fire Diamonds'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1a0a2e,#ff4500)',d:[{l:'100💎',p:1.49,o:1.09},{l:'310💎',p:3.57,o:3.19},{l:'520💎',p:5.68,o:5.29},{l:'1060💎',p:10.71,o:10.49}]},
  {id:'ea',cat:'game',name:{ar:'EA Play',en:'EA Play'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#ff4500,#ff6a00)',d:[{l:'1 شهر',p:4.94,o:4.99},{l:'12 شهر',p:34.25,o:35.99}]},
  {id:'yalla-ludo',cat:'game',name:{ar:'Yalla Ludo Diamonds',en:'Yalla Ludo Diamonds'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#4a0072,#ff4d00)',d:[{l:'50💎',p:1.38,o:0.99},{l:'100💎',p:2.28,o:1.99},{l:'300💎',p:5.95,o:5.49},{l:'600💎',p:11.05,o:10.99},{l:'1200💎',p:21.24,o:21.99}]},
  // GIFT
  {id:'amazon',rating:4.9,reviews:2341,reloadlyId:5,cat:'gift',name:{ar:'Amazon Gift Card',en:'Amazon Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#131921,#ff9900)',d:[{l:'$10',p:11.28,o:10},{l:'$25',p:27.75,o:25},{l:'$50',p:55.2,o:50},{l:'$100',p:110.09,o:100},{l:'$200',p:219.89,o:200}]},
  {id:'google',rating:4.7,reviews:1102,reloadlyId:3941,cat:'gift',name:{ar:'Google Play',en:'Google Play'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#01875f,#4285f4)',d:[{l:'$5',p:5.79,o:5},{l:'$10',p:11.28,o:10},{l:'$25',p:27.75,o:25},{l:'$50',p:55.2,o:50},{l:'$100',p:110.09,o:100}]},
  {id:'apple',cat:'gift',name:{ar:'App Store & iTunes',en:'App Store & iTunes'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#1c1c1e,#3a3a3c)',d:[{l:'$10',p:10.83,o:10},{l:'$15',p:16.15,o:15},{l:'$25',p:26.62,o:25},{l:'$50',p:52.93,o:50},{l:'$100',p:105.57,o:100}]},
  {id:'netflix',rating:4.5,reviews:743,reloadlyId:18681,cat:'gift',name:{ar:'Netflix Gift Card',en:'Netflix Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#141414,#e50914)',d:[{l:'$15',p:16.77,o:15},{l:'$30',p:33.24,o:30},{l:'$60',p:66.18,o:60},{l:'$100',p:110.09,o:100}]},
  {id:'ebay',reloadlyId:2,cat:'gift',name:{ar:'eBay Gift Card',en:'eBay Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#e53238,#0064d2)',d:[{l:'$25',p:27.75,o:25},{l:'$50',p:55.2,o:50},{l:'$100',p:110.09,o:100},{l:'$200',p:219.89,o:200}]},
  {id:'spotify',rating:4.6,reviews:521,cat:'gift',name:{ar:'Spotify Gift Card',en:'Spotify Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#121212,#1db954)',d:[{l:'$10',p:11.05,o:10},{l:'$30',p:32.56,o:30},{l:'$60',p:64.82,o:60}]},
  // PREPAID
  {id:'visa',rating:4.5,reviews:234,cat:'prepaid',name:{ar:'Visa Prepaid',en:'Visa Prepaid'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1a1f71,#0057b7)',d:[{l:'$10',p:12.18,o:11},{l:'$25',p:29.73,o:27},{l:'$50',p:58.59,o:53.5},{l:'$100',p:115.75,o:106},{l:'$200',p:230.08,o:211}]},
  {id:'mc',rating:4.4,reviews:198,cat:'prepaid',name:{ar:'Mastercard Prepaid',en:'Mastercard Prepaid'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#252525,#eb001b)',d:[{l:'$10',p:12.18,o:11},{l:'$25',p:30.01,o:27.5},{l:'$50',p:59.16,o:54.5},{l:'$100',p:116.89,o:107},{l:'$250',p:290.07,o:265}]},
  {id:'amex',cat:'prepaid',name:{ar:'American Express',en:'American Express'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#007bc1,#00a3e0)',d:[{l:'$25',p:29.73,o:27},{l:'$50',p:58.59,o:53.5},{l:'$100',p:116.89,o:107},{l:'$200',p:232.34,o:213}]},
  {id:'astropay',cat:'prepaid',name:{ar:'AstroPay / ICash',en:'AstroPay / ICash'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#003087,#009cde)',d:[{l:'$10',p:11.05,o:10},{l:'$25',p:27.18,o:25},{l:'$50',p:54.07,o:50},{l:'$100',p:107.83,o:100}]},
  {id:'visa-gift',cat:'prepaid',name:{ar:'Visa Gift Prepaid',en:'Visa Gift Prepaid'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#1a1f71,#0057b7)',d:[{l:'$10',p:12.52,o:11.5},{l:'$25',p:30.3,o:28},{l:'$50',p:59.72,o:55},{l:'$100',p:118.02,o:109}]},
  {id:'mc-eur',cat:'prepaid',name:{ar:'Mastercard EUR',en:'Mastercard EUR'},reg:{ar:'🇪🇺 Europe',en:'🇪🇺 Europe'},bg:'linear-gradient(145deg,#1a0a00,#eb001b)',d:[{l:'€10',p:12.52,o:11.5},{l:'€25',p:30.86,o:28.5},{l:'€50',p:60.86,o:56},{l:'€100',p:120.28,o:111}]},
  {id:'mc-virtual',cat:'prepaid',name:{ar:'Mastercard Virtual',en:'Mastercard Virtual'},reg:{ar:'🌍 Virtual',en:'🌍 Virtual'},bg:'linear-gradient(145deg,#0d0d0d,#f79e1b)',d:[{l:'$10',p:12.52,o:11.5},{l:'$25',p:30.86,o:28.5},{l:'$50',p:60.86,o:56},{l:'$100',p:121.41,o:112}]},
  {id:'prepaidy',cat:'prepaid',name:{ar:'Prepaidy Card',en:'Prepaidy Card'},reg:{ar:'🇪🇺 Europe',en:'🇪🇺 Europe'},bg:'linear-gradient(145deg,#0d47a1,#42a5f5)',d:[{l:'€10',p:12.18,o:11},{l:'€25',p:29.96,o:27.5},{l:'€50',p:59.72,o:55},{l:'€100',p:119.15,o:110}]},
  {id:'jetoncash',cat:'prepaid',name:{ar:'JetonCash',en:'JetonCash'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#0d0d26,#5c6bc0)',d:[{l:'€10',p:11.05,o:10},{l:'€20',p:21.81,o:20},{l:'€50',p:54.07,o:50},{l:'€100',p:107.83,o:100}]},
  {id:'neosurf',cat:'prepaid',name:{ar:'Neosurf',en:'Neosurf'},reg:{ar:'🇫🇷 Europe',en:'🇫🇷 Europe'},bg:'linear-gradient(145deg,#7f0000,#e53935)',d:[{l:'€10',p:11.05,o:10},{l:'€15',p:16.37,o:15},{l:'€30',p:32.56,o:30},{l:'€50',p:54.07,o:50}]},
  {id:'flexepin',cat:'prepaid',name:{ar:'Flexepin',en:'Flexepin'},reg:{ar:'🇨🇦 Canada/EU',en:'🇨🇦 Canada/EU'},bg:'linear-gradient(145deg,#003066,#0080ff)',d:[{l:'$10',p:11.05,o:10},{l:'$20',p:21.81,o:20},{l:'$50',p:54.07,o:50},{l:'$100',p:107.83,o:100}]},
  {id:'flexepin-eur',cat:'prepaid',name:{ar:'Flexepin EUR',en:'Flexepin EUR'},reg:{ar:'🇪🇺 Europe',en:'🇪🇺 Europe'},bg:'linear-gradient(145deg,#001a4d,#0066cc)',d:[{l:'€10',p:11.05,o:10},{l:'€25',p:27.18,o:25},{l:'€50',p:54.07,o:50},{l:'€100',p:107.83,o:100}]},
  // HOME
  {id:'ikea',rating:4.5,reviews:312,cat:'home',name:{ar:'IKEA Gift Card',en:'IKEA Gift Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#0051a2,#ffda1a)',d:[{l:'€25',p:26.9,o:25},{l:'€50',p:53.5,o:50},{l:'€100',p:106.7,o:100},{l:'€150',p:159.9,o:150},{l:'€250',p:266.3,o:250}]},
  {id:'wayfair',cat:'home',name:{ar:'Wayfair Gift Card',en:'Wayfair Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#7b2d8b,#a044b0)',d:[{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50},{l:'$100',p:106.7,o:100}]},
  {id:'homebase',cat:'home',name:{ar:'Home Depot Card',en:'Home Depot Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#f96302,#ff8c00)',d:[{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50},{l:'$100',p:106.7,o:100},{l:'$200',p:213.1,o:200}]},
  // FASHION
  {id:'zara',cat:'fashion',name:{ar:'Zara Gift Card',en:'Zara Gift Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#000,#2d2d2d)',d:[{l:'€20',p:21.58,o:20},{l:'€50',p:53.5,o:50},{l:'€100',p:106.7,o:100}]},
  {id:'hm',cat:'fashion',name:{ar:'H&M Gift Card',en:'H&M Gift Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#cc0000,#e50000)',d:[{l:'€20',p:21.35,o:20},{l:'€50',p:52.93,o:50},{l:'€100',p:105.57,o:100}]},
  {id:'nike',rating:4.4,reviews:445,cat:'fashion',name:{ar:'Nike Gift Card',en:'Nike Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#111,#333)',d:[{l:'$25',p:26.62,o:25},{l:'$50',p:52.93,o:50},{l:'$100',p:105.57,o:100}]},
  {id:'adidas',cat:'fashion',name:{ar:'Adidas Gift Card',en:'Adidas Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#000,#222)',d:[{l:'$25',p:26.62,o:25},{l:'$50',p:52.93,o:50},{l:'$100',p:105.57,o:100}]},
  {id:'uniqlo',cat:'fashion',name:{ar:'Uniqlo Gift Card',en:'Uniqlo Gift Card'},reg:{ar:'🇯🇵 Japan/Global',en:'🇯🇵 Japan/Global'},bg:'linear-gradient(145deg,#cc0000,#ff0000)',d:[{l:'¥1000',p:7.66,o:7},{l:'¥3000',p:22.37,o:21},{l:'¥5000',p:36.52,o:35}]},
  {id:'asos',cat:'fashion',name:{ar:'ASOS Gift Card',en:'ASOS Gift Card'},reg:{ar:'🇬🇧 UK',en:'🇬🇧 UK'},bg:'linear-gradient(145deg,#2c2c2c,#2a6ebb)',d:[{l:'£10',p:10.94,o:10},{l:'£25',p:26.9,o:25},{l:'£50',p:53.5,o:50},{l:'£100',p:106.7,o:100}]},
  {id:'macys',cat:'fashion',name:{ar:"Macy's Gift Card",en:"Macy's Gift Card"},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#8b0000,#b22222)',d:[{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50},{l:'$100',p:106.7,o:100}]},
  {id:'lcwaikiki',cat:'fashion',name:{ar:'LC Waikiki Card',en:'LC Waikiki Card'},reg:{ar:'🇹🇷 Turkey',en:'🇹🇷 Turkey'},bg:'linear-gradient(145deg,#8b0015,#e60026)',d:[{l:'250₺',p:8.22,o:7.5},{l:'500₺',p:16.15,o:15},{l:'1000₺',p:31.99,o:30},{l:'2000₺',p:63.69,o:60}]},
  {id:'defacto',cat:'fashion',name:{ar:'DeFacto Card',en:'DeFacto Card'},reg:{ar:'🇹🇷 Turkey',en:'🇹🇷 Turkey'},bg:'linear-gradient(145deg,#000,#222)',d:[{l:'250₺',p:8.22,o:7.5},{l:'500₺',p:16.15,o:15},{l:'1000₺',p:31.99,o:30}]},
  {id:'koton',cat:'fashion',name:{ar:'Koton Gift Card',en:'Koton Gift Card'},reg:{ar:'🇹🇷 Turkey',en:'🇹🇷 Turkey'},bg:'linear-gradient(145deg,#1a1a1a,#c8a96e)',d:[{l:'250₺',p:8.22,o:7.5},{l:'500₺',p:16.15,o:15},{l:'1000₺',p:31.99,o:30}]},
  {id:'mango-tr',cat:'fashion',name:{ar:'Mango Gift Card',en:'Mango Gift Card'},reg:{ar:'🇹🇷 Turkey/Global',en:'🇹🇷 Turkey/Global'},bg:'linear-gradient(145deg,#111,#333)',d:[{l:'500₺',p:16.15,o:15},{l:'1000₺',p:31.99,o:30},{l:'€30',p:31.99,o:30},{l:'€50',p:52.93,o:50}]},
  {id:'beymen',cat:'fashion',name:{ar:'Beymen Gift Card',en:'Beymen Gift Card'},reg:{ar:'🇹🇷 Luxury',en:'🇹🇷 Luxury'},bg:'linear-gradient(145deg,#0d0d0d,#d4af37)',d:[{l:'1000₺',p:29.73,o:28},{l:'2500₺',p:73.87,o:70},{l:'5000₺',p:147.45,o:140}]},
  {id:'vakko',cat:'fashion',name:{ar:'Vakko Gift Card',en:'Vakko Gift Card'},reg:{ar:'🇹🇷 Luxury',en:'🇹🇷 Luxury'},bg:'linear-gradient(145deg,#000,#2a2a2a)',d:[{l:'1000₺',p:29.73,o:28},{l:'2500₺',p:73.87,o:70},{l:'5000₺',p:147.45,o:140}]},
  {id:'boyner',cat:'fashion',name:{ar:'Boyner Gift Card',en:'Boyner Gift Card'},reg:{ar:'🇹🇷 Turkey',en:'🇹🇷 Turkey'},bg:'linear-gradient(145deg,#8b0020,#e60033)',d:[{l:'250₺',p:7.66,o:7},{l:'500₺',p:15.01,o:14},{l:'1000₺',p:29.73,o:28}]},
  // ELECTRONICS
  {id:'bestbuy',cat:'electronics',name:{ar:'Best Buy Card',en:'Best Buy Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#003087,#0046be)',d:[{l:'$15',p:16.26,o:15},{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50},{l:'$100',p:106.7,o:100}]},
  {id:'newegg',cat:'electronics',name:{ar:'Newegg Gift Card',en:'Newegg Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#c04800,#e85a00)',d:[{l:'$15',p:16.26,o:15},{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50}]},
  {id:'samsung',cat:'electronics',name:{ar:'Samsung Gift Card',en:'Samsung Gift Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1428a0,#2a52d1)',d:[{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50},{l:'$100',p:106.7,o:100}]},
  {id:'microsoft',cat:'electronics',name:{ar:'Microsoft Card',en:'Microsoft Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#0078d4,#00a2ed)',d:[{l:'$10',p:10.83,o:10},{l:'$25',p:26.62,o:25},{l:'$50',p:52.93,o:50},{l:'$100',p:105.57,o:100}]},
  {id:'apple-store',cat:'electronics',name:{ar:'Apple Store Card',en:'Apple Store Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#1c1c1e,#3a3a3c)',d:[{l:'$25',p:26.62,o:25},{l:'$50',p:52.93,o:50},{l:'$100',p:105.57,o:100},{l:'$200',p:210.83,o:200}]},
  {id:'currys',cat:'electronics',name:{ar:'Currys Gift Card',en:'Currys Gift Card'},reg:{ar:'🇬🇧 UK',en:'🇬🇧 UK'},bg:'linear-gradient(145deg,#5c2d91,#7b3fb5)',d:[{l:'£10',p:10.94,o:10},{l:'£25',p:26.9,o:25},{l:'£50',p:53.5,o:50}]},
  // FOOD
  {id:'starbucks',rating:4.7,reviews:654,reloadlyId:18287,cat:'food',name:{ar:'Starbucks Card',en:'Starbucks Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#00704a,#008f5d)',d:[{l:'$10',p:11.28,o:10},{l:'$15',p:16.77,o:15},{l:'$25',p:27.75,o:25},{l:'$50',p:55.2,o:50}]},
  {id:'mcdonalds',cat:'food',name:{ar:"McDonald's Card",en:"McDonald's Card"},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#da291c,#ffc72c)',d:[{l:'$10',p:10.94,o:10},{l:'$20',p:21.58,o:20},{l:'$50',p:53.5,o:50}]},
  {id:'ubereats',cat:'food',name:{ar:'Uber Eats Card',en:'Uber Eats Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#000,#06c167)',d:[{l:'$15',p:16.26,o:15},{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50}]},
  {id:'deliveroo',cat:'food',name:{ar:'Deliveroo Card',en:'Deliveroo Card'},reg:{ar:'🇬🇧 UK/Europe',en:'🇬🇧 UK/Europe'},bg:'linear-gradient(145deg,#00948a,#00ccbc)',d:[{l:'£10',p:10.94,o:10},{l:'£25',p:26.9,o:25},{l:'£50',p:53.5,o:50}]},
  // RETAIL
  {id:'walmart',rating:4.3,reviews:567,cat:'retail',name:{ar:'Walmart Gift Card',en:'Walmart Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#004c97,#0071ce)',d:[{l:'$10',p:10.94,o:10},{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50},{l:'$100',p:106.7,o:100},{l:'$200',p:213.1,o:200}]},
  {id:'target',reloadlyId:12740,cat:'retail',name:{ar:'Target Gift Card',en:'Target Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#7f0000,#cc0000)',d:[{l:'$10',p:11.28,o:10},{l:'$25',p:27.75,o:25},{l:'$50',p:55.2,o:50},{l:'$100',p:110.09,o:100}]},
  {id:'costco',cat:'retail',name:{ar:'Costco Shop Card',en:'Costco Shop Card'},reg:{ar:'🇺🇸 USA/Canada',en:'🇺🇸 USA/Canada'},bg:'linear-gradient(145deg,#003d73,#005daa)',d:[{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50},{l:'$100',p:106.7,o:100},{l:'$200',p:213.1,o:200}]},
  {id:'kroger',cat:'retail',name:{ar:'Kroger Gift Card',en:'Kroger Gift Card'},reg:{ar:'🇺🇸 USA',en:'🇺🇸 USA'},bg:'linear-gradient(145deg,#0f2040,#1b3a6b)',d:[{l:'$10',p:10.94,o:10},{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50}]},
  {id:'carrefour',cat:'retail',name:{ar:'Carrefour Card',en:'Carrefour Card'},reg:{ar:'🌍 Global/Gulf',en:'🌍 Global/Gulf'},bg:'linear-gradient(145deg,#003070,#004a97)',d:[{l:'100 SAR',p:28.6,o:26.5},{l:'200 SAR',p:56.9,o:53},{l:'100 AED',p:29.73,o:27.2},{l:'200 AED',p:59.16,o:54.4}]},
  {id:'noon',cat:'retail',name:{ar:'Noon Gift Card',en:'Noon Gift Card'},reg:{ar:'🇦🇪 UAE/KSA/EGY',en:'🇦🇪 UAE/KSA/EGY'},bg:'linear-gradient(145deg,#b8aa00,#feee00)',d:[{l:'50 AED',p:15.01,o:13.6},{l:'100 AED',p:29.73,o:27.2},{l:'200 AED',p:59.16,o:54.4},{l:'100 SAR',p:28.6,o:26.5}]},
  {id:'lulu-hypermarket',cat:'retail',name:{ar:'LuLu Hypermarket',en:'LuLu Hypermarket'},reg:{ar:'🇦🇪 UAE/Gulf',en:'🇦🇪 UAE/Gulf'},bg:'linear-gradient(145deg,#a00020,#e63946)',d:[{l:'50 AED',p:15.01,o:13.6},{l:'100 AED',p:29.73,o:27.2},{l:'200 AED',p:59.16,o:54.4}]},
  {id:'aliexpress',cat:'retail',name:{ar:'AliExpress Card',en:'AliExpress Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#cc0000,#ff4747)',d:[{l:'$10',p:10.94,o:10},{l:'$25',p:26.9,o:25},{l:'$50',p:53.5,o:50}]},
  // CRYPTO
  {id:'binance',rating:4.4,reviews:432,cat:'crypto',name:{ar:'Binance Gift Card',en:'Binance Gift Card'},reg:{ar:'🌍 BNB/USDT',en:'🌍 BNB/USDT'},bg:'linear-gradient(145deg,#1a1208,#f3ba2f)',d:[{l:'$10',p:11.39,o:10},{l:'$25',p:28.03,o:25},{l:'$50',p:55.76,o:50},{l:'$100',p:111.23,o:100},{l:'$200',p:222.15,o:200}]},
  {id:'binance-usdc',cat:'crypto',name:{ar:'Binance USDC',en:'Binance USDC'},reg:{ar:'🌍 USDC',en:'🌍 USDC'},bg:'linear-gradient(145deg,#1a1a2e,#2775ca)',d:[{l:'$10',p:11.51,o:10},{l:'$25',p:28.31,o:25},{l:'$50',p:56.33,o:50},{l:'$100',p:112.36,o:100}]},
  {id:'binance-euri',cat:'crypto',name:{ar:'Binance EURI',en:'Binance EURI'},reg:{ar:'🇪🇺 EURI',en:'🇪🇺 EURI'},bg:'linear-gradient(145deg,#1a1208,#003580)',d:[{l:'€10',p:11.51,o:10},{l:'€25',p:28.31,o:25},{l:'€50',p:56.33,o:50},{l:'€100',p:112.36,o:100}]},
  {id:'bybit',cat:'crypto',name:{ar:'Bybit Voucher',en:'Bybit Voucher'},reg:{ar:'🌍 USDT',en:'🌍 USDT'},bg:'linear-gradient(145deg,#0d0d1a,#f7a600)',d:[{l:'$10',p:11.39,o:10},{l:'$25',p:28.03,o:25},{l:'$50',p:55.76,o:50},{l:'$100',p:111.23,o:100}]},
  {id:'coinbase',cat:'crypto',name:{ar:'Coinbase Card',en:'Coinbase Card'},reg:{ar:'🇺🇸🇪🇺 USA/EU',en:'🇺🇸🇪🇺 USA/EU'},bg:'linear-gradient(145deg,#0a0b1e,#0052ff)',d:[{l:'$25',p:28.03,o:25},{l:'$50',p:55.76,o:50},{l:'$100',p:111.23,o:100}]},
  {id:'kucoin',cat:'crypto',name:{ar:'KuCoin Voucher',en:'KuCoin Voucher'},reg:{ar:'🌍 USDT',en:'🌍 USDT'},bg:'linear-gradient(145deg,#0a1628,#24ae8f)',d:[{l:'$10',p:11.39,o:10},{l:'$25',p:28.03,o:25},{l:'$50',p:55.76,o:50}]},
  {id:'okx',cat:'crypto',name:{ar:'OKX Voucher',en:'OKX Voucher'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#000,#1a1a1a)',d:[{l:'$25',p:28.03,o:25},{l:'$50',p:55.76,o:50},{l:'$100',p:111.23,o:100}]},
  {id:'gateio',cat:'crypto',name:{ar:'Gate.io Voucher',en:'Gate.io Voucher'},reg:{ar:'🌍 USDT',en:'🌍 USDT'},bg:'linear-gradient(145deg,#0b1426,#00b897)',d:[{l:'$10',p:11.39,o:10},{l:'$25',p:28.03,o:25},{l:'$50',p:55.76,o:50}]},
  {id:'crypto-com',cat:'crypto',name:{ar:'Crypto.com Card',en:'Crypto.com Card'},reg:{ar:'🌍 CRO',en:'🌍 CRO'},bg:'linear-gradient(145deg,#001650,#1199fa)',d:[{l:'$25',p:28.03,o:25},{l:'$50',p:55.76,o:50},{l:'$100',p:111.23,o:100}]},
  {id:'bitget',cat:'crypto',name:{ar:'Bitget Voucher',en:'Bitget Voucher'},reg:{ar:'🌍 USDT',en:'🌍 USDT'},bg:'linear-gradient(145deg,#0a0e1a,#00f0ff)',d:[{l:'$10',p:11.39,o:10},{l:'$25',p:28.03,o:25},{l:'$50',p:55.76,o:50}]},
  {id:'usdt',rating:4.6,reviews:321,cat:'crypto',name:{ar:'USDT Voucher',en:'USDT Voucher'},reg:{ar:'🌍 TRC20/ERC20',en:'🌍 TRC20/ERC20'},bg:'linear-gradient(145deg,#0d2818,#26a17b)',d:[{l:'$10',p:11.62,o:10},{l:'$25',p:28.6,o:25},{l:'$50',p:56.9,o:50},{l:'$100',p:113.49,o:100},{l:'$500',p:566.25,o:500}]},
  {id:'btc',cat:'crypto',name:{ar:'Bitcoin BTC',en:'Bitcoin BTC'},reg:{ar:'🌍 Bitcoin',en:'🌍 Bitcoin'},bg:'linear-gradient(145deg,#1a0d00,#f7931a)',d:[{l:'$25',p:28.6,o:25},{l:'$50',p:56.9,o:50},{l:'$100',p:113.49,o:100},{l:'$250',p:283.27,o:250}]},
  {id:'eth',cat:'crypto',name:{ar:'Ethereum ETH',en:'Ethereum ETH'},reg:{ar:'🌍 ERC20',en:'🌍 ERC20'},bg:'linear-gradient(145deg,#0d1435,#627eea)',d:[{l:'$25',p:28.6,o:25},{l:'$50',p:56.9,o:50},{l:'$100',p:113.49,o:100}]},
  {id:'bnb',cat:'crypto',name:{ar:'BNB Coin',en:'BNB Coin'},reg:{ar:'🌍 BSC',en:'🌍 BSC'},bg:'linear-gradient(145deg,#1a1000,#f3ba2f)',d:[{l:'$25',p:28.6,o:25},{l:'$50',p:56.9,o:50},{l:'$100',p:113.49,o:100}]},
  {id:'sol',cat:'crypto',name:{ar:'Solana SOL',en:'Solana SOL'},reg:{ar:'🌍 Solana',en:'🌍 Solana'},bg:'linear-gradient(145deg,#1a0040,#9945ff)',d:[{l:'$25',p:28.6,o:25},{l:'$50',p:56.9,o:50},{l:'$100',p:113.49,o:100}]},
  {id:'usdc',cat:'crypto',name:{ar:'USDC Voucher',en:'USDC Voucher'},reg:{ar:'🌍 Circle',en:'🌍 Circle'},bg:'linear-gradient(145deg,#0a1f45,#2775ca)',d:[{l:'$10',p:11.62,o:10},{l:'$25',p:28.6,o:25},{l:'$50',p:56.9,o:50},{l:'$100',p:113.49,o:100}]},
  {id:'xrp',cat:'crypto',name:{ar:'XRP Ripple',en:'XRP Ripple'},reg:{ar:'🌍 Ripple',en:'🌍 Ripple'},bg:'linear-gradient(145deg,#001a2e,#00aae4)',d:[{l:'$25',p:28.6,o:25},{l:'$50',p:56.9,o:50},{l:'$100',p:113.49,o:100}]},

  // ── NEW PRODUCTS (from dundle / baxity) ──
  {id:'paysafecard',cat:'prepaid',rating:4.5,reviews:617,name:{ar:'PaysafeCard',en:'PaysafeCard'},reg:{ar:'🇳🇴 النرويج',en:'🇳🇴 Norway'},bg:'linear-gradient(145deg,#003087,#0070d1)',d:[{l:'€10',p:12.3,o:10},{l:'€25',p:30.8,o:25},{l:'€50',p:61.6,o:50},{l:'€100',p:123.2,o:100}]},
  {id:'bitsa',cat:'prepaid',rating:3.5,reviews:21,name:{ar:'Bitsa Visa Voucher',en:'Bitsa Visa Voucher'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#f7901e,#ff6b00)',d:[{l:'€10',p:12.3,o:10},{l:'€25',p:30.8,o:25},{l:'€50',p:61.6,o:50}]},
  {id:'cashlib',cat:'prepaid',rating:4.3,reviews:169,name:{ar:'CASHlib Voucher',en:'CASHlib Voucher'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1a237e,#283593)',d:[{l:'€10',p:12.3,o:10},{l:'€20',p:24.6,o:20},{l:'€50',p:61.6,o:50},{l:'€100',p:123.2,o:100}]},
  {id:'mifinity',cat:'prepaid',rating:4.1,reviews:8,name:{ar:'MiFinity eVoucher',en:'MiFinity eVoucher'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#6200ea,#9c27b0)',d:[{l:'€10',p:12.3,o:10},{l:'€25',p:30.8,o:25},{l:'€50',p:61.6,o:50},{l:'€100',p:123.2,o:100}]},
  {id:'transcash',cat:'prepaid',rating:4.0,reviews:32,name:{ar:'Transcash Voucher',en:'Transcash Voucher'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#b71c1c,#e53935)',d:[{l:'€10',p:12.3,o:10},{l:'€30',p:37,o:30},{l:'€50',p:61.6,o:50}]},
  {id:'icash',cat:'prepaid',rating:4.2,reviews:45,name:{ar:'iCash Voucher',en:'iCash Voucher'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1a1a2e,#e63946)',d:[{l:'€10',p:12.3,o:10},{l:'€25',p:30.8,o:25},{l:'€50',p:61.6,o:50}]},
  {id:'cryptovoucher',cat:'crypto',rating:4.3,reviews:71,name:{ar:'Crypto Voucher',en:'Crypto Voucher'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#1a0040,#9945ff)',d:[{l:'€25',p:30.8,o:25},{l:'€50',p:61.6,o:50},{l:'€100',p:123.2,o:100}]},
  {id:'giftmecrypto',cat:'crypto',rating:2.0,reviews:0,name:{ar:'Gift Me Crypto',en:'Gift Me Crypto'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},bg:'linear-gradient(145deg,#00796b,#00bfa5)',d:[{l:'€25',p:30.8,o:25},{l:'€50',p:61.6,o:50},{l:'€100',p:123.2,o:100}]},];

/* ══════════════════════════════════════════
   PAYMENT METHODS
══════════════════════════════════════════ */
const PM=[
  {id:'visa-card',icon:'💳',name:{ar:'Visa / Mastercard',en:'Visa / Mastercard'},sub:{ar:'بطاقة ائتمان',en:'Credit/Debit Card'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},fields:'card'},
  {id:'paypal',icon:'🔵',name:{ar:'PayPal',en:'PayPal'},sub:{ar:'محفظة PayPal',en:'PayPal Wallet'},reg:{ar:'🇺🇸🇬🇧🇳🇴🇸🇪',en:'🇺🇸🇬🇧🇳🇴🇸🇪'},fields:'email'},
  {id:'crypto',icon:'₿',name:{ar:'Crypto USDT/BTC',en:'Crypto USDT/BTC'},sub:{ar:'خصم 2% إضافي',en:'Extra 2% off'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},fields:'crypto'},
  {id:'vipps',icon:'🟣',name:{ar:'Vipps',en:'Vipps'},sub:{ar:'محفظة نرويجية',en:'Norwegian Wallet'},reg:{ar:'🇳🇴 Norway',en:'🇳🇴 Norway'},fields:'phone'},
  {id:'swish',icon:'🟦',name:{ar:'Swish',en:'Swish'},sub:{ar:'محفظة سويدية',en:'Swedish Wallet'},reg:{ar:'🇸🇪 Sweden',en:'🇸🇪 Sweden'},fields:'phone'},
  {id:'klarna',icon:'🌸',name:{ar:'Klarna',en:'Klarna'},sub:{ar:'ادفع لاحقاً',en:'Pay Later'},reg:{ar:'🇳🇴🇸🇪🇬🇧',en:'🇳🇴🇸🇪🇬🇧'},fields:'email'},
  {id:'bank',icon:'🏦',name:{ar:'Bank Transfer',en:'Bank Transfer'},sub:{ar:'تحويل بنكي',en:'Wire Transfer'},reg:{ar:'🇬🇧 UK',en:'🇬🇧 UK'},fields:'bank'},
  {id:'sadad',icon:'🟩',name:{ar:'SADAD',en:'SADAD'},sub:{ar:'السعودية',en:'Saudi Arabia'},reg:{ar:'🇸🇦 KSA',en:'🇸🇦 KSA'},fields:'ref'},
  {id:'stcpay',icon:'🟪',name:{ar:'STC Pay',en:'STC Pay'},sub:{ar:'محفظة STC',en:'STC Wallet'},reg:{ar:'🇸🇦 KSA',en:'🇸🇦 KSA'},fields:'phone'},
  {id:'fawry',icon:'🟠',name:{ar:'Fawry',en:'Fawry'},sub:{ar:'مصر',en:'Egypt'},reg:{ar:'🇪🇬 Egypt',en:'🇪🇬 Egypt'},fields:'ref'},
  {id:'cmi',icon:'🔶',name:{ar:'CMI / Maroc Pay',en:'CMI / Maroc Pay'},sub:{ar:'المغرب',en:'Morocco'},reg:{ar:'🇲🇦 Morocco',en:'🇲🇦 Morocco'},fields:'card'},
  {id:'papara',icon:'🟡',name:{ar:'Papara',en:'Papara'},sub:{ar:'تركيا',en:'Turkey'},reg:{ar:'🇹🇷 Turkey',en:'🇹🇷 Turkey'},fields:'email'},
  {id:'apple-pay',icon:'⬛',name:{ar:'Apple Pay',en:'Apple Pay'},sub:{ar:'أجهزة Apple',en:'Apple Devices'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},fields:'none'},
  {id:'gpay',icon:'⬜',name:{ar:'Google Pay',en:'Google Pay'},sub:{ar:'Android/Chrome',en:'Android/Chrome'},reg:{ar:'🌍 عالمي',en:'🌍 Global'},fields:'none'},
];

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
const RATES={USD:1,EUR:0.92,GBP:0.79,NOK:10.62,SEK:10.44,SAR:3.75,KWD:0.31,AED:3.67,EGP:48.3,MAD:9.93,TRY:32.1,LYD:4.82};
const SYMS={USD:'$',EUR:'€',GBP:'£',NOK:'kr',SEK:'kr',SAR:'﷼',KWD:'د.ك',AED:'د.إ',EGP:'ج.م',MAD:'د.م',TRY:'₺',LYD:'ل.د'};
let lang='ar',cur='USD',filter='all',selD={},cart=[],ckStep=1,selPM=null;
// Auth state managed by JWT system below
// currentUser, _authToken defined in AUTH section
function fmt(usd){return SYMS[cur]+(usd*RATES[cur]).toFixed(2);}

/* ══════════════════════════════════════════
   RENDER PRODUCTS
══════════════════════════════════════════ */
const CAT_AR={game:'ألعاب',gift:'هدية',prepaid:'بطاقة',crypto:'كريبتو',fashion:'أزياء',retail:'تسوق',home:'منزل',electronics:'تقنية',food:'طعام'};
const CAT_EN={game:'Gaming',gift:'Gift',prepaid:'Prepaid',crypto:'Crypto',fashion:'Fashion',retail:'Retail',home:'Home',electronics:'Tech',food:'Food'};

function renderProducts(){
  const grid=g('pgrid');
  const list=filter==='all'?P:P.filter(p=>p.cat===filter);
  if(!list.length){grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--sub);">لا توجد منتجات في هذه الفئة</div>';return;}
  grid.innerHTML=list.map(p=>{
    const di=selD[p.id]||0,d=p.d[di];
    const disc=Math.max(1,Math.round((1-d.p/d.o)*100));
    const dens=p.d.map((dd,i)=>`<button class="den${i===di?' on':''}" onclick="selDenom('${p.id}',${i},event)">${dd.l}</button>`).join('');
    const logoUrl=getLogo(p.id);
    const chipTxt=lang==='ar'?(CAT_AR[p.cat]||p.cat):(CAT_EN[p.cat]||p.cat);
    return `<div class="pc">
      <div class="pc-head" style="background:${p.bg}">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.10),transparent 55%);pointer-events:none;"></div>
        <img class="pc-logo" src="${logoUrl}" alt="${p.name[lang]}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <div class="pc-fallback">${p.name[lang]}</div>
        <div class="pc-badge">-${disc}%</div>
        <div class="pc-chip">${chipTxt}</div>
      </div>
      <div class="pc-body">
        <div class="pc-name">${p.name[lang]}</div>
        <div class="pc-reg">${p.reg[lang]}</div>
        <div class="denoms">${dens}</div>
        <div class="pc-pr-row">
          <div>
            <div class="pc-old">${fmt(d.o)}</div>
            <div class="pc-price">${fmt(d.p)}</div>
            <div class="pc-disc">-${disc}% OFF</div>
          </div>
          <button class="add-btn" onclick="addCart('${p.id}',event)">${lang==='ar'?'أضف +':'Add +'}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function selDenom(id,i,e){e.stopPropagation();selD[id]=i;renderProducts();}
function filterTab(btn,cat){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  btn.classList.add('on');filter=cat;renderProducts();
}
function jcat(cat,id){
  filter=cat;
  const tabMap={all:'tb-all',game:'tb-game',gift:'tb-gift',prepaid:'tb-pre',crypto:'tb-crypto',fashion:'tb-fash',retail:'tb-ret',home:'tb-home',electronics:'tb-elec',food:'tb-food'};
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  const tb=g(tabMap[cat]||'tb-all');tb.classList.add('on');
  renderProducts();
  const sec=document.getElementById('sec-products');
  if(sec)setTimeout(()=>sec.scrollIntoView({behavior:'smooth',block:'start'}),80);
  // close all dropdowns
  document.querySelectorAll('.nav-cat.open').forEach(el=>el.classList.remove('open'));
}

/* ══════════════════════════════════════════
   CART
══════════════════════════════════════════ */
function addCart(id,e){
  e&&e.stopPropagation();
  const p=P.find(x=>x.id===id),di=selD[id]||0,d=p.d[di],key=id+'_'+di;
  const ex=cart.find(c=>c.key===key);
  if(ex)ex.qty++;
  else cart.push({key,id,reloadlyId:p.reloadlyId||null,cat:p.cat,name:p.name,bg:p.bg,denom:d.l,price:d.p,orig:d.o,qty:1});
  updateCart();toast(lang==='ar'?'✅ تمت الإضافة للسلة!':'✅ Added to cart!');
  const el=g('cartN');el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');
}
function removeCart(key){cart=cart.filter(c=>c.key!==key);updateCart();}
function changeQty(key,d){
  const item=cart.find(c=>c.key===key);if(!item)return;
  item.qty+=d;if(item.qty<=0)cart=cart.filter(c=>c.key!==key);
  updateCart();
}
function clearCart(){cart=[];updateCart();}

function updateCart(){
  const n=cart.reduce((a,c)=>a+c.qty,0);
  const sub=cart.reduce((a,c)=>a+c.price*c.qty,0);
  const orig=cart.reduce((a,c)=>a+c.orig*c.qty,0);
  g('cartN').textContent=n;
  g('cart-nav-total').textContent=fmt(sub);
  g('ct1v').textContent=fmt(sub);
  g('ct2v').textContent='-'+fmt(orig-sub);
  g('ct3v').textContent=fmt(sub);
  g('checkoutBtn').disabled=!cart.length;
  const el=g('cartList');
  if(!cart.length){el.innerHTML=`<div class="cart-empty"><div style="font-size:44px;margin-bottom:10px;">🛒</div><p>${lang==='ar'?'سلتك فارغة':'Your cart is empty'}</p></div>`;return;}
  el.innerHTML=cart.map(item=>`
    <div class="ci-card">
      <div class="ci-thumb" style="background:${item.bg}">
        <img src="${getLogo(item.id)}" alt="${item.name[lang]}" style="max-width:44px;max-height:30px;object-fit:contain;" onerror="this.style.display='none'">
      </div>
      <div class="ci-info">
        <div class="ci-name">${item.name[lang]}</div>
        <div class="ci-den">${item.denom}</div>
        <div class="ci-qty">
          <button class="qbtn" onclick="changeQty('${item.key}',-1)">−</button>
          <span class="qnum">${item.qty}</span>
          <button class="qbtn" onclick="changeQty('${item.key}',1)">+</button>
        </div>
      </div>
      <div class="ci-right">
        <div class="ci-price">${fmt(item.price*item.qty)}</div>
        <button class="ci-del" onclick="removeCart('${item.key}')">🗑️</button>
      </div>
    </div>`).join('');
}

function openCart(){g('cartOv').classList.add('open');g('cartDr').classList.add('open');}
function closeCart(){g('cartOv').classList.remove('open');g('cartDr').classList.remove('open');}

/* ══════════════════════════════════════════
   CHECKOUT
══════════════════════════════════════════ */
function goCheckout(){
  if(!cart.length)return;
  // Require login before checkout
  if(!_authToken){
    closeCart();
    toast(lang==='ar'?'🔐 يرجى تسجيل الدخول أولاً':'🔐 Please sign in to continue');
    setTimeout(function(){ openAuth('login'); }, 300);
    return;
  }
  closeCart();ckStep=1;selPM=null;
  buildCkSummary();buildPmGrid();showCkStep(1);
  g('ckModal').classList.add('open');
}

function buildCkSummary(){
  const sub=cart.reduce((a,c)=>a+c.price*c.qty,0);
  const orig=cart.reduce((a,c)=>a+c.orig*c.qty,0);
  g('ck-list').innerHTML=cart.map(item=>`
    <div class="ci-card" style="margin-bottom:7px;">
      <div class="ci-thumb" style="background:${item.bg}"><img src="${getLogo(item.id)}" style="max-width:44px;max-height:28px;object-fit:contain;" onerror="this.style.display='none'"></div>
      <div class="ci-info"><div class="ci-name">${item.name[lang]}</div><div class="ci-den">${item.denom} × ${item.qty}</div></div>
      <div class="ci-right"><div class="ci-price">${fmt(item.price*item.qty)}</div></div>
    </div>`).join('');
  g('ck-sum').innerHTML=`
    <div class="os-row"><span>${lang==='ar'?'المجموع الفرعي':'Subtotal'}</span><span>${fmt(orig)}</span></div>
    <div class="os-row"><span>${lang==='ar'?'الخصم':'Discount'}</span><span style="color:var(--accent3)">-${fmt(orig-sub)}</span></div>
    <div class="os-row"><span>${lang==='ar'?'الإجمالي':'Total'}</span><span>${fmt(sub)}</span></div>`;
}

function buildPmGrid(){
  g('pmGrid').innerHTML=PM.map(pm=>`
    <div class="pmc${selPM===pm.id?' sel':''}" onclick="pickPM('${pm.id}')">
      <div class="pmc-icon">${pm.icon}</div>
      <div class="pmc-name">${pm.name[lang]}</div>
      <div class="pmc-sub">${pm.sub[lang]}</div>
      <div class="pmc-reg">${pm.reg[lang]}</div>
    </div>`).join('');
}
function pickPM(id){selPM=id;buildPmGrid();}

function showCkStep(n){
  ckStep=n;
  [1,2,3,4].forEach(i=>{
    const p=g('ckp'+i),s=g('cks'+i);
    if(p)p.classList.toggle('active',i===n);
    if(s){s.classList.remove('active','done');if(i===n)s.classList.add('active');else if(i<n)s.classList.add('done');}
  });
}

function ckNext(n){
  if(n===3){if(!selPM){toast(lang==='ar'?'⚠️ اختر طريقة دفع':'⚠️ Select a payment method');return;}buildPmDetails();return;}
  if(n===4){completeOrder();return;}
  showCkStep(n);
}

const RAILWAY_URL='https://bridgecards-api.onrender.com';
let stripeInstance=null,stripeElements=null,stripeCardEl=null;

async function initStripe(){
  if(stripeInstance)return;
  try{
    const res=await fetch(`${RAILWAY_URL}/api/stripe-key`);
    const {publishableKey}=await res.json();
    stripeInstance=Stripe(publishableKey);
  }catch(e){console.error('Stripe init:',e);}
}

async function buildPmDetails(){
  const pm=PM.find(p=>p.id===selPM);
  const el=g('pmDetails');
  let h=`<div class="fst">${pm.name[lang]} — ${lang==='ar'?'تفاصيل الدفع':'Payment Details'}</div>`;
  if(pm.fields==='card'){
    await initStripe();
    const total=cart.reduce((a,c)=>a+c.price*c.qty,0);
    h+=`<div class="fg"><label>${lang==='ar'?'البريد الإلكتروني':'Email'}</label>
      <input type="email" id="stripe-email" placeholder="you@email.com" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-family:inherit;margin-top:4px;">
    </div>
    <div class="fg" style="margin-top:12px;"><label>${lang==='ar'?'بيانات البطاقة':'Card Details'}</label>
      <div id="stripe-card-element" style="padding:12px;border:1px solid var(--border2);border-radius:8px;background:var(--bg2);margin-top:6px;"></div>
      <div id="stripe-card-errors" style="color:#ff4f7b;font-size:12px;margin-top:5px;"></div>
    </div>
    <div style="background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.25);border-radius:10px;padding:10px;font-size:12px;color:var(--accent3);margin-top:10px;text-align:center;">
      🔒 ${lang==='ar'?'مدفوعات آمنة عبر Stripe':'Secure payments via Stripe'} · ${lang==='ar'?'الإجمالي':'Total'}: $${total.toFixed(2)}
    </div>`;
    el.innerHTML=h;
    if(stripeInstance){
      stripeElements=stripeInstance.elements();
      stripeCardEl=stripeElements.create('card',{style:{base:{color:'#eef0ff',fontFamily:'Cairo,sans-serif',fontSize:'14px','::placeholder':{color:'#9294b8'}},invalid:{color:'#ff4f7b'}}});
      stripeCardEl.mount('#stripe-card-element');
      stripeCardEl.on('change',e=>{const er=g('stripe-card-errors');if(er)er.textContent=e.error?e.error.message:'';});
    }
    showCkStep(3);return;
  }
  if(pm.fields==='phone'){h+=`<div class="fg"><label>${lang==='ar'?'رقم الهاتف':'Phone'}</label><input type="tel" placeholder="+47 XXX XX XXX" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-family:inherit;"></div>`;}
  else if(pm.fields==='email'){h+=`<div class="fg"><label>Email</label><input type="email" placeholder="you@email.com" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-family:inherit;"></div>`;}
  else if(pm.fields==='crypto'){h+=`<div style="background:var(--bg2);border:1px dashed var(--accent3);border-radius:10px;padding:14px;text-align:center;margin-bottom:12px;"><div style="font-size:12px;color:var(--sub);margin-bottom:5px;">${lang==='ar'?'أرسل إلى:':'Send to:'}</div><div style="font-size:11px;font-weight:700;color:var(--accent3);word-break:break-all;">TRC20: TNsF1xQ2bBzR9vXmKkPWcLqU7H3dYjM8pE</div></div><div class="fg"><label>TXID</label><input type="text" placeholder="Transaction Hash..." style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg2);color:var(--text);font-family:inherit;"></div>`;}
  else if(pm.fields==='bank'){h+=`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px;font-size:12px;line-height:2;margin-bottom:12px;">IBAN: NO93 1503 6800 117<br>Name: Zetony LLC<br>Bank: DNB Bank ASA</div>`;}
  else{h+=`<div style="background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.25);border-radius:10px;padding:13px;font-size:13px;color:var(--accent3);">${lang==='ar'?'اضغط تأكيد ودفع':'Press confirm to complete.'}</div>`;}
  el.innerHTML=h;showCkStep(3);
}

async function completeOrder(){
  // Extract email: JWT token → currentUser → stripe form
  var recipientEmail = '';
  if(currentUser && currentUser.email) {
    recipientEmail = currentUser.email;
  } else if(_authToken) {
    try{
      var _tp=_authToken.split('.');
      if(_tp.length===3){
        var _pl=JSON.parse(atob(_tp[1].replace(/-/g,'+').replace(/_/g,'/')));
        recipientEmail=_pl.email||'';
      }
    }catch(e){}
  }
  if(!recipientEmail && g('stripe-email')) recipientEmail = g('stripe-email').value.trim();
  if(!recipientEmail){toast(lang==='ar'?'\u26a0\ufe0f \u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648\u0644\u0627\u064b':'\u26a0\ufe0f Please login first');return;}
  var btn=g('ck-n3');
  if(btn){btn.disabled=true;btn.textContent=lang==='ar'?'\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0642\u0642...':'Checking...';}

  for(var ci=0;ci<cart.length;ci++){
    var citem=cart[ci];
    if(citem.reloadlyId){
      try{
        var chkHdrs={'Content-Type':'application/json'};if(typeof _authToken!=='undefined'&&_authToken)chkHdrs['Authorization']='Bearer '+_authToken;
      var chkRes=await fetch(RAILWAY_URL+'/api/check-product',{method:'POST',headers:chkHdrs,body:JSON.stringify({productId:citem.reloadlyId})});
        var chkData=await chkRes.json();
        if(!chkData.available){
          toast(chkData.error||'\u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u062a\u062c \u063a\u064a\u0631 \u0645\u062a\u0627\u062d \u062d\u0627\u0644\u064a\u0627\u064b');
          if(btn){btn.disabled=false;btn.textContent=lang==='ar'?'\u062a\u0623\u0643\u064a\u062f \u0648\u062f\u0641\u0639 \u2192':'Confirm & Pay \u2192';}
          return;
        }
      }catch(e){console.log('check err',e);}
    }
  }

  var total=cart.reduce(function(a,c){return a+c.price*c.qty;},0);
  var paymentIntentId=null;

  try{
    if(selPM==='visa-card'&&stripeInstance&&stripeCardEl){
      if(btn)btn.textContent=lang==='ar'?'\u062c\u0627\u0631\u064d \u0627\u0644\u062f\u0641\u0639...':'Processing payment...';
      var emailVal=(g('stripe-email')?g('stripe-email').value.trim():'')||recipientEmail;
      var piRes=await fetch(RAILWAY_URL+'/api/create-payment-intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:total,currency:'usd',email:emailVal,productId:cart[0]?cart[0].reloadlyId:null})});
      var piData=await piRes.json();
      if(piData.error)throw new Error(piData.error);
      var stripeResult=await stripeInstance.confirmCardPayment(piData.clientSecret,{payment_method:{card:stripeCardEl,billing_details:{email:emailVal}}});
      if(stripeResult.error)throw new Error(stripeResult.error.message);
      if(stripeResult.paymentIntent.status!=='succeeded')throw new Error('Payment failed');
      paymentIntentId=stripeResult.paymentIntent.id;
    }

    if(btn)btn.textContent=lang==='ar'?'\u062c\u0627\u0631\u064d \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0637\u0644\u0628...':'Processing order...';
    var loadMsg=lang==='ar'?'\u062c\u0627\u0631\u064d \u062a\u0633\u0644\u064a\u0645 \u0627\u0644\u0643\u0631\u0648\u062a...':'Delivering cards...';
    g('codesArea').innerHTML='<div style="text-align:center;padding:30px;color:var(--sub)"><div style="font-size:28px">&#9203;</div><div>'+loadMsg+'</div></div>';
    showCkStep(4);

    var html='';
    for(var oi=0;oi<cart.length;oi++){
      var oitem=cart[oi];
      var oHdrs = {'Content-Type':'application/json'};
      if(typeof _authToken !== 'undefined' && _authToken) oHdrs['Authorization']='Bearer '+_authToken;
      var orderRes=await fetch(RAILWAY_URL+'/orders',{method:'POST',headers:oHdrs,body:JSON.stringify({
        productId:oitem.reloadlyId,
        quantity:oitem.qty,
        unitPrice:oitem.price,
        userEmail:recipientEmail,
        recipientEmail:recipientEmail,
        paymentMethod:selPM||'unknown',
        paymentIntentId:paymentIntentId
      })});
      var odata=await orderRes.json();

      if(odata.refunded){
        var refMsg=lang==='ar'?'\u0641\u0634\u0644 \u0634\u0631\u0627\u0621 \u0627\u0644\u0643\u0631\u062a \u2013 \u0633\u064a\u062a\u0645 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u0628\u0644\u063a':'Purchase failed \u2013 refund initiated';
        g('codesArea').innerHTML='<div style="text-align:center;padding:20px"><div style="font-size:28px">\u26a0\ufe0f</div><div style="font-weight:700;color:var(--accent2)">'+refMsg+'</div><div style="font-size:13px;color:var(--accent3);margin-top:10px">'+(odata.refundMessage||'')+'</div></div>';
        if(btn){btn.disabled=false;btn.textContent=lang==='ar'?'\u062a\u0623\u0643\u064a\u062f \u0648\u062f\u0641\u0639 \u2192':'Confirm & Pay \u2192';}
        return;
      }

      if(odata.error)throw new Error(odata.error);
      if(odata.orderStatus!=='SUCCESSFUL'&&odata.status!=='SUCCESSFUL'){throw new Error(lang==='ar'?'\u062d\u062f\u062b \u062e\u0637\u0623':'Order error');}

      var codes=odata.transactions||odata.cards||(odata.status==='SUCCESSFUL'?[odata]:[odata]);
      html+='<div style="margin-bottom:20px"><div style="font-size:13px;font-weight:700;margin-bottom:10px">'+oitem.name[lang]+' \u2014 '+oitem.denom+'</div>';

      for(var ki=0;ki<codes.length;ki++){
        var kcard=codes[ki];
        var kcode=kcard.pinCode||kcard.cardNumber||kcard.code||(kcard.cards&&kcard.cards[0]&&(kcard.cards[0].pinCode||kcard.cards[0].cardNumber))||kcard.transactionId||'';
        if(!kcode)continue;
        html+='<div style="display:flex;align-items:center;gap:10px;background:rgba(61,107,255,.08);border:1px solid rgba(61,107,255,.25);border-radius:10px;padding:14px 16px;margin-bottom:8px">';
        html+='<div style="flex:1;font-family:monospace;font-size:18px;font-weight:900;letter-spacing:3px;color:var(--accent3)">'+kcode+'</div>';
        html+='<button onclick="navigator.clipboard.writeText(\''+kcode+'\').then(function(){toast(\'\u2705 \u062a\u0645 \u0627\u0644\u0646\u0633\u062e\');});" style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:12px;font-weight:700">'+(lang==='ar'?'\u0646\u0633\u062e':'Copy')+'</button>';
        html+='</div>';
      }
      var sentMsg=lang==='ar'?'\u2705 \u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0643\u0648\u062f \u0625\u0644\u0649 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a':'\u2705 Code sent to your email';
      html+='<div style="font-size:12px;color:var(--accent3);margin-top:6px;padding:8px;background:rgba(0,212,170,.06);border-radius:6px;text-align:center">'+sentMsg+'</div></div>';
    }

    g('codesArea').innerHTML=html||'<div style="text-align:center;padding:20px">'+(lang==='ar'?'\u062a\u0645 \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0637\u0644\u0628':'Order completed')+'</div>';
    if(currentUser){var users=getUsers(),u=users[currentUser.email];if(u){if(!u.orders)u.orders=[];u.orders.push({date:new Date().toISOString(),items:JSON.parse(JSON.stringify(cart)),total:total});saveUsers(users);}}
    cart=[];updateCart();
    toast(lang==='ar'?'\ud83c\udf89 \u062a\u0645 \u0627\u0644\u0634\u0631\u0627\u0621 \u0628\u0646\u062c\u0627\u062d!':'\ud83c\udf89 Order completed!');

  }catch(err){
    g('codesArea').innerHTML='<div style="text-align:center;padding:24px;color:var(--accent2)"><div style="font-size:24px;margin-bottom:8px">\u274c</div><div style="font-weight:700">'+(lang==='ar'?'\u062d\u062f\u062b \u062e\u0637\u0623':'Error')+'</div><div style="font-size:12px;color:var(--sub);margin-top:5px">'+err.message+'</div></div>';
    showCkStep(4);
    if(btn){btn.disabled=false;btn.textContent=lang==='ar'?'\u062a\u0623\u0643\u064a\u062f \u0648\u062f\u0641\u0639 \u2192':'Confirm & Pay \u2192';}
  }
}

/* ══════════════════════════════════════════
   AUTH — JWT Backend Authentication
   Replaces localStorage/btoa with secure JWT
══════════════════════════════════════════ */

// Token storage
var _authToken = localStorage.getItem('bc_token') || null;
var currentUser = null;

// Restore session on load
(function(){
  var saved = localStorage.getItem('bc_token');
  if (!saved) return;
  try {
    var parts = saved.split('.');
    if (parts.length !== 3) { localStorage.removeItem('bc_token'); return; }
    var pad = parts[1] + '==='.slice((parts[1].length + 3) % 4);
    var payload = JSON.parse(atob(pad.replace(/-/g,'+').replace(/_/g,'/')));
    if (payload.exp && payload.exp < Math.floor(Date.now()/1000)) {
      localStorage.removeItem('bc_token'); return;
    }
    _authToken = saved;
  } catch(e) { localStorage.removeItem('bc_token'); }
})();

function getAuthHeaders() {
  var h = { 'Content-Type': 'application/json' };
  if (_authToken) h['Authorization'] = 'Bearer ' + _authToken;
  return h;
}

function openAuth(tab) { switchAuth(tab); g('authModal').classList.add('open'); }

function switchAuth(tab) {
  ['login','register'].forEach(function(t){
    g('atab-'+t).classList.toggle('on', t===tab);
    g('apanel-'+t).classList.toggle('on', t===tab);
  });
}

function doLogin() {
  var email = g('l-email').value.trim();
  var pass  = g('l-pass').value;
  var err   = g('lerr');
  err.classList.remove('show');
  if (!email || !pass) {
    err.innerHTML = lang==='ar' ? 'يرجى ملء جميع الحقول' : 'Fill all fields';
    err.classList.add('show'); return;
  }
  var btn = g('l-sub');
  btn.disabled = true;
  btn.textContent = lang==='ar' ? 'جارٍ...' : 'Loading...';

  fetch(RAILWAY_URL + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: pass })
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    btn.disabled = false;
    btn.textContent = T[lang]['l-sub'] || (lang==='ar' ? 'تسجيل الدخول' : 'Sign In');
    if (!res.ok) {
      err.innerHTML = res.data.error || (lang==='ar' ? 'بيانات خاطئة' : 'Invalid credentials');
      err.classList.add('show'); return;
    }
    _authToken  = res.data.token;
    currentUser = res.data.user;
    localStorage.setItem('bc_token', _authToken);
    closeM('authModal');
    updateNavUser();
    var name = currentUser.firstName || '';
    toast(lang==='ar' ? ('👋 أهلاً ' + name + '!') : ('👋 Welcome back, ' + name + '!'));
  })
  .catch(function() {
    btn.disabled = false;
    btn.textContent = T[lang]['l-sub'] || (lang==='ar' ? 'تسجيل الدخول' : 'Sign In');
    err.innerHTML = lang==='ar' ? 'خطأ في الاتصال' : 'Connection error';
    err.classList.add('show');
  });
}

function doRegister() {
  var fn   = g('r-fname').value.trim();
  var ln   = g('r-lname').value.trim();
  var email= g('r-email').value.trim();
  var pass = g('r-pass').value;
  var type = g('r-type').value;
  var err  = g('rerr');
  err.classList.remove('show');
  if (!fn || !ln || !email || !pass) {
    err.innerHTML = lang==='ar' ? 'يرجى ملء جميع الحقول' : 'Fill all fields';
    err.classList.add('show'); return;
  }
  if (pass.length < 8) {
    err.innerHTML = lang==='ar' ? 'كلمة المرور 8 أحرف على الأقل' : 'Password must be 8+ characters';
    err.classList.add('show'); return;
  }
  var btn = g('r-sub');
  btn.disabled = true;
  btn.textContent = lang==='ar' ? 'جارٍ...' : 'Loading...';

  fetch(RAILWAY_URL + '/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: fn, lastName: ln, email: email, password: pass, accountType: type })
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    btn.disabled = false;
    btn.textContent = T[lang]['r-sub'] || (lang==='ar' ? 'إنشاء الحساب' : 'Create Account');
    if (!res.ok) {
      err.innerHTML = res.data.error || (lang==='ar' ? 'خطأ في التسجيل' : 'Registration error');
      err.classList.add('show'); return;
    }
    _authToken  = res.data.token;
    currentUser = res.data.user;
    localStorage.setItem('bc_token', _authToken);
    closeM('authModal');
    updateNavUser();
    toast(lang==='ar' ? ('🎉 مرحباً ' + fn + '!') : ('🎉 Welcome ' + fn + '!'));
  })
  .catch(function() {
    btn.disabled = false;
    btn.textContent = T[lang]['r-sub'] || (lang==='ar' ? 'إنشاء الحساب' : 'Create Account');
    err.innerHTML = lang==='ar' ? 'خطأ في الاتصال' : 'Connection error';
    err.classList.add('show');
  });
}

function socialLogin(provider) {
  toast(lang==='ar' ? ('⏳ ' + provider + ' قريباً!') : ('⏳ ' + provider + ' login coming soon!'));
}

function logout() {
  _authToken  = null;
  currentUser = null;
  localStorage.removeItem('bc_token');
  g('guestBtns').style.display = 'flex';
  g('navUser').style.display   = 'none';
  toast(lang==='ar' ? '👋 تم تسجيل الخروج' : '👋 Signed out');
}

function updateNavUser() {
  if (!currentUser && _authToken) {
    fetch(RAILWAY_URL + '/auth/me', { headers: getAuthHeaders() })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(u) { if (u) { currentUser = u; _renderNav(); } else { logout(); } })
      .catch(function() {});
    return;
  }
  _renderNav();
}

function _renderNav() {
  if (!currentUser) {
    g('guestBtns').style.display = 'flex';
    g('navUser').style.display   = 'none';
    return;
  }
  g('guestBtns').style.display = 'none';
  var nu = g('navUser');
  nu.style.display    = 'flex';
  nu.style.alignItems = 'center';
  g('navAv').textContent   = (currentUser.firstName || 'U').charAt(0).toUpperCase();
  g('navName').textContent = currentUser.firstName || currentUser.email;
}

// My Orders modal
function openMyOrders() {
  if (!_authToken) { openAuth('login'); return; }
  fetch(RAILWAY_URL + '/orders/user', { headers: getAuthHeaders() })
    .then(function(r) { return r.json(); })
    .then(function(orders) {
      var pdN = g('pd-name');
      var body = g('pd-body');
      if (!body || !pdN) return;
      pdN.textContent = lang==='ar' ? 'طلباتي' : 'My Orders';
      if (!orders.length) {
        body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--sub);">'
          + '<div style="font-size:44px;margin-bottom:12px;">📦</div>'
          + '<p>' + (lang==='ar' ? 'لا توجد طلبات بعد' : 'No orders yet') + '</p></div>';
      } else {
        var scAR = {pending:'قيد الانتظار',paid:'تم الدفع',processing:'جارٍ التنفيذ',delivered:'تم التسليم',failed:'فشل',refunded:'مسترد'};
        var scCL = {pending:'#ffbe00',paid:'#3d6bff',processing:'#9294b8',delivered:'#00d4aa',failed:'#ff4f7b',refunded:'#ff4f7b'};
        body.innerHTML = orders.map(function(o) {
          var c   = scCL[o.status]  || '#9294b8';
          var lbl = lang==='ar' ? (scAR[o.status] || o.status) : o.status;
          return '<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">'
            + '<div><div style="font-size:12px;font-weight:800;">' + o.id + '</div>'
            + '<div style="font-size:11px;color:var(--sub);margin-top:3px;">' + (o.productName||o.productId) + '</div></div>'
            + '<div style="text-align:end;"><div style="font-size:14px;font-weight:900;color:var(--accent3);">$' + o.totalAmount + '</div>'
            + '<div style="font-size:10px;font-weight:800;color:' + c + ';margin-top:3px;">' + lbl + '</div></div>'
            + '</div>';
        }).join('');
      }
      openM('pdModal');
    })
    .catch(function() { toast(lang==='ar' ? 'خطأ في جلب الطلبات' : 'Error loading orders'); });
}

/* ══════════════════════════════════════════
   LANGUAGE
══════════════════════════════════════════ */
const T={
  ar:{
    'topbar-txt':'🎉 خصم 2% عند الدفع بالكريبتو — كود: CRYPTO2 &nbsp;|&nbsp; تسليم فوري ⚡',
    'logo-sub':'جسر الكروت','lang-lbl':'EN',
    'nc0t':'بطاقات الهدايا','nc1t':'رصيد الألعاب','nc2t':'مسبقة الدفع',
    'nc3t':'كريبتو','nc4t':'أزياء','nc5t':'سوبرماركت','nc6t':'الجملة',
    'hb':'🤝 برنامج شركاء الجملة العالمي',
    'hh':'اشترِ بطاقات الهدايا<br><em>بأسعار الجملة الحصرية</em>',
    'hp':'انضم لآلاف الموزعين حول العالم. تسليم فوري، خصومات تصل لـ 15%.',
    'hbtn1':'ابدأ كشريك الآن','hbtn2':'تصفح الكتالوج',
    'sl1':'شريك نشط','sl2':'منتج رقمي','sl3':'أقصى خصم','sl4':'تسليم فوري',
    'st1':'كتالوج <em>المنتجات</em>','st2':'اختر الفئة والسعر المناسب',
    'tbl-all':'الكل','tbl-game':'ألعاب','tbl-gift':'هدايا','tbl-pre':'مسبقة الدفع',
    'tbl-crypto':'كريبتو','tbl-fash':'أزياء','tbl-ret':'سوبرماركت',
    'tbl-home':'أثاث','tbl-elec':'إلكترونيات','tbl-food':'طعام',
    'bent':'لماذا <em>BridgeCards؟</em>',
    'b1t':'خصومات متدرجة','b1d':'كلما زادت مشترياتك ارتفع خصمك حتى 15%.',
    'b2t':'تسليم فوري 100%','b2d':'الأكواد تُسلَّم خلال ثوانٍ من الدفع.',
    'b3t':'API للمطورين','b3d':'REST API موثق لأتمتة طلباتك.',
    'b4t':'ضمان الاسترداد','b4d':'كود معطل؟ نستبدله فوراً.',
    'b5t':'تغطية عالمية','b5d':'منتجات لأمريكا وأوروبا وآسيا والشرق الأوسط.',
    'b6t':'دفع بالكريبتو','b6d':'USDT وBTC وETH مع خصم 2% إضافي.',
    'tt':'مستويات <em>الشراكة</em>',
    'tv1':'من $500 / شهر','tl1':'$500/شهر','tl2':'دعم بريدي','tl3':'تسليم فوري','tl4':'250+ منتج','tb1':'ابدأ الآن',
    'tpop':'الأكثر طلباً ⭐','tv2':'من $2,000 / شهر','tg1':'$2000/شهر','tg2':'VIP 24/7','tg3':'API كامل','tg4':'أسعار حصرية','tb2':'ابدأ الآن',
    'tv3':'من $10,000 / شهر','tp1':'$10,000/شهر','tp2':'مدير مخصص','tp3':'تكامل كامل','tp4':'عروض حصرية','tb3':'تواصل معنا',
    'howt':'كيف <em>يعمل؟</em>',
    's1t':'سجّل حساباً','s1d':'أنشئ حسابك مجاناً.','s2t':'تفعيل فوري','s2d':'يُفعَّل تلقائياً.',
    's3t':'اشترِ','s3d':'أضف للسلة وادفع.','s4t':'استلم فورياً','s4d':'الأكواد في ثوانٍ.',
    'cht':'انضم للبرنامج<br><span style="color:var(--accent)">اليوم</span>',
    'chp':'أرسل طلب انضمام وسيتواصل معك فريقنا.','cp1':'رد خلال 24 ساعة','cp2':'80+ دولة',
    'fl1':'الاسم','fl2':'البريد','fl3':'الشركة','fl4':'الدولة','fl5':'حجم الشراء','fl6':'رسالتك',
    'fsub':'إرسال طلب الانضمام ←','btn-login':'تسجيل الدخول','btn-reg':'إنشاء حساب',
    'f-sub':'جسر الكروت','f-copy':'© 2026 BridgeCards · <a href="mailto:support@bridgecards.org" style="color:var(--accent3);text-decoration:none;">support@bridgecards.org</a> · <a href="https://t.me/bridgecards" style="color:var(--accent3);text-decoration:none;">Telegram</a>',
    'fl-a':'بطاقات الهدايا','fl-b':'مسبقة الدفع','fl-c':'ألعاب','fl-d':'جملة','fl-e':'خصوصية','fl-f':'شروط',
    'cart-title':'🛒 سلة المشتريات','ct1':'العناصر','ct2':'الخصم','ct3':'الإجمالي',
    'ck-title':'إتمام الشراء','cks1l':'ملخص','cks2l':'الدفع','cks3l':'التفاصيل','cks4l':'تأكيد',
    'ck-s1':'ملخص الطلب','ck-s2':'اختر طريقة الدفع',
    'ck-n1':'التالي →','ck-b2':'← رجوع','ck-n2':'التالي →','ck-b3':'← رجوع','ck-n3':'تأكيد ودفع →',
    'suc-t':'تم الدفع بنجاح!','suc-p':'أكواد بطاقاتك جاهزة — انقر للنسخ',
    'auth-t':'الحساب','at1':'تسجيل الدخول','at2':'إنشاء حساب',
    'll1':'البريد الإلكتروني','ll2':'كلمة المرور','l-sub':'تسجيل الدخول',
    'or1':'أو','or2':'أو',
    'no-acc':'ليس لديك حساب؟ <a onclick="switchAuth(\'register\')">أنشئ حساباً</a>',
    'rl1':'الاسم الأول','rl2':'الاسم الأخير','rl3':'البريد الإلكتروني','rl4':'كلمة المرور','rl5':'نوع الحساب',
    'rt1':'زبون عادي','rt2':'شريك جملة','r-sub':'إنشاء الحساب',
    'has-acc':'لديك حساب؟ <a onclick="switchAuth(\'login\')">سجّل الدخول</a>',
    'dd1':'طلباتي','dd2':'الملف الشخصي',
    'dc00':'تسوق وتقنية','dc01':'ترفيه','dc02':'تطبيقات','dc03':'أثاث ومنزل',
    'dc10':'كونسول','dc11':'PC','dc12':'موبايل','dc13':'Battle Royale',
    'dc20':'بطاقات دولية','dc21':'محافظ رقمية','dc22':'PIN Cards',
    'dc30':'بورصات','dc31':'عملات','dc32':'مستقرة','dc33':'منصات أخرى',
    'dc40':'عالمي','dc41':'UK/Online','dc42':'تركية 1','dc43':'تركية فاخرة',
    'dc50':'أمريكا','dc51':'عالمي وخليجي','dc52':'طعام ومطاعم',
    'sd1':'انضم كشريك','sd2':'تصفح الكتالوج','sd3':'تسجيل الدخول',
  },
  en:{
    'topbar-txt':'🎉 Extra 2% off with Crypto — code: CRYPTO2 &nbsp;|&nbsp; Instant Delivery ⚡',
    'logo-sub':'Bridge Cards','lang-lbl':'عربي',
    'nc0t':'Gift Cards','nc1t':'Gaming Credits','nc2t':'Prepaid Cards',
    'nc3t':'Crypto','nc4t':'Fashion','nc5t':'Supermarkets','nc6t':'Wholesale',
    'hb':'🤝 Global Wholesale Partner Program',
    'hh':'Buy Gift Cards<br><em>at Wholesale Prices</em>',
    'hp':'Join thousands of distributors worldwide. Instant delivery, up to 15% discount.',
    'hbtn1':'Become a Partner Now','hbtn2':'Browse Catalog',
    'sl1':'Active Partners','sl2':'Digital Products','sl3':'Max Discount','sl4':'Instant Delivery',
    'st1':'Products <em>Catalog</em>','st2':'Select category and denomination',
    'tbl-all':'All','tbl-game':'Gaming','tbl-gift':'Gift Cards','tbl-pre':'Prepaid',
    'tbl-crypto':'Crypto','tbl-fash':'Fashion','tbl-ret':'Retail',
    'tbl-home':'Home','tbl-elec':'Electronics','tbl-food':'Food',
    'bent':'Why <em>BridgeCards?</em>',
    'b1t':'Tiered Discounts','b1d':'The more you buy, the higher your discount up to 15%.',
    'b2t':'100% Instant Delivery','b2d':'All codes delivered within seconds.',
    'b3t':'Developer API','b3d':'Full REST API for automation.',
    'b4t':'Refund Guarantee','b4d':'Faulty code? Instant replacement.',
    'b5t':'Global Coverage','b5d':'Products for USA, Europe, Asia & Middle East.',
    'b6t':'Crypto Payments','b6d':'USDT, BTC, ETH with extra 2% off.',
    'tt':'Partnership <em>Tiers</em>',
    'tv1':'from $500 / month','tl1':'$500/month','tl2':'Email support','tl3':'Instant delivery','tl4':'250+ products','tb1':'Start Now',
    'tpop':'Most Popular ⭐','tv2':'from $2,000 / month','tg1':'$2000/month','tg2':'VIP 24/7','tg3':'Full API','tg4':'Exclusive pricing','tb2':'Start Now',
    'tv3':'from $10,000 / month','tp1':'$10,000/month','tp2':'Dedicated manager','tp3':'Custom integration','tp4':'Exclusive deals','tb3':'Contact Us',
    'howt':'How <em>It Works</em>',
    's1t':'Register Account','s1d':'Create your free account.','s2t':'Instant Activation','s2d':'Activated automatically.',
    's3t':'Buy at Great Prices','s3d':'Add to cart and pay.','s4t':'Receive Instantly','s4d':'Codes in seconds.',
    'cht':'Join the Program<br><span style="color:var(--accent)">Today</span>',
    'chp':'Send a join request and our team will contact you.','cp1':'Response within 24h','cp2':'80+ countries',
    'fl1':'Full Name','fl2':'Email','fl3':'Company','fl4':'Country','fl5':'Monthly Volume','fl6':'Message',
    'fsub':'Send Enrollment Request →','btn-login':'Sign In','btn-reg':'Create Account',
    'f-sub':'Bridge Cards','f-copy':'© 2026 BridgeCards · <a href="mailto:support@bridgecards.org" style="color:var(--accent3);text-decoration:none;">support@bridgecards.org</a> · <a href="https://t.me/bridgecards" style="color:var(--accent3);text-decoration:none;">Telegram</a>',
    'fl-a':'Gift Cards','fl-b':'Prepaid Cards','fl-c':'Gaming','fl-d':'Wholesale','fl-e':'Privacy','fl-f':'Terms',
    'cart-title':'🛒 Shopping Cart','ct1':'Items','ct2':'Discount','ct3':'Total',
    'ck-title':'Checkout','cks1l':'Summary','cks2l':'Payment','cks3l':'Details','cks4l':'Confirm',
    'ck-s1':'Order Summary','ck-s2':'Select Payment Method',
    'ck-n1':'Next →','ck-b2':'← Back','ck-n2':'Next →','ck-b3':'← Back','ck-n3':'Confirm & Pay →',
    'suc-t':'Payment Successful!','suc-p':'Your codes are ready — click to copy',
    'auth-t':'Account','at1':'Sign In','at2':'Create Account',
    'll1':'Email Address','ll2':'Password','l-sub':'Sign In',
    'or1':'or','or2':'or',
    'no-acc':'No account? <a onclick="switchAuth(\'register\')">Create one</a>',
    'rl1':'First Name','rl2':'Last Name','rl3':'Email Address','rl4':'Password','rl5':'Account Type',
    'rt1':'Regular Customer','rt2':'Wholesale Partner','r-sub':'Create Account',
    'has-acc':'Have an account? <a onclick="switchAuth(\'login\')">Sign In</a>',
    'dd1':'My Orders','dd2':'Profile',
    'dc00':'Shopping & Tech','dc01':'Entertainment','dc02':'Apps','dc03':'Home & Furniture',
    'dc10':'Console','dc11':'PC','dc12':'Mobile','dc13':'Battle Royale',
    'dc20':'International Cards','dc21':'Digital Wallets','dc22':'PIN Cards',
    'dc30':'Exchanges','dc31':'Coins','dc32':'Stablecoins','dc33':'More Platforms',
    'dc40':'International','dc41':'UK/Online','dc42':'Turkish 1','dc43':'Turkish Luxury',
    'dc50':'USA','dc51':'Global & Gulf','dc52':'Food & Dining',
    'sd1':'Join as Partner','sd2':'Browse Catalog','sd3':'Sign In',
  }
};

function toggleLang(){
  lang=lang==='ar'?'en':'ar';
  const html=document.getElementById('htmlRoot');
  html.lang=lang;html.dir=lang==='ar'?'rtl':'ltr';
  const t=T[lang];
  Object.keys(t).forEach(id=>{
    try{
      const el=document.getElementById(id);if(!el||!t[id])return;
      if(el.tagName==='INPUT'||el.tagName==='TEXTAREA')el.placeholder=t[id];
      else el.innerHTML=t[id];
    }catch(e){}
  });
  renderProducts();updateCart();buildPmGrid();
}

/* ══════════════════════════════════════════
   NAV DROPDOWNS
══════════════════════════════════════════ */
(function(){
  const timers={};
  function openNav(li){
    clearTimeout(timers[li.dataset.ni]);
    document.querySelectorAll('.nav-cat.open').forEach(el=>{if(el!==li)el.classList.remove('open');});
    li.classList.add('open');
  }
  function closeNav(li){timers[li.dataset.ni]=setTimeout(()=>li.classList.remove('open'),150);}
  document.querySelectorAll('.nav-cat').forEach(li=>{
    li.addEventListener('mouseenter',()=>openNav(li));
    li.addEventListener('mouseleave',()=>closeNav(li));
    const drop=li.querySelector('.drop,.sdrop');
    if(drop){
      drop.addEventListener('mouseenter',()=>clearTimeout(timers[li.dataset.ni]));
      drop.addEventListener('mouseleave',()=>closeNav(li));
    }
    const a=li.querySelector(':scope>a');
    if(a)a.addEventListener('click',e=>{
      if(li.querySelector('.drop,.sdrop')){e.preventDefault();li.classList.contains('open')?li.classList.remove('open'):openNav(li);}
    });
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.nav-cat'))document.querySelectorAll('.nav-cat.open').forEach(el=>el.classList.remove('open'));});
  const nu=document.getElementById('navUser');
  if(nu){
    let ut=null;
    nu.addEventListener('mouseenter',()=>{clearTimeout(ut);nu.classList.add('open');});
    nu.addEventListener('mouseleave',()=>{ut=setTimeout(()=>nu.classList.remove('open'),150);});
    nu.addEventListener('click',e=>{e.stopPropagation();nu.classList.toggle('open');});
  }
})();

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function openM(id){const el=g(id);if(el)el.classList.add('open');}
function closeM(id){const el=g(id);if(el)el.classList.remove('open');}
function toast(msg){const t=g('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}

document.getElementById('ckModal').addEventListener('click',function(e){if(e.target===this)closeM('ckModal');});
document.getElementById('authModal').addEventListener('click',function(e){if(e.target===this)closeM('authModal');});
document.getElementById('currSel').addEventListener('change',function(){cur=this.value;renderProducts();updateCart();buildCkSummary();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM('ckModal');closeM('authModal');closeCart();document.querySelectorAll('.nav-cat.open').for
Each(el=>el.classList.remove('open'));
  }
});


/* ═══════════════════════════════════════════════════════════
   PHASE 1 UPGRADES — Search · Sort · Availability · PM Control
   All code uses ES5-compatible strings (no nested templates)
   ═══════════════════════════════════════════════════════════ */

/* ── PAYMENT METHOD STATUS (admin-configurable) ─── */
var PM_ACTIVE = {
  'visa-card':true, 'paypal':true,  'crypto':true,
  'vipps':true,     'swish':true,   'klarna':false,
  'bank':true,      'sadad':true,   'stcpay':true,
  'fawry':true,     'cmi':true,     'papara':false,
  'apple-pay':true, 'gpay':true
};
var PM_SOON_LABEL = { ar: 'قريباً', en: 'Soon' };

/* ── AVAILABILITY STORE ─── */
var AVAIL = {};   // { productId: 'in'|'low'|'out' }

function getAvail(id) { return AVAIL[id] || 'in'; }

function availLabel(status, ln) {
  var L = {
    'in':  { ar:'متوفر',        en:'In Stock'    },
    'low': { ar:'كمية محدودة', en:'Limited'      },
    'out': { ar:'نفد',          en:'Out of Stock' }
  };
  return (L[status] || L['in'])[ln];
}

function availClass(status) {
  return status==='in' ? 'av-in' : status==='low' ? 'av-low' : 'av-out';
}

/* ── SEARCH STATE ─── */
var searchQ    = '';
var sortMode   = 'default';
var _srchTimer = null;

function handleSearch() {
  var v = document.getElementById('searchInput').value || '';
  searchQ = v.trim();
  var clr = document.getElementById('searchClear');
  if (clr) { if (searchQ) clr.classList.add('vis'); else clr.classList.remove('vis'); }
  clearTimeout(_srchTimer);
  _srchTimer = setTimeout(renderProducts, 260);
}

function clearSearch() {
  var inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  searchQ = '';
  var clr = document.getElementById('searchClear');
  if (clr) clr.classList.remove('vis');
  var stats = document.getElementById('searchStats');
  if (stats) stats.innerHTML = '';
  renderProducts();
  if (inp) inp.focus();
}

function setSort(mode, btn) {
  sortMode = mode;
  document.querySelectorAll('.sort-btn').forEach(function(b){ b.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  renderProducts();
}

/* ── SEARCH MATCHING ─── */
function normAr(s) {
  return (s||'').toLowerCase()
    .replace(/[\u0623\u0625\u0622\u0627]/g,'\u0627')
    .replace(/[\u0629\u0647]/g,'\u0647')
    .replace(/[\u064a\u0649]/g,'\u064a');
}

function matchSearch(p, q) {
  if (!q) return true;
  var nq = normAr(q);
  var fields = [p.name&&p.name.ar, p.name&&p.name.en,
                p.reg&&p.reg.ar,   p.reg&&p.reg.en,
                p.cat, p.id];
  for (var i=0; i<fields.length; i++) {
    if (normAr(fields[i]||'').indexOf(nq) >= 0) return true;
  }
  return false;
}

/* ── STAR RATING BUILDER ─── */
function buildStars(rating, reviews) {
  var full=Math.floor(rating), half=(rating-full)>=0.5, empty=5-full-(half?1:0), h='';
  for(var i=0;i<full;i++)  h+='<span style="color:#ffbe00;font-size:10px;">★</span>';
  if(half)                 h+='<span style="color:#c89600;font-size:10px;">★</span>';
  for(var i=0;i<empty;i++) h+='<span style="color:#3a3c5a;font-size:10px;">★</span>';
  if(reviews) h+='<span style="font-size:10px;color:var(--sub);margin-inline-start:3px;">('+reviews+')</span>';
  return h;
}

/* ── RENDER PRODUCTS (full override) ─── */
function renderProducts() {
  var grid = document.getElementById('pgrid');
  if (!grid) return;

  var CAR = {game:'ألعاب',gift:'هدية',prepaid:'بطاقة',crypto:'كريبتو',fashion:'أزياء',retail:'تسوق',home:'منزل',electronics:'تقنية',food:'طعام'};
  var CAE = {game:'Gaming',gift:'Gift',prepaid:'Prepaid',crypto:'Crypto',fashion:'Fashion',retail:'Retail',home:'Home',electronics:'Tech',food:'Food'};

  /* 1. category filter */
  var list = (filter === 'all') ? P.slice() : P.filter(function(p){ return p.cat === filter; });

  /* 2. search filter */
  if (searchQ) list = list.filter(function(p){ return matchSearch(p, searchQ); });

  /* 3. sort */
  if (sortMode === 'price-asc') {
    list.sort(function(a,b){
      return a.d[selD[a.id]||0].p - b.d[selD[b.id]||0].p;
    });
  } else if (sortMode === 'price-desc') {
    list.sort(function(a,b){
      return b.d[selD[b.id]||0].p - a.d[selD[a.id]||0].p;
    });
  } else if (sortMode === 'discount') {
    list.sort(function(a,b){
      var da=selD[a.id]||0, db=selD[b.id]||0;
      return (1-b.d[db].p/b.d[db].o) - (1-a.d[da].p/a.d[da].o);
    });
  }

  /* 4. stats */
  var stats = document.getElementById('searchStats');
  if (stats) {
    if (searchQ) {
      stats.innerHTML = list.length
        ? (lang==='ar' ? '\u0648\u062c\u062f\u0646\u0627 <em>'+list.length+'</em> \u0646\u062a\u064a\u062c\u0629'
                       : 'Found <em>'+list.length+'</em> results')
        : '';
    } else {
      stats.innerHTML = (filter !== 'all')
        ? '<em>'+list.length+'</em> '+(lang==='ar'?'\u0645\u0646\u062a\u062c':'products')
        : '';
    }
  }

  /* 5. no results */
  if (!list.length) {
    var msg = searchQ
      ? (lang==='ar' ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c \u0644\u0640 &ldquo;'+searchQ+'&rdquo;'
                     : 'No results for &ldquo;'+searchQ+'&rdquo;')
      : (lang==='ar' ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0641\u0626\u0629'
                     : 'No products in this category');
    var clrBtn = searchQ
      ? '<br><button class="no-res-btn" onclick="clearSearch()">'
          +(lang==='ar'?'\u0645\u0633\u062d \u0627\u0644\u0628\u062d\u062b':'Clear Search')+'</button>'
      : '';
    grid.innerHTML = '<div class="no-results">'
      +'<div class="no-results-icon">\uD83D\uDD0D</div>'
      +'<h3>'+(lang==='ar'?'\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c':'No Results Found')+'</h3>'
      +'<p>'+msg+'</p>'+clrBtn+'</div>';
    return;
  }

  /* 6. render cards */
  var html = '';
  for (var i=0; i<list.length; i++) {
    var p   = list[i];
    var di  = selD[p.id] || 0;
    var d   = p.d[di];
    var pct = Math.max(1, Math.round((1-d.p/d.o)*100));
    var av  = getAvail(p.id);
    var out = av === 'out';
    var chip= lang==='ar' ? (CAR[p.cat]||p.cat) : (CAE[p.cat]||p.cat);
    var logo= getLogo(p.id);
    var nm  = p.name[lang];

    /* search highlight — safe manual escape */
    if (searchQ) {
      try {
        var esc=''; for(var ci=0;ci<searchQ.length;ci++){var ch=searchQ[ci];if('\\-[]{}()*+?.,^$|#'.indexOf(ch)>=0)esc+='\\';esc+=ch;}
        nm = nm.replace(new RegExp('('+esc+')','gi'),
          '<mark style="background:rgba(61,107,255,.25);color:var(--text);border-radius:2px;padding:0 1px;">$1</mark>');
      } catch(e2){}
    }

    var dens='';
    for(var j=0;j<p.d.length;j++){
      dens+='<button class="den'+(j===di?' on':'')+'" onclick="selDenom(\''+p.id+'\','+j+',event)">'+p.d[j].l+'</button>';
    }

    var addCls = 'add-btn'+(out?' sold':'');
    var addLbl = out ? (lang==='ar'?'\u0646\u0641\u062f':'Sold Out') : (lang==='ar'?'\u0623\u0636\u0641 +':'Add +');
    var addEvt = out ? '' : 'event.stopPropagation();addCart(\''+p.id+'\',event)';

    html += '<div class="pc" onclick="openPD(\''+p.id+'\')">'
      +'<div class="pc-head" style="background:'+p.bg+'">'
        +'<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.10),transparent 55%);pointer-events:none;"></div>'
        +'<img class="pc-logo" src="'+logo+'" alt="'+p.name[lang]+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
        +'<div class="pc-fallback">'+p.name[lang]+'</div>'
        +'<div class="pc-badge">-'+pct+'%</div>'
        +'<div class="pc-chip">'+chip+'</div>'
        +'<div class="av-badge '+availClass(av)+'">'+availLabel(av,lang)+'</div>'
      +'</div>'
      +'<div class="pc-body">'
        +'<div class="pc-name">'+nm+'</div>'
        +'<div class="pc-reg">'+p.reg[lang]+'</div>'
        +(p.rating ? '<div class="pc-stars">'+buildStars(p.rating,p.reviews)+'</div>' : '')
        +'<div style="font-size:10px;font-weight:700;color:var(--accent3);margin-bottom:6px;">⚡ '+(lang==='ar'?'تسليم فوري':'Instant Delivery')+'</div>'
        +'<div class="denoms">'+dens+'</div>'
        +'<div class="pc-pr-row">'
          +'<div>'
            +'<div class="pc-old">'+fmt(d.o)+'</div>'
            +'<div class="pc-price">'+fmt(d.p)+'</div>'
            +'<div class="pc-disc">-'+pct+'% OFF</div>'
          +'</div>'
          +'<button class="'+addCls+'" '+(out?'disabled':'')+' onclick="'+addEvt+'">'+addLbl+'</button>'
        +'</div>'
      +'</div>'
    +'</div>';
  }
  grid.innerHTML = html;
}

/* ── PRODUCT DETAIL MODAL ─── */
function openPD(id) {
  var p = null;
  for(var i=0;i<P.length;i++){if(P[i].id===id){p=P[i];break;}}
  if (!p) return;
  var di = selD[id]||0;
  var av = getAvail(id);
  var out= av==='out';

  var catAR={game:'ألعاب',gift:'بطاقات هدايا',prepaid:'مسبقة الدفع',crypto:'كريبتو',fashion:'أزياء',retail:'تسوق',home:'منزل',electronics:'إلكترونيات',food:'طعام'};
  var catEN={game:'Gaming',gift:'Gift Cards',prepaid:'Prepaid',crypto:'Crypto',fashion:'Fashion',retail:'Retail',home:'Home',electronics:'Electronics',food:'Food'};
  var catLbl=(lang==='ar'?catAR:catEN)[p.cat]||p.cat;

  /* denomination buttons */
  var dens='';
  for(var j=0;j<p.d.length;j++){
    var dd=p.d[j];
    var sv=dd.o>dd.p?Math.round((1-dd.p/dd.o)*100):0;
    dens+='<div class="pd-den'+(j===di?' on':'')+'" onclick="pdDen(\''+id+'\','+j+')">'
      +'<span class="pd-den-l">'+dd.l+'</span>'
      +'<span class="pd-den-p">'+fmt(dd.p)+'</span>'
      +(sv>0?'<span class="pd-den-s">-'+sv+'%</span>':'')
    +'</div>';
  }

  var lblCat   = lang==='ar'?'الفئة':'Category';
  var lblReg   = lang==='ar'?'المنطقة':'Region';
  var lblAvl   = lang==='ar'?'التوفر':'Availability';
  var lblDen   = lang==='ar'?'اختر القيمة':'Select Denomination';
  var lblFace  = lang==='ar'?'القيمة الاسمية':'Face Value';
  var lblSell  = lang==='ar'?'سعر البيع':'Your Price';
  var lblBtn   = out?(lang==='ar'?'المنتج نفد':'Out of Stock'):(lang==='ar'?'🛒 أضف للسلة':'🛒 Add to Cart');
  var avCls    = availClass(av);
  var avLbl    = availLabel(av,lang);

  var nameEl = document.getElementById('pd-name');
  if(nameEl) nameEl.textContent = p.name[lang];

  var body = document.getElementById('pd-body');
  if(!body) return;

  body.innerHTML =
    '<div class="pd-head" style="background:'+p.bg+'">'
      +'<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.08),transparent);"></div>'
      +'<img class="pd-logo" src="'+getLogo(id)+'" alt="'+p.name[lang]+'" onerror="this.style.display=\'none\'">'
    +'</div>'
    +'<div class="pd-grid">'
      +'<div class="pd-info-box"><div class="pd-info-lbl">'+lblCat+'</div><div class="pd-info-val">'+catLbl+'</div></div>'
      +'<div class="pd-info-box"><div class="pd-info-lbl">'+lblReg+'</div><div class="pd-info-val" style="font-size:11px;">'+p.reg[lang]+'</div></div>'
      +'<div class="pd-info-box"><div class="pd-info-lbl">'+lblAvl+'</div>'
        +'<div class="av-badge '+avCls+'" style="position:static;display:inline-block;margin-top:3px;">'+avLbl+'</div></div>'
    +'</div>'
    +'<div style="font-size:11px;font-weight:800;color:var(--sub);text-transform:uppercase;letter-spacing:.8px;margin-bottom:9px;">'+lblDen+'</div>'
    +'<div class="pd-dens" id="pd-dens">'+dens+'</div>'
    +'<div class="pd-price-box">'
      +'<div class="pd-row"><span style="color:var(--sub);">'+lblFace+'</span><span style="text-decoration:line-through;color:var(--sub);">'+fmt(p.d[di].o)+'</span></div>'
      +'<div class="pd-row big"><span style="color:var(--sub);">'+lblSell+'</span><span style="color:var(--accent3);" id="pd-cur-price">'+fmt(p.d[di].p)+'</span></div>'
    +'</div>'
    +'<button class="btn-next" style="width:100%;padding:13px;" '
      +(out?'disabled style="opacity:.4;cursor:not-allowed;"':'onclick="addCart(\''+id+'\');closeM(\'pdModal\')"')
    +'>'+lblBtn+'</button>';

  openM('pdModal');
}

function pdDen(id, i) {
  selD[id]=i;
  var p=null; for(var j=0;j<P.length;j++){if(P[j].id===id){p=P[j];break;}}
  if(!p)return;
  document.querySelectorAll('#pd-dens .pd-den').forEach(function(el,idx){el.classList.toggle('on',idx===i);});
  var pr=document.getElementById('pd-cur-price');
  if(pr) pr.textContent=fmt(p.d[i].p);
  renderProducts();
}

/* ── OVERRIDE selDenom to stop propagation ─── */
function selDenom(id,i,e){if(e)e.stopPropagation();selD[id]=i;renderProducts();}

/* ── OVERRIDE buildPmGrid to show active/coming-soon ─── */
function buildPmGrid() {
  var el = document.getElementById('pmGrid');
  if(!el) return;
  var html='';
  for(var i=0;i<PM.length;i++){
    var pm=PM[i];
    var active = PM_ACTIVE[pm.id]!==false;
    var sel    = selPM===pm.id;
    var cls    = 'pmc'+(sel?' sel':'')+(active?'':' csoon');
    var soon   = active ? '' : ' data-soon="'+(PM_SOON_LABEL[lang]||'Soon')+'"';
    var clk    = active ? 'onclick="pickPM(\''+pm.id+'\')"' : '';
    html += '<div class="'+cls+'"'+soon+' '+clk+'>'
      +'<div class="pmc-icon">'+pm.icon+'</div>'
      +'<div class="pmc-name">'+pm.name[lang]+'</div>'
      +'<div class="pmc-sub">'+pm.sub[lang]+'</div>'
      +'<div class="pmc-reg">'+pm.reg[lang]+'</div>'
      +(active ? '' : '<div style="font-size:9px;color:var(--gold);margin-top:3px;font-weight:800;">⏳ '+(PM_SOON_LABEL[lang]||'Soon')+'</div>')
    +'</div>';
  }
  el.innerHTML=html;
}

/* ── OVERRIDE toggleLang to update new elements ─── */
var _baseLang = toggleLang;
function toggleLang() {
  lang = lang==='ar'?'en':'ar';
  var html=document.getElementById('htmlRoot');
  html.lang=lang; html.dir=lang==='ar'?'rtl':'ltr';
  var t=T[lang];
  Object.keys(t).forEach(function(id){
    try{
      var el=document.getElementById(id);if(!el||!t[id])return;
      if(el.tagName==='INPUT'||el.tagName==='TEXTAREA')el.placeholder=t[id];
      else el.innerHTML=t[id];
    }catch(e){}
  });
  /* update search placeholder */
  var si=document.getElementById('searchInput');
  if(si) si.placeholder=lang==='ar'
    ?'\uD83D\uDD0D \u0627\u0628\u062D\u062B \u0639\u0646 \u0628\u0637\u0627\u0642\u0629... (Steam, Amazon, PSN, \u0643\u0631\u064A\u0628\u062A\u0648...)'
    :'\uD83D\uDD0D Search for a card... (Steam, Amazon, PSN, Crypto...)';
  /* update sort buttons */
  var sortMap={'s-def':{ar:'\u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a',en:'Default'},
    's-pa':{ar:'\u0627\u0644\u0623\u0631\u062e\u0635',en:'Cheapest'},
    's-pd':{ar:'\u0627\u0644\u0623\u063a\u0644\u0649',en:'Highest'},
    's-disc':{ar:'\u0623\u0639\u0644\u0649 \u062e\u0635\u0645',en:'Best Deal'},
    'sort-lbl':{ar:'\u062a\u0631\u062a\u064a\u0628:',en:'Sort:'}};
  Object.keys(sortMap).forEach(function(k){var e=document.getElementById(k);if(e)e.textContent=sortMap[k][lang];});
  renderProducts(); updateCart(); buildPmGrid();
}

/* ── SYNC AVAILABILITY FROM API ─── */
var RAILWAY_URL_AV = 'https://bridgecards-api.onrender.com';
function syncAvail(){
  fetch(RAILWAY_URL_AV+'/api/availability')
    .then(function(r){return r.json();})
    .then(function(data){if(data&&typeof data==='object'){Object.assign(AVAIL,data);renderProducts();}})
    .catch(function(){});
}

/* ── DYNAMIC PRICING ENGINE (EUR/GBP aware) ─── */
var SAFE_FX={USD:1,EUR:1.12,GBP:1.32,CAD:0.76,AUD:0.68,NOK:0.097,SEK:0.096,TRY:0.031,AED:0.272,SAR:0.267,KWD:3.27,EGP:0.021};

function syncLivePrices(){
  fetch('https://bridgecards-api.onrender.com/api/products')
    .then(function(r){return r.json();})
    .then(function(data){
      var live=data.content||data;
      if(!live||!live.length)return;
      var map={};live.forEach(function(p){map[p.productId]=p;});
      P.forEach(function(lp){
        if(!lp.reloadlyId||!map[lp.reloadlyId])return;
        var ld=map[lp.reloadlyId];
        if(ld.status!=='ACTIVE')return;
        var disc=ld.discountPercentage||0;
        var cur=ld.fixedRecipientCurrencyCode||ld.recipientCurrencyCode||lp.currency||'USD';
        var rate=(SAFE_FX[cur]||1.15)*(cur!=='USD'?1.03:1);
        lp.d.forEach(function(d){
          var cost=d.o*(1-disc/100)*rate;
          var wp=cost*1.10;
          var sf=wp*0.029+0.30;
          var fp=wp+sf;
          if(fp<cost+0.60)fp=cost+0.60;
          d.p=parseFloat(fp.toFixed(2));
        });
      });
      renderProducts(); updateCart();
    })
    .catch(function(e){console.warn('Live prices unavailable:',e.message);});
}

/* ── ESC for new modals ─── */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    closeM('pdModal');closeM('termsModal');closeM('refundModal');closeM('privacyModal');
  }
},true);

/* ── INIT ─── */
renderProducts();
updateCart();
buildPmGrid();
updateNavUser();
syncLivePrices();
syncAvail();

</script>
</body>
</html>
