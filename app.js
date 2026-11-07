// 1) Создай Firebase project и включи Authentication > Email/Password и Firestore.
// 2) Вставь web app config ниже. Не вставляй сюда service-account/private keys.
// 3) Сотрудникам аккаунты создаёт администратор. Доступ проверяется custom claim supportStaff=true.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFGwp58RAA07iqczEAwuOtChE3eAFDby8",
  authDomain: "liworld.firebaseapp.com",
  projectId: "liworld",
  storageBucket: "liworld.firebasestorage.app",
  messagingSenderId: "339709912399",
  appId: "1:339709912399:web:24ae527e78ce00bd69113a",
  measurementId: "G-G37PF9GGEW"
};
const loginPanel=document.getElementById("loginPanel"), dashboard=document.getElementById("dashboard");
const errorBox=document.getElementById("loginError"), ticketList=document.getElementById("ticketList");
let auth,db,unsubscribe=null,currentFilter="all",allTickets=[];
const configured=!Object.values(firebaseConfig).some(v=>v.includes("PASTE_"));
if(configured){const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);}else{errorBox.textContent="Сайт пока не подключён к Firebase. Сначала настрой проект по README.";document.querySelector("#loginForm button").disabled=true;}

document.getElementById("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!configured)return;errorBox.textContent="";
 try{await signInWithEmailAndPassword(auth,document.getElementById("email").value,document.getElementById("password").value);}
 catch(err){errorBox.textContent="Не удалось войти. Проверь email и пароль.";}
});
onAuthStateChanged(auth||{onAuthStateChanged:()=>{}},async user=>{
 if(!user){showLogin();return;}
 const token=await user.getIdTokenResult(true);
 if(token.claims.supportStaff!==true){await signOut(auth);errorBox.textContent="У этой учётной записи нет доступа сотрудника.";showLogin();return;}
 loginPanel.classList.add("hidden");dashboard.classList.remove("hidden");document.getElementById("who").textContent=user.email||"Сотрудник";
 if(unsubscribe)unsubscribe();
 unsubscribe=onSnapshot(query(collection(db,"tickets"),orderBy("createdAt","desc")),snap=>{
  allTickets=snap.docs.map(d=>({id:d.id,...d.data()}));renderTickets();
 },()=>ticketList.innerHTML='<p class="muted">Не удалось загрузить заявки. Проверь правила Firestore.</p>');
});
function showLogin(){dashboard.classList.add("hidden");loginPanel.classList.remove("hidden");if(unsubscribe){unsubscribe();unsubscribe=null;}}
document.getElementById("logout").addEventListener("click",()=>signOut(auth));
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{currentFilter=b.dataset.filter;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));renderTickets();}));
function renderTickets(){
 const list=allTickets.filter(t=>currentFilter==="all"||(currentFilter==="open"?t.status!=="closed":t.status==="closed"));
 if(!list.length){ticketList.innerHTML='<p class="muted">Заявок пока нет.</p>';return;}
 ticketList.replaceChildren();
 for(const t of list){const el=document.createElement("article");el.className="ticket";
 const title=document.createElement("h3");title.textContent=t.subject||"Обращение";
 const meta=document.createElement("small");meta.textContent=`${t.name||"Без имени"} · ${t.email||"без email"} · ${t.status==="closed"?"Решено":"Открыто"}`;
 const body=document.createElement("p");body.textContent=t.message||"";
 const reply=document.createElement("div");reply.className="reply";
 const input=document.createElement("textarea");input.placeholder="Ответ сотрудника…";
 const send=document.createElement("button");send.className="ghost";send.textContent="Добавить ответ";
 send.addEventListener("click",async()=>{if(!input.value.trim())return;await addDoc(collection(db,"tickets",t.id,"replies"),{message:input.value.trim(),staff:auth.currentUser.email,createdAt:serverTimestamp()});input.value="";});
 const close=document.createElement("button");close.className="ghost";close.textContent=t.status==="closed"?"Открыть":"Закрыть";
 close.addEventListener("click",()=>updateDoc(doc(db,"tickets",t.id),{status:t.status==="closed"?"open":"closed",updatedAt:serverTimestamp()}));
 reply.append(input,send);el.append(title,meta,body,reply,close);ticketList.append(el);
 }
}
