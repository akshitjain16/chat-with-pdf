
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDCN7M-cxXgy2EXYEZ5SqBDhDZ1kh5ufCU",
  authDomain: "pdfy-62aa5.firebaseapp.com",
  projectId: "pdfy-62aa5",
  storageBucket: "pdfy-62aa5.appspot.com",
  messagingSenderId: "248798975884",
  appId: "1:248798975884:web:edaed989d67673425328a9",
  measurementId: "G-6X4WL3P8VL"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);

const storage = getStorage(app);

export {db, storage};