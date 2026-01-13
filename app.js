// ==================== CONFIGURATION ====================
const SPONACULAR_API_KEY = "cdb0c009328f4bb5becc1b6fdbbe01a7";

const firebaseConfig = {
  apiKey: "AIzaSyDv2rJfzXxJdmuxbhtN0mAQr8F-RAoc68E",
  authDomain: "recipe-ai-pro.firebaseapp.com",
  projectId: "recipe-ai-pro",
  storageBucket: "recipe-ai-pro.firebasestorage.app",
  messagingSenderId: "455001844076",
  appId: "1:455001844076:web:15e70fd2bff85106802b49"
};

// ==================== FIREBASE INIT ====================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== AUTH STATE ====================
auth.onAuthStateChanged(user => {
  if (user) {
    hide("loginModal");
    show("app");
    checkAdmin(user);
  } else {
    show("loginModal");
    hide("app");
    hide("adminPanel");
  }
});

function show(id) {
  document.getElementById(id).classList.remove("hidden");
}

function hide(id) {
  document.getElementById(id).classList.add("hidden");
}

// ==================== AUTH ====================
function signup() {
  auth.createUserWithEmailAndPassword(val("email"), val("password"))
    .catch(e => setAuthError(e.message));
}

function login() {
  auth.signInWithEmailAndPassword(val("email"), val("password"))
    .catch(e => setAuthError(e.message));
}

function logout() {
  auth.signOut();
}

function val(id) {
  return document.getElementById(id).value.trim();
}

function setAuthError(msg) {
  document.getElementById("authError").textContent = msg;
}

// ==================== ADMIN ====================
function checkAdmin(user) {
  db.collection("admins").doc(user.uid).get().then(doc => {
    if (doc.exists) {
      document.getElementById("app").insertAdjacentHTML(
        "beforeend",
        `<button onclick="showAdmin()"
          class="fixed bottom-4 right-4 bg-black text-white px-4 py-3 rounded-full shadow">
          Admin
        </button>`
      );
    }
  });
}

function showAdmin() {
  hide("app");
  show("adminPanel");
  loadPendingRecipes();
}

// ==================== SPOONACULAR ====================
async function findRecipes() {
  const ingredients = val("ingredients");
  if (!ingredients) return;

  const results = document.getElementById("results");
  results.innerHTML = "Loading…";

  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(
        ingredients
      )}&number=6&apiKey=${SPONACULAR_API_KEY}`
    );

    const recipes = await res.json();

    results.innerHTML = recipes.map(r => `
      <div class="bg-white rounded-2xl overflow-hidden shadow-sm">
        <img src="${r.image}" class="w-full h-44 object-cover">
        <div class="p-4">
          <h3 class="font-semibold">${r.title}</h3>
        </div>
      </div>
    `).join("");
  } catch (err) {
    results.innerHTML = "Error loading recipes";
  }
}

// ==================== FAVORITES ====================
function toggleFavorite(title, image) {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("favorites").add({
    userId: user.uid,
    title,
    image,
    createdAt: Date.now()
  });
}

function showFavorites() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("favorites")
    .where("userId", "==", user.uid)
    .get()
    .then(snap => {
      document.getElementById("results").innerHTML =
        snap.docs.map(d => `
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <img src="${d.data().image}" class="rounded-lg mb-2">
            <p class="font-medium">${d.data().title}</p>
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
      document.getElementById("pendingRecipes").innerHTML =
        snap.docs.map(d => `
          <div class="bg-white p-4 rounded-xl shadow-sm">
            <h4 class="font-semibold">${d.data().name}</h4>
            <p class="text-sm text-gray-500 mb-3">${d.data().description}</p>
            <div class="flex gap-2">
              <button onclick="approveRecipe('${d.id}')"
                class="flex-1 bg-emerald-500 text-white py-2 rounded-lg">
                Approve
              </button>
              <button onclick="rejectRecipe('${d.id}')"
                class="flex-1 bg-red-500 text-white py-2 rounded-lg">
                Reject
              </button>
            </div>
          </div>
        `).join("");
    });
}

function approveRecipe(id) {
  db.collection("pendingRecipes").doc(id)
    .update({ status: "approved" })
    .then(loadPendingRecipes);
}

function rejectRecipe(id) {
  db.collection("pendingRecipes").doc(id)
    .delete()
    .then(loadPendingRecipes);
}
