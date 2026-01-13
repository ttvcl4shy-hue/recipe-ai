// ==================== CONFIG ====================
const SPONACULAR_API_KEY = "cdb0c009328f4bb5becc1b6fdbbe01a7";

const firebaseConfig = {
  apiKey: "AIzaSyDv2rJfzXxJdmuxbhtN0mAQr8F-RAoc68E",
  authDomain: "recipe-ai-pro.firebaseapp.com",
  projectId: "recipe-ai-pro",
  storageBucket: "recipe-ai-pro.firebasestorage.app",
  messagingSenderId: "455001844076",
  appId: "1:455001844076:web:15e70fd2bff85106802b49"
};

// ==================== INIT ====================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== HELPERS ====================
const $ = id => document.getElementById(id);
const clean = str => str.replace(/[<>]/g, "");

// ==================== AUTH STATE ====================
auth.onAuthStateChanged(user => {
  toggle("loginModal", !user);
  toggle("app", !!user);
  toggle("adminPanel", false);
  if (user) checkAdmin(user);
});

function toggle(id, show) {
  $(id).classList.toggle("hidden", !show);
}

// ==================== AUTH ====================
function login() {
  auth.signInWithEmailAndPassword(
    $("email").value.trim(),
    $("password").value
  ).catch(e => $("authError").textContent = e.message);
}

function logout() {
  auth.signOut();
}

// ==================== ADMIN ====================
function checkAdmin(user) {
  db.collection("admins").doc(user.uid).get().then(doc => {
    if (doc.exists && !document.getElementById("adminBtn")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<button id="adminBtn"
          onclick="openAdmin()"
          class="fixed bottom-20 right-4 bg-black text-white px-4 py-3 rounded-full shadow">
          Admin
        </button>`
      );
    }
  });
}

function openAdmin() {
  toggle("app", false);
  toggle("adminPanel", true);
  loadPendingRecipes();
}

// ==================== SPOONACULAR ====================
async function findRecipes() {
  const q = $("ingredients").value.trim();
  if (!q) return;

  $("results").textContent = "Loading…";

  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(q)}&number=6&apiKey=${SPONACULAR_API_KEY}`
    );

    const data = await res.json();

    $("results").innerHTML = data.map(r => `
      <div class="bg-white rounded-2xl overflow-hidden shadow-sm">
        <img src="${r.image}" class="w-full h-44 object-cover">
        <div class="p-4">
          <p class="font-medium">${clean(r.title)}</p>
        </div>
      </div>
    `).join("");
  } catch {
    $("results").textContent = "Failed to load recipes.";
  }
}

// ==================== FAVORITES ====================
function showFavorites() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("favorites")
    .where("userId", "==", user.uid)
    .get()
    .then(snap => {
      $("results").innerHTML = snap.docs.map(d => `
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <img src="${d.data().image}" class="rounded-lg mb-2">
          <p class="font-medium">${clean(d.data().title)}</p>
        </div>
      `).join("");
    });
}

// ==================== ADMIN QUEUE ====================
function loadPendingRecipes() {
  db.collection("pendingRecipes")
    .where("status", "==", "pending")
    .get()
    .then(snap => {
      $("pendingRecipes").innerHTML = snap.docs.map(d => `
        <div class="bg-white p-4 rounded-xl shadow-sm">
          <h4 class="font-semibold">${clean(d.data().name)}</h4>
          <p class="text-sm text-gray-500 mb-3">${clean(d.data().description)}</p>
          <div class="flex gap-2">
            <button onclick="approve('${d.id}')" class="flex-1 bg-emerald-500 text-white py-2 rounded-lg">Approve</button>
            <button onclick="reject('${d.id}')" class="flex-1 bg-red-500 text-white py-2 rounded-lg">Reject</button>
          </div>
        </div>
      `).join("");
    });
}

function approve(id) {
  db.collection("pendingRecipes").doc(id).update({ status: "approved" })
    .then(loadPendingRecipes);
}

function reject(id) {
  db.collection("pendingRecipes").doc(id).delete()
    .then(loadPendingRecipes);
}
