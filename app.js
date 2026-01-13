// ==================== CONFIG ====================
const SPONACULAR_API_KEY = "cdb0c009328f4bb5becc1b6fdbbe01a7";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDv2rJfzXxJdmuxbhtN0mAQr8F-RAoc68E",
  authDomain: "recipe-ai-pro.firebaseapp.com",
  projectId: "recipe-ai-pro",
  storageBucket: "recipe-ai-pro.firebasestorage.app",
  messagingSenderId: "455001844076",
  appId: "1:455001844076:web:15e70fd2bff85106802b49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ==================== INIT ====================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== HELPERS ====================
const $ = id => document.getElementById(id);

// ==================== AUTH ====================
auth.onAuthStateChanged(user => {
  $("loginModal").classList.toggle("hidden", !!user);
  $("app").classList.toggle("hidden", !user);
  $("adminPanel").classList.add("hidden");
  if (user) checkAdmin(user);
});

function login() {
  auth.signInWithEmailAndPassword(
    $("email").value.trim(),
    $("password").value
  ).catch(e => $("authError").textContent = e.message);
}

// ==================== ADMIN ====================
function checkAdmin(user) {
  db.collection("admins").doc(user.uid).get().then(doc => {
    if (doc.exists) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<button onclick="openAdmin()"
          class="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-black text-white shadow-sm">
          ⚙️
        </button>`
      );
    }
  });
}

function openAdmin() {
  $("app").classList.add("hidden");
  $("adminPanel").classList.remove("hidden");
  loadPending();
}

// ==================== SPOONACULAR ====================
$("ingredients").addEventListener("keydown", e => {
  if (e.key === "Enter") findRecipes();
});

async function findRecipes() {
  const q = $("ingredients").value.trim();
  if (!q) return;

  $("results").innerHTML = `
    <div class="col-span-2 h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
  `;

  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(
        q
      )}&number=8&apiKey=${SPONACULAR_API_KEY}`
    );

    const data = await res.json();

    $("results").innerHTML = data.map(r => `
      <div class="bg-white rounded-2xl overflow-hidden shadow-sm">
        <img src="${r.image}" class="w-full h-40 object-cover" />
      </div>
    `).join("");
  } catch {
    $("results").innerHTML = "";
  }
}

// ==================== ADMIN QUEUE ====================
function loadPending() {
  db.collection("pendingRecipes")
    .where("status", "==", "pending")
    .get()
    .then(snap => {
      $("pendingRecipes").innerHTML = snap.docs.map(d => `
        <div class="bg-white p-4 rounded-2xl shadow-sm">
          <p class="text-sm mb-3">${d.data().name}</p>
          <div class="flex gap-2">
            <button onclick="approve('${d.id}')" class="flex-1 bg-black text-white py-2 rounded-xl">Approve</button>
            <button onclick="reject('${d.id}')" class="flex-1 border py-2 rounded-xl">Reject</button>
          </div>
        </div>
      `).join("");
    });
}

function approve(id) {
  db.collection("pendingRecipes").doc(id).update({ status: "approved" })
    .then(loadPending);
}

function reject(id) {
  db.collection("pendingRecipes").doc(id).delete()
    .then(loadPending);
}
