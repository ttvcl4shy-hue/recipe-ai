// ==================== CONFIGURATION ====================
const SPONACULAR_API_KEY = 'cdb0c009328f4bb5becc1b6fdbbe01a7'; // PASTE HERE
const firebaseConfig = {
  // PASTE YOUR FIREBASE CONFIG HERE
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

// ==================== INITIALIZE ====================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== AUTHENTICATION ====================
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        checkAdmin(user.uid);
    } else {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
    }
});

function signup() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => document.getElementById('authError').textContent = '')
        .catch(err => document.getElementById('authError').textContent = err.message);
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => document.getElementById('authError').textContent = '')
        .catch(err => document.getElementById('authError').textContent = err.message);
}

function logout() {
    auth.signOut();
}

// ==================== ADMIN CHECK ====================
function checkAdmin(uid) {
    db.collection('admins').doc(uid).get().then(doc => {
        if (doc.exists) {
            document.getElementById('app').innerHTML += `<button onclick="showAdmin()" class="fixed bottom-4 right-4 bg-red-700 text-white p-4 rounded-full shadow-lg">🔧</button>`;
        }
    });
}

function showAdmin() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    loadPendingRecipes();
    loadUsers();
}

// ==================== RECIPE SEARCH ====================
async function findRecipes() {
    const ingredients = document.getElementById('ingredients').value.trim();
    const resultsDiv = document.getElementById('results');
    if (!ingredients) return;

    resultsDiv.innerHTML = '<div class="text-center p-8">🔍 Searching...</div>';

    try {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=6&apiKey=${SPONACULAR_API_KEY}`
        );
        const recipes = await response.json();
        
        if (recipes.length === 0) {
            resultsDiv.innerHTML = '<div class="text-center p-8 text-gray-500">No recipes found. Try different ingredients!</div>';
            return;
        }

        const recipeHTML = recipes.map((recipe, i) => `
            <div class="bg-white rounded-lg shadow p-6">
                <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-48 object-cover rounded mb-4">
                <h3 class="text-xl font-bold mb-2">${recipe.title}</h3>
                <p class="text-green-600 mb-3">✅ Uses ${recipe.usedIngredientCount} of your ingredients</p>
                <div class="mb-3">${recipe.missedIngredients.map(ing => 
                    `<span class="inline-block bg-gray-200 px-3 py-1 rounded-full text-sm m-1">${ing.name}</span>`
                ).join('')}</div>
                <button onclick="toggleFavorite('${recipe.title}', '${recipe.image}')" class="bg-pink-500 text-white px-4 py-2 rounded">❤️ Add to Favorites</button>
            </div>
        `).join('');
        
        resultsDiv.innerHTML = recipeHTML;
    } catch (error) {
        resultsDiv.innerHTML = `<div class="text-center p-8 text-red-500">API Error. Check your key or try again later.</div>`;
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
    });
    alert('Added to favorites!');
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
            <div class="bg-white rounded-lg shadow p-6">
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
    });
    
    document.getElementById('recipeName').value = '';
    document.getElementById('recipeDesc').value = '';
    alert('Recipe submitted for review!');
}

// ==================== ADMIN FUNCTIONS ====================
function loadPendingRecipes() {
    db.collection('pendingRecipes').where('status', '==', 'pending').get().then(snapshot => {
        const list = document.getElementById('pendingRecipes');
        list.innerHTML = snapshot.docs.map(doc => `
            <div class="border-b pb-4 mb-4">
                <h4 class="font-bold">${doc.data().name}</h4>
                <p class="text-sm text-gray-600 mb-2">By: ${doc.data().userEmail}</p>
                <p>${doc.data().description}</p>
                <button onclick="approveRecipe('${doc.id}')" class="bg-green-500 text-white px-3 py-1 rounded mr-2 mt-2">Approve</button>
                <button onclick="rejectRecipe('${doc.id}')" class="bg-red-500 text-white px-3 py-1 rounded mt-2">Reject</button>
            </div>
        `).join('');
    });
}

function approveRecipe(docId) {
    db.collection('pendingRecipes').doc(docId).update({status: 'approved'});
    setTimeout(loadPendingRecipes, 500);
}

function rejectRecipe(docId) {
    db.collection('pendingRecipes').doc(docId).update({status: 'rejected'});
    setTimeout(loadPendingRecipes, 500);
}

function loadUsers() {
    // Note: This requires enabling Firebase Auth export or manual admin entry
    document.getElementById('userList').innerHTML = '<p class="text-gray-500">User management requires manual admin setup. Add banned users to Firestore "bannedUsers" collection.</p>';
}

