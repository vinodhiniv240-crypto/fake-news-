import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCRZEjlWXrmO5GgQ-MKsiRpeAZkMmxzcdM",
  authDomain: "truthguard-ai-6c987.firebaseapp.com",
  projectId: "truthguard-ai-6c987",
  storageBucket: "truthguard-ai-6c987.firebasestorage.app",
  messagingSenderId: "440263006670",
  appId: "1:440263006670:web:1f3f532a600d2ec732339f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();