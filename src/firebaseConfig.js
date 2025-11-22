import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = Object.entries(firebaseConfig).filter(([, value]) => !value);
if (requiredKeys.length > 0) {
	const missingKeys = requiredKeys.map(([key]) => key).join(', ');
	console.warn(`Missing Firebase configuration values for: ${missingKeys}. Check your .env file.`);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
