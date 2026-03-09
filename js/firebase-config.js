// FIREBASE CONFIGURATION - FIXED FOR COMPAT MODE
var firebaseConfig = {
  apiKey: "AIzaSyDrUJdge3bwGR4GKW4a1M4HE7IHze8Y2Ck",
  authDomain: "gcash-tracker-f0ed6.firebaseapp.com",
  databaseURL: "https://gcash-tracker-f0ed6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gcash-tracker-f0ed6",
  storageBucket: "gcash-tracker-f0ed6.firebasestorage.app",
  messagingSenderId: "273408188024",
  appId: "1:273408188024:web:62edf9241bfe09e8a2178d"
};

// Initialize Firebase with Compat mode
firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();
var database = firebase.database();

console.log('✅ Firebase initialized successfully!');
console.log('📍 Project: gcash-tracker-f0ed6');
console.log('🌍 Database: asia-southeast1 (Singapore)');