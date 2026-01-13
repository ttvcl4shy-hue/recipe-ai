// ==================== CONFIG ====================
const SPONACULAR_API_KEY = "cdb0c009328f4bb5becc1b6fdbbe01a7";

const firebaseConfig = {
  apiKey: "AIzaSyDv2rJfzXxJdmuxbhtN0mAQr8F-RAoc68E",
  authDomain: "recipe-ai-pro.firebaseapp.com",
  projectId: "recipe-ai-pro",
  storageBucket: "recipe-ai-pro.appspot.com",
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
        document.getElementById("loginModal").classList.add("hidden");
        document.getElementById("app").classList.remove("hidden");
        checkAdmin(user);
    } else {
        document.getElementById("loginModal").classList.remove("hidden");
        document.getElementById("app").classList.add("hidden");
        document.getElementById("adminPanel").classList.add("hidden");
    }
});

// ==================== AUTH ====================
function signup() {
    const email = emailInput();
    const pass = passwordInput();
    auth.createUserWithEmailAndPassword(email, pass)
        .catch(err => showAuthError(err.message));
}

function login() {
    const email = emailInput();
    const pass = passwordInput();
    auth.signInWithEmailAndPassword(email, pass)
        .catch(err => showAuthError(err.message));
}

function logout() {
    auth.signOut();
}

function emailInput() {
    return document.getElementById("email").value;
}

function passwordInput() {
    return document.getElementById("password").value;
}

function showAuthError(msg) {
    document.getElementById("authError").textContent = msg;
}

// ==================== ADMIN ====================
function checkAdmin(user) {
    db.collection("admins").doc(user.uid).get().then(doc => {
        if (doc.exists) {
            document.getElementById("app").insertAdjacentHTML("beforeend",
                '<button onclick="showAdmin()" class="fixed bottom-4 right-4 bg-red-700 text-white p-4 rounded-full">🔧</button>'
            );
        }
    });
}

function showAdmin() {
    document.getElementById("app").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    loadPendingRecipes();
}

// ==================== RECIPES ====================
async function findRecipes() {
    const ingredients = document.getElementById("ingredients").value.trim();
    const resultsDiv = document.getElementById("results");
    if (!ingredients) return;

    resultsDiv.textContent = "Searching...";

    const res = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=6&apiKey=${SPONACULAR_API_KEY}`
    );

    const recipes = await res.json();
    resultsDiv.innerHTML = recipes.map(r => `
        <div class="bg-white p-4 rounded shadow mb-3">
            <img src="${r.image}" class="w-full h-40 object-cover rounded">
            <h3 class="font-bold mt-2">${r.title}</h3>
        </div>
    `).join("");
}

// ==================== ADMIN QUEUE ====================
function loadPendingRecipes() {
    db.collection("pendingRecipes").where("status", "==", "pending").get()
        .then(snapshot => {
            const list = document.getElementById("pendingRecipes");
            list.innerHTML = snapshot.docs.map(doc => `
                <div class="border-b mb-4 pb-4">
                    <h4 class="font-bold">${doc.data().name}</h4>
                    <p>${doc.data().description}</p>
                    <button onclick="approveRecipe('${doc.id}')">Approve</button>
                    <button onclick="rejectRecipe('${doc.id}')">Reject</button>
                </div>
            `).join("");
        });
}

function approveRecipe(id) {
    db.collection("pendingRecipes").doc(id).update({ status: "approved" })
        .then(loadPendingRecipes);
}

function rejectRecipe(id) {
    db.collection("pendingRecipes").doc(id).delete()
        .then(loadPendingRecipes);
}
