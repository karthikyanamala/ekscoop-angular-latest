const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { geohashForLocation } = require('geofire-common');


const app = initializeApp({
   apiKey: "AIzaSyCm8t9roHjxo2QQPgbaSHfOO0faOjkcihM",
  authDomain: "ekscoop-website.firebaseapp.com",
  projectId: "ekscoop-website",
  storageBucket: "ekscoop-website.firebasestorage.app",
  messagingSenderId: "545496437706",
  appId: "1:545496437706:web:7938b9a36d1872b86b3533",
  measurementId: "G-RZ0SX1T0DK"
});

const db = getFirestore(app);
const shopsRef = collection(db, 'shops');

function getRandomLatLng(centerLat, centerLng, radiusInKm) {
  const radiusInDeg = radiusInKm / 111;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDeg * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const lat = centerLat + w * Math.cos(t);
  const lng = centerLng + w * Math.sin(t);
  return { lat, lng };
}

async function seedShops(count = 5000) {
  const centerLat = 28.6139; // New Delhi
  const centerLng = 77.2090;

  for (let i = 0; i < count; i++) {
    const { lat, lng } = getRandomLatLng(centerLat, centerLng, 100); // spread within 100km radius

    const shop = {
      name: `Fake Shop ${i}`,
      address: `Fake Address ${i}`,
      latitude: lat,
      longitude: lng,
      whatsappNumber: `9876543${(1000 + i) % 9999}`,
      products: ['Ekscoop'],
      geohash: geohashForLocation([lat, lng]),
    };

    await addDoc(shopsRef, shop);

    if (i % 500 === 0) console.log(`Inserted ${i}`);
  }

  console.log('Seeding complete');
}

seedShops();
