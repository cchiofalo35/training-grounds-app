import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDTt965l7xFvNZnt2eMNi5dcjh5HUcegsI',
  authDomain: 'training-grounds-app.firebaseapp.com',
  projectId: 'training-grounds-app',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
