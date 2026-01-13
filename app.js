// ==================== CONFIGURATION ====================
// **GET THESE KEYS FIRST** (instructions below)
const SPONACULAR_API_KEY = 'cdb0c009328f4bb5becc1b6fdbbe01a7';
const firebaseConfig = {
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
};

// ==================== INITIALIZE ====================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== AUTH STATE ====================
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        checkAdmin(user);
    } else {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    }
});

// ==================== AUTH FUNCTIONS ====================
function signup() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, pass)
        .catch(err => document.getElementById('authError').textContent = err.message);
}

function login() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, pass)
        .catch(err => document.getElementById('authError').textContent = err.message);
}

function logout() {
    auth.signOut();
}

// ==================== ADMIN CHECK ====================
function checkAdmin(user) {
    db.collection('admins').doc(user.uid).get().then(doc => {
        if (doc.exists) {
            document.getElementById('app').innerHTML += `
                <button onclick="showAdmin()" class="fixed bottom-4 right-4 bg-red-700 text-white p-4 rounded-full shadow-lg z-40">
                    🔧
                </button>`;
        }
    });
}

function showAdmin() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    loadPendingRecipes();
}

// ==================== RECIPE SEARCH ====================
async function findRecipes() {
    const ingredients = document.getElementById('ingredients').value.trim();
    const resultsDiv = document.getElementById('results');
    if (!ingredients) return;

    resultsDiv.innerHTML = '<div class="text-center p-8 text-gray-500">🔍 Searching...</div>';

    try {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=6&apiKey=${SPONACULAR_API_KEY}`
        );
        const recipes = await response.json();
        
        if (recipes.length === 0) {
            resultsDiv.innerHTML = '<div class="text-center p-8 text-gray-500">No recipes found. Try different ingredients!</div>';
            return;
        }

        const recipeHTML = recipes.map(recipe => `
            <div class="bg-white rounded-lg shadow p-6 mb-4">
                <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-48 object-cover rounded mb-4">
                <h3 class="text-xl font-bold mb-2">${recipe.title}</h3>
                <p class="text-green-600 mb-3">✅ Uses ${recipe.usedIngredientCount} of your ingredients</p>
                <p class="text-gray-600 mb-3">Missing: ${recipe.missedIngredients.map(i => i.name).join(', ')}</p>
                <button onclick="toggleFavorite('${recipe.title}', '${recipe.image}')" class="bg-pink-500 text-white px-4 py-2 rounded">❤️ Add to Favorites</button>
            </div>
        `).join('');
        
        resultsDiv.innerHTML = recipeHTML;
    } catch (error) {
        resultsDiv.innerHTML = `<div class="text-center p-8 text-red-500">API Error. Check your Spoonacular key.</div>`;
    }
}

// ==================== FAVORITES ====================
function toggleFavorite(title, image) {
    const user = auth.currentUser;
    if (!user) return alert('Login to save favorites!');
    
    db.collection('favorites').add({
        userId: user.uid,
        title: title,
        image: image,
        timestamp: Date.now()
    }).then(() => alert('Added to favorites!'));
}

function showFavorites() {
    const user = auth.currentUser;
    db.collection('favorites').where('userId', '==', user.uid).get().then(snapshot => {
        const recipes = snapshot.docs.map(doc => doc.data());
        const resultsDiv = document.getElementById('results');
        
        if (recipes.length === 0) {
            resultsDiv.innerHTML = '<div class="text-center p-8 text-gray-500">No favorites yet!</div>';
            return;
        }
        
        resultsDiv.innerHTML = recipes.map(recipe => `
            <div class="bg-white rounded-lg shadow p-6 mb-4">
                <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-48 object-cover rounded mb-4">
                <h3 class="text-xl font-bold">${recipe.title}</h3>
            </div>
        `).join('');
    });
}

// ==================== SUBMIT RECIPE ====================
function submitRecipe() {
    const user = auth.currentUser;
    if (!user) return alert('Login to submit recipes!');
    
    const name = document.getElementById('recipeName').value.trim();
    const desc = document.getElementById('recipeDesc').value.trim();
    
    if (!name || !desc) return alert('Fill all fields!');
    
    db.collection('pendingRecipes').add({
        name: name,
        description: desc,
        userId: user.uid,
        userEmail: user.email,
        timestamp: Date.now(),
        status: 'pending'
    }).then(() => {
        document.getElementById('recipeName').value = '';
        document.getElementById('recipeDesc').value = '';
        alert('Recipe submitted for review!');
    });
}

// ==================== ADMIN FUNCTIONS ====================
function loadPendingRecipes() {
    db.collection('pendingRecipes').where('status', '==', 'pending').get().then(snapshot => {
        const list = document.getElementById('pendingRecipes');
        if (snapshot.empty) {
            list.innerHTML = '<p class="text-gray-500">No pending recipes</p>';
            return;
        }
        list.innerHTML = snapshot.docs.map(doc => `
            <div class="border-b pb-4 mb-4">
                <h4 class="font-bold text-lg">${doc.data().name}</h4>
                <p class="text-sm text-gray-600 mb-2">By: ${doc.data().userEmail}</p>
                <p class="mb-3">${doc.data().description}</p>
                <button onclick="approveRecipe('${doc.id}')" class="bg-green-500 text-white px-3 py-1 rounded mr-2">Approve</button>
                <button onclick="rejectRecipe('${doc.id}', '${doc.data().userId}')" class="bg-red-500 text-white px-3 py-1 rounded mr-2">Reject</button>
                <button onclick="banUser('${doc.data().userId}')" class="bg-black text-white px-3 py-1 rounded">Ban User</button>
            </div>
        `).join('');
    });
}

function approveRecipe(docId) {
    db.collection('pendingRecipes').doc(docId).update({status: 'approved'})
        .then(() => loadPendingRecipes());
}

function rejectRecipe(docId, userId) {
    db.collection('pendingRecipes').doc(docId).delete()
        .then(() => loadPendingRecipes());
}

function banUser(userId) {
    if (confirm('Ban this user?')) {
        db.collection('bannedUsers').doc(userId).set({banned: true})
            .then(() => alert('User banned!'));
    }
}

