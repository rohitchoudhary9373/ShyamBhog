import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCvZQq4weBUhZBY6Y2ofLwN9Gpe4NYky0I",
  authDomain: "shyam-bhog.firebaseapp.com",
  projectId: "shyam-bhog",
  storageBucket: "shyam-bhog.firebasestorage.app",
  messagingSenderId: "525365985554",
  appId: "1:525365985554:web:619f7705932a7eb8e273cb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
