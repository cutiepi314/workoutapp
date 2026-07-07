import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAx_J80jlMu7l6KSoWmiLYXLzl3wQjHQoo",
  authDomain: "workout-3c556.firebaseapp.com",
  projectId: "workout-3c556",
  storageBucket: "workout-3c556.firebasestorage.app",
  messagingSenderId: "561491843913",
  appId: "1:561491843913:web:4b8f6adeaf2a3444c35898"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;

// ---- Generic per-user key/value helpers backed by Firestore ----
async function dbGet(key) {
  if (!currentUser) return null;
  const ref = doc(db, 'users', currentUser.uid, 'kv', key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { key, value: snap.data().value };
}
async function dbSet(key, value) {
  if (!currentUser) return null;
  const ref = doc(db, 'users', currentUser.uid, 'kv', key);
  await setDoc(ref, { value, updatedAt: Date.now() });
  return { key, value };
}
async function dbDelete(key) {
  if (!currentUser) return null;
  const ref = doc(db, 'users', currentUser.uid, 'kv', key);
  await deleteDoc(ref);
  return { key, deleted: true };
}
async function dbGetAllKV() {
  if (!currentUser) return [];
  const colRef = collection(db, 'users', currentUser.uid, 'kv');
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ key: d.id, value: d.data().value }));
}

// ---- Auth screen wiring ----
const authScreen = document.getElementById('authScreen');
const appRoot = document.getElementById('appRoot');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmit = document.getElementById('authSubmit');
const authError = document.getElementById('authError');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  tabLogin.classList.toggle('active', mode === 'login');
  tabSignup.classList.toggle('active', mode === 'signup');
  authSubmit.textContent = mode === 'login' ? 'Log in' : 'Sign up';
  authError.textContent = '';
}
tabLogin.onclick = () => setAuthMode('login');
tabSignup.onclick = () => setAuthMode('signup');

function friendlyAuthError(code) {
  const map = {
    'auth/invalid-email': 'That email address doesn\'t look right.',
    'auth/user-not-found': 'No account found with that email — try signing up instead.',
    'auth/wrong-password': 'Wrong password. Try again.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account already exists with that email — try logging in instead.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/missing-password': 'Enter a password.',
    'auth/popup-closed-by-user': 'Google sign-in window was closed before finishing.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in popup — please allow popups and try again.',
    'auth/cancelled-popup-request': '',
    'auth/unauthorized-domain': 'This website\'s address isn\'t authorized in Firebase yet. Go to Firebase Console → Authentication → Settings → Authorized domains, and add this site\'s domain.',
    'auth/operation-not-allowed': 'This sign-in method isn\'t turned on yet in Firebase (Authentication → Sign-in method).',
    'auth/network-request-failed': 'Network error — check your internet connection and try again.',
    'auth/too-many-requests': 'Too many attempts — please wait a moment and try again.',
  };
  if (map[code] !== undefined) return map[code];
  console.error('Unhandled auth error:', code);
  return code ? ('Something went wrong (' + code + '). Check the browser console for details.') : 'Something went wrong. Please try again.';
}

document.getElementById('googleSignInBtn').addEventListener('click', async () => {
  authError.textContent = '';
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    const msg = friendlyAuthError(e.code);
    if (msg) authError.textContent = msg;
  }
});

authSubmit.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) { authError.textContent = 'Enter your email and password.'; return; }
  authSubmit.disabled = true;
  authError.textContent = '';
  try {
    if (authMode === 'login') {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
  } catch (e) {
    authError.textContent = friendlyAuthError(e.code);
  }
  authSubmit.disabled = false;
});

[authEmail, authPassword].forEach(el => {
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') authSubmit.click(); });
});

document.getElementById('signOutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    authScreen.style.display = 'none';
    appRoot.style.display = 'block';
    document.getElementById('userEmail').textContent = user.email;
    initApp();
  } else {
    resetAllTimers();
    document.getElementById('celebrateToast').classList.remove('show');
    authScreen.style.display = 'flex';
    appRoot.style.display = 'none';
  }
});

const S = 'stroke="#2B5347" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const F = 'fill="#2B5347"';

const EX = [
  // WARM-UP
  { id:'marching', cat:'warmup', name:'Seated marching', reps:'1 minute', timerSeconds:60, muscles:['quads','core'],
    howto:'Sit tall, lift knees alternately, swing arms naturally.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="14" r="7" ${F}/><line x1="30" y1="21" x2="30" y2="38" ${S}/><line x1="30" y1="38" x2="20" y2="32" ${S}/><line x1="20" y1="32" x2="18" y2="20" ${S}/><line x1="30" y1="38" x2="44" y2="50" ${S}/><line x1="30" y1="26" x2="18" y2="18" ${S}/><line x1="30" y1="26" x2="42" y2="20" ${S}/><line x1="12" y1="52" x2="48" y2="52" stroke="#DCE6E0" stroke-width="4" stroke-linecap="round"/></svg>` },
  { id:'armcircles', cat:'warmup', name:'Arm circles', reps:'20 seconds each direction', timerSeconds:20, muscles:['shoulders'],
    howto:'Stand or sit, extend arms out to sides, make slow circles.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="12" r="7" ${F}/><line x1="30" y1="19" x2="30" y2="42" ${S}/><line x1="30" y1="24" x2="10" y2="16" ${S}/><circle cx="10" cy="16" r="8" fill="none" stroke="#2B5347" stroke-width="3" stroke-dasharray="3 4"/><line x1="30" y1="24" x2="50" y2="16" ${S}/><circle cx="50" cy="16" r="8" fill="none" stroke="#2B5347" stroke-width="3" stroke-dasharray="3 4"/><line x1="30" y1="42" x2="20" y2="54" ${S}/><line x1="30" y1="42" x2="40" y2="54" ${S}/></svg>` },
  { id:'anklecircles', cat:'warmup', name:'Ankle circles', reps:'10 each direction, each foot', muscles:['calves'],
    howto:'Seated, lift one foot, rotate the ankle slowly in circles.',
    svg:`<svg viewBox="0 0 60 60"><rect x="8" y="10" width="30" height="16" rx="6" fill="#DCE6E0"/><circle cx="42" cy="30" r="6" ${F}/><line x1="42" y1="36" x2="42" y2="42" ${S}/><circle cx="44" cy="48" r="9" fill="none" stroke="#2B5347" stroke-width="3" stroke-dasharray="3 4"/></svg>` },
  { id:'hipcircles', cat:'warmup', name:'Standing hip circles', reps:'8 each direction', muscles:['hips'],
    howto:'Hold a chair or counter, place hands on hips, and make slow circles with your hips, like a gentle hula motion.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="10" r="7" ${F}/><line x1="30" y1="17" x2="30" y2="36" ${S}/><ellipse cx="30" cy="40" rx="14" ry="6" fill="none" stroke="#2B5347" stroke-width="3" stroke-dasharray="3 4"/><line x1="30" y1="40" x2="24" y2="54" ${S}/><line x1="30" y1="40" x2="36" y2="54" ${S}/></svg>` },
  { id:'shoulderrolls', cat:'warmup', name:'Seated shoulder rolls', reps:'8 forward, 8 backward', muscles:['shoulders'],
    howto:'Sit tall, lift shoulders up toward your ears, roll them back and down slowly.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="14" r="7" ${F}/><line x1="30" y1="21" x2="30" y2="42" ${S}/><line x1="30" y1="42" x2="20" y2="52" ${S}/><line x1="30" y1="42" x2="40" y2="52" ${S}/><path d="M18 26 Q 30 16 42 26" fill="none" stroke="#2B5347" stroke-width="3" stroke-dasharray="3 4"/></svg>` },

  // LOWER BODY
  { id:'squats', cat:'lower', name:'Chair squats', reps:'8–10 reps', muscles:['quads','hips'],
    howto:'Sit down, stand up. Use arms on the chair or counter for support.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="10" r="7" ${F}/><line x1="30" y1="17" x2="30" y2="32" ${S}/><line x1="30" y1="32" x2="16" y2="44" ${S}/><line x1="16" y1="44" x2="16" y2="53" ${S}/><line x1="30" y1="32" x2="44" y2="44" ${S}/><line x1="44" y1="44" x2="44" y2="53" ${S}/><line x1="30" y1="21" x2="14" y2="25" ${S}/><line x1="30" y1="21" x2="46" y2="25" ${S}/></svg>` },
  { id:'legext', cat:'lower', name:'Seated leg extensions', reps:'10 reps each leg', muscles:['quads'],
    howto:'Sit in a chair, straighten one leg out, hold 2 seconds, lower slowly.',
    svg:`<svg viewBox="0 0 60 60"><rect x="6" y="30" width="24" height="16" rx="6" fill="#DCE6E0"/><circle cx="22" cy="12" r="7" ${F}/><line x1="22" y1="19" x2="22" y2="38" ${S}/><line x1="22" y1="38" x2="44" y2="38" ${S}/><line x1="22" y1="24" x2="10" y2="30" ${S}/><line x1="22" y1="24" x2="34" y2="18" ${S}/></svg>` },
  { id:'calfraise', cat:'lower', name:'Standing calf raises', reps:'10–15 reps', muscles:['calves'],
    howto:'Hold a counter, rise onto your toes, lower with control.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="8" r="7" ${F}/><line x1="30" y1="15" x2="30" y2="34" ${S}/><line x1="30" y1="34" x2="24" y2="48" ${S}/><line x1="24" y1="48" x2="30" y2="52" ${S}/><line x1="30" y1="34" x2="36" y2="48" ${S}/><line x1="36" y1="48" x2="30" y2="52" ${S}/><line x1="30" y1="19" x2="16" y2="12" ${S}/><line x1="30" y1="19" x2="44" y2="12" ${S}/></svg>` },
  { id:'sideleg', cat:'lower', name:'Side leg raises', reps:'8 reps each leg', muscles:['hips'],
    howto:'Hold a chair back, lift one leg out to the side, lower slowly.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="24" cy="10" r="7" ${F}/><line x1="24" y1="17" x2="24" y2="34" ${S}/><line x1="24" y1="34" x2="24" y2="52" ${S}/><line x1="24" y1="34" x2="46" y2="40" ${S}/><line x1="24" y1="21" x2="12" y2="17" ${S}/><line x1="24" y1="21" x2="12" y2="30" ${S}/></svg>` },
  { id:'hamcurl', cat:'lower', name:'Standing hamstring curls', reps:'10 reps each leg', muscles:['hamstrings'],
    howto:'Hold a chair, bend one knee, bring your heel toward your glutes.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="26" cy="10" r="7" ${F}/><line x1="26" y1="17" x2="26" y2="34" ${S}/><line x1="26" y1="34" x2="26" y2="52" ${S}/><line x1="26" y1="34" x2="42" y2="40" ${S}/><path d="M42 40 Q 52 42 46 26" ${S}/><line x1="26" y1="21" x2="12" y2="16" ${S}/></svg>` },
  { id:'pulses', cat:'lower', name:'Sit-to-stand pulses', reps:'10 small pulses', muscles:['quads','hips'],
    howto:'Hover just above the seat, pulse up and down a couple inches.',
    svg:`<svg viewBox="0 0 60 60"><rect x="8" y="42" width="44" height="6" rx="3" fill="#DCE6E0"/><circle cx="30" cy="14" r="7" ${F}/><line x1="30" y1="21" x2="30" y2="34" ${S}/><line x1="30" y1="34" x2="18" y2="42" ${S}/><line x1="30" y1="34" x2="42" y2="42" ${S}/><line x1="30" y1="25" x2="18" y2="20" ${S}/><line x1="30" y1="25" x2="42" y2="20" ${S}/></svg>` },
  { id:'wallsit', cat:'lower', name:'Wall sit (short hold)', reps:'Hold 10–15 seconds', timerSeconds:15, muscles:['quads'],
    howto:'Back flat against a wall, slide down to a shallow bend (however deep is comfortable), hold, then slide back up. A little goes a long way here.',
    svg:`<svg viewBox="0 0 60 60"><line x1="10" y1="4" x2="10" y2="56" stroke="#DCE6E0" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="12" r="7" ${F}/><line x1="22" y1="19" x2="22" y2="32" ${S}/><line x1="22" y1="32" x2="36" y2="40" ${S}/><line x1="36" y1="40" x2="36" y2="54" ${S}/><line x1="22" y1="32" x2="14" y2="40" ${S}/><line x1="14" y1="40" x2="14" y2="54" ${S}/></svg>` },

  // UPPER BODY
  { id:'wallpush', cat:'upper', name:'Wall push-ups', reps:'8–10 reps', muscles:['chest','arms','shoulders'],
    howto:"Arm's length from a wall, lower chest toward it, push back.",
    svg:`<svg viewBox="0 0 60 60"><line x1="50" y1="4" x2="50" y2="56" stroke="#DCE6E0" stroke-width="4" stroke-linecap="round"/><circle cx="18" cy="14" r="7" ${F}/><line x1="18" y1="21" x2="32" y2="38" ${S}/><line x1="32" y1="38" x2="32" y2="53" ${S}/><line x1="18" y1="25" x2="46" y2="18" ${S}/><line x1="32" y1="38" x2="50" y2="30" ${S}/></svg>` },
  { id:'rows', cat:'upper', name:'Seated rows (band)', reps:'10–12 reps', muscles:['back','arms'],
    howto:'Anchor a band around a sturdy point, pull elbows back, squeeze shoulder blades together.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="16" cy="10" r="7" ${F}/><line x1="16" y1="17" x2="16" y2="34" ${S}/><line x1="16" y1="34" x2="16" y2="53" ${S}/><line x1="16" y1="21" x2="32" y2="23" ${S}/><line x1="32" y1="23" x2="46" y2="14" ${S}/><path d="M46 14 Q 54 23 46 32" ${S}/></svg>` },
  { id:'shoulderpress', cat:'upper', name:'Seated shoulder press', reps:'8–10 reps', muscles:['shoulders','arms'],
    howto:'Light weights or water bottles. Push arms overhead, lower with control.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="14" r="7" ${F}/><line x1="30" y1="21" x2="30" y2="40" ${S}/><line x1="30" y1="40" x2="30" y2="53" ${S}/><line x1="30" y1="25" x2="16" y2="10" ${S}/><line x1="30" y1="25" x2="44" y2="10" ${S}/><circle cx="16" cy="10" r="4" fill="#DCE6E0"/><circle cx="44" cy="10" r="4" fill="#DCE6E0"/></svg>` },
  { id:'curls', cat:'upper', name:'Bicep curls', reps:'10 reps', muscles:['arms'],
    howto:'Light dumbbells or water bottles, curl up slowly, lower with control.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="12" r="7" ${F}/><line x1="30" y1="19" x2="30" y2="38" ${S}/><line x1="30" y1="38" x2="30" y2="53" ${S}/><line x1="30" y1="23" x2="16" y2="27" ${S}/><line x1="16" y1="27" x2="22" y2="16" ${S}/><circle cx="22" cy="16" r="4" fill="#DCE6E0"/><line x1="30" y1="23" x2="44" y2="27" ${S}/><line x1="44" y1="27" x2="38" y2="16" ${S}/><circle cx="38" cy="16" r="4" fill="#DCE6E0"/></svg>` },
  { id:'triceps', cat:'upper', name:'Seated tricep extensions', reps:'10 reps', muscles:['arms'],
    howto:'Hold a weight overhead with both hands, lower behind your head, extend back up.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="14" r="7" ${F}/><line x1="30" y1="21" x2="30" y2="40" ${S}/><line x1="30" y1="40" x2="30" y2="53" ${S}/><line x1="30" y1="24" x2="30" y2="10" ${S}/><path d="M22 12 Q 30 4 38 12" ${S}/></svg>` },
  { id:'lateral', cat:'upper', name:'Lateral raises', reps:'8–10 reps', muscles:['shoulders'],
    howto:'Light weights, raise arms out to your sides to shoulder height, lower slowly.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="12" r="7" ${F}/><line x1="30" y1="19" x2="30" y2="40" ${S}/><line x1="30" y1="40" x2="30" y2="53" ${S}/><line x1="30" y1="24" x2="12" y2="22" ${S}/><circle cx="12" cy="22" r="4" fill="#DCE6E0"/><line x1="30" y1="24" x2="48" y2="22" ${S}/><circle cx="48" cy="22" r="4" fill="#DCE6E0"/></svg>` },
  { id:'chestpress', cat:'upper', name:'Seated chest press', reps:'10–12 reps', muscles:['chest','arms'],
    howto:'Hold light weights or water bottles at chest height, palms forward, press arms straight out in front, then bring back in.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="16" cy="12" r="7" ${F}/><line x1="16" y1="19" x2="16" y2="40" ${S}/><line x1="16" y1="40" x2="16" y2="53" ${S}/><line x1="16" y1="24" x2="36" y2="24" ${S}/><circle cx="40" cy="24" r="5" fill="#DCE6E0"/></svg>` },
  { id:'frontraise', cat:'upper', name:'Seated front arm raises', reps:'10 reps', muscles:['shoulders'],
    howto:'Hold light weights, raise both arms straight out in front to shoulder height, lower slowly.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="18" cy="12" r="7" ${F}/><line x1="18" y1="19" x2="18" y2="40" ${S}/><line x1="18" y1="40" x2="18" y2="53" ${S}/><line x1="18" y1="24" x2="42" y2="18" ${S}/><circle cx="46" cy="17" r="4" fill="#DCE6E0"/></svg>` },

  // CORE
  { id:'kneelifts', cat:'core', name:'Seated knee lifts', reps:'10 reps each side', muscles:['core'],
    howto:'Sit tall, lift one knee toward your chest, lower with control.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="24" cy="10" r="7" ${F}/><line x1="24" y1="17" x2="24" y2="34" ${S}/><line x1="24" y1="34" x2="36" y2="24" ${S}/><line x1="36" y1="24" x2="40" y2="14" ${S}/><line x1="24" y1="34" x2="24" y2="52" ${S}/><line x1="24" y1="21" x2="10" y2="17" ${S}/></svg>` },
  { id:'twists', cat:'core', name:'Seated torso twists', reps:'10 reps each side', muscles:['core','back'],
    howto:'Arms crossed over chest, rotate gently side to side from your waist.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="10" r="7" ${F}/><line x1="30" y1="17" x2="30" y2="38" ${S}/><line x1="30" y1="38" x2="20" y2="52" ${S}/><line x1="30" y1="38" x2="40" y2="52" ${S}/><line x1="30" y1="21" x2="42" y2="17" ${S}/><line x1="30" y1="21" x2="18" y2="25" ${S}/></svg>` },
  { id:'sidebend', cat:'core', name:'Seated side bends', reps:'8 reps each side', muscles:['core'],
    howto:'Sit tall, reach one arm overhead and lean gently to the opposite side.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="34" cy="10" r="7" ${F}/><path d="M34 17 Q 24 34 30 52" ${S}/><line x1="30" y1="52" x2="20" y2="52" ${S}/><line x1="30" y1="52" x2="40" y2="52" ${S}/><line x1="34" y1="17" x2="14" y2="8" ${S}/></svg>` },
  { id:'pelvictilt', cat:'core', name:'Seated pelvic tilts', reps:'10 reps, hold 3 seconds', timerSeconds:3, muscles:['core'],
    howto:'Sit tall with feet flat on the floor. Push your lower back into the chair back, tuck your tailbone under, hold, then release.',
    svg:`<svg viewBox="0 0 60 60"><rect x="8" y="30" width="10" height="26" rx="4" fill="#DCE6E0"/><circle cx="34" cy="12" r="7" ${F}/><line x1="34" y1="19" x2="30" y2="38" ${S}/><path d="M30 38 Q 22 42 20 34" ${S}/><line x1="30" y1="38" x2="34" y2="54" ${S}/></svg>` },

  // YOGA / STRETCHING
  { id:'catcow', cat:'yoga', name:'Seated cat-cow', reps:'8 slow rounds', muscles:['back','core'],
    howto:'Hands on knees, arch your back and lift your chest, then round forward and tuck your chin.',
    svg:`<svg viewBox="0 0 60 60"><rect x="6" y="42" width="30" height="12" rx="6" fill="#DCE6E0"/><circle cx="34" cy="16" r="7" ${F}/><path d="M34 23 Q 24 32 22 44" ${S}/><line x1="22" y1="44" x2="14" y2="50" ${S}/><line x1="34" y1="26" x2="20" y2="22" ${S}/></svg>` },
  { id:'forwardfold', cat:'yoga', name:'Seated forward fold', reps:'Hold 20–30 seconds', timerSeconds:30, muscles:['hamstrings','back'],
    howto:'Sit at the edge of a chair, hinge forward from your hips, let your arms hang.',
    svg:`<svg viewBox="0 0 60 60"><rect x="8" y="38" width="26" height="14" rx="6" fill="#DCE6E0"/><path d="M20 42 Q 26 24 40 14" ${S}/><circle cx="42" cy="10" r="7" ${F}/><line x1="20" y1="42" x2="10" y2="56" ${S}/></svg>` },
  { id:'spinaltwist', cat:'yoga', name:'Seated spinal twist', reps:'Hold 20 seconds each side', timerSeconds:20, muscles:['back','core'],
    howto:'Sit tall, place one hand on the outside of the opposite knee, gently twist and look over your shoulder.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="26" cy="10" r="7" ${F}/><line x1="26" y1="17" x2="30" y2="40" ${S}/><line x1="30" y1="40" x2="20" y2="52" ${S}/><line x1="30" y1="40" x2="42" y2="52" ${S}/><line x1="26" y1="22" x2="44" y2="30" ${S}/><line x1="26" y1="22" x2="12" y2="16" ${S}/></svg>` },
  { id:'sidestretch', cat:'yoga', name:'Seated side stretch', reps:'Hold 20 seconds each side', timerSeconds:20, muscles:['core','back'],
    howto:'Sit tall, reach both arms up and gently lean to one side, feeling the stretch along your ribs.',
    svg:`<svg viewBox="0 0 60 60"><path d="M30 52 Q 20 30 30 10" ${S}/><circle cx="30" cy="8" r="6" ${F}/><line x1="30" y1="52" x2="20" y2="52" ${S}/><line x1="30" y1="52" x2="40" y2="52" ${S}/></svg>` },
  { id:'neckroll', cat:'yoga', name:'Neck rolls', reps:'5 slow rolls each direction', muscles:['shoulders'],
    howto:'Sit tall, gently drop one ear toward a shoulder and roll your head slowly in a half-circle.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="20" r="9" fill="none" stroke="#2B5347" stroke-width="4" stroke-dasharray="4 5"/><line x1="30" y1="29" x2="30" y2="46" ${S}/><line x1="30" y1="46" x2="18" y2="53" ${S}/><line x1="30" y1="46" x2="42" y2="53" ${S}/></svg>` },
  { id:'figure4', cat:'yoga', name:'Seated figure-4 stretch', reps:'Hold 20–30 seconds each side', timerSeconds:30, muscles:['hips'],
    howto:'Sit tall, cross one ankle over the opposite knee, gently lean forward.',
    svg:`<svg viewBox="0 0 60 60"><rect x="6" y="42" width="30" height="12" rx="6" fill="#DCE6E0"/><circle cx="16" cy="16" r="7" ${F}/><line x1="16" y1="23" x2="20" y2="42" ${S}/><path d="M20 42 Q 34 38 40 26" ${S}/><line x1="16" y1="26" x2="8" y2="34" ${S}/></svg>` },
  { id:'treepose', cat:'yoga', name:'Chair-supported tree pose', reps:'Hold 15–20 seconds each side', timerSeconds:20, muscles:['quads','hips'],
    howto:'Stand beside a chair, one hand resting on it for balance. Bend one knee and rest that foot against your standing ankle or calf (not on the knee joint). Hold, then switch sides.',
    svg:`<svg viewBox="0 0 60 60"><rect x="42" y="20" width="4" height="34" fill="#DCE6E0"/><rect x="42" y="20" width="14" height="4" fill="#DCE6E0"/><circle cx="24" cy="10" r="7" ${F}/><line x1="24" y1="17" x2="24" y2="38" ${S}/><line x1="24" y1="38" x2="24" y2="54" ${S}/><path d="M24 44 Q 34 42 30 32" ${S}/><line x1="24" y1="21" x2="42" y2="24" ${S}/><line x1="24" y1="21" x2="16" y2="8" ${S}/></svg>` },
  { id:'warrior2', cat:'yoga', name:'Chair-supported warrior II', reps:'Hold 15–20 seconds each side', timerSeconds:20, muscles:['quads','shoulders'],
    howto:'Stand with feet wide apart, one hand on a chair for balance. Bend your front knee gently and extend the other arm out to the side.',
    svg:`<svg viewBox="0 0 60 60"><rect x="46" y="18" width="4" height="30" fill="#DCE6E0"/><circle cx="26" cy="10" r="7" ${F}/><line x1="26" y1="17" x2="26" y2="36" ${S}/><line x1="26" y1="36" x2="14" y2="54" ${S}/><line x1="26" y1="36" x2="38" y2="54" ${S}/><line x1="26" y1="22" x2="46" y2="20" ${S}/><line x1="26" y1="22" x2="10" y2="16" ${S}/></svg>` },
  { id:'overheadreach', cat:'yoga', name:'Seated overhead reach', reps:'Hold 15–20 seconds each side', timerSeconds:20, muscles:['core','shoulders'],
    howto:'Sit tall, reach one arm straight overhead and gently lean the other direction, feeling a long stretch up your side.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="10" r="7" ${F}/><line x1="30" y1="17" x2="30" y2="40" ${S}/><line x1="30" y1="40" x2="20" y2="53" ${S}/><line x1="30" y1="40" x2="40" y2="53" ${S}/><path d="M30 20 Q 40 8 46 4" ${S}/></svg>` },

  // COOL-DOWN
  { id:'cooldown', cat:'cooldown', name:'Gentle full-body stretch', reps:'2–3 minutes', timerSeconds:180, muscles:['core','back','shoulders'],
    howto:'Seated forward reach, ankle circles, gentle shoulder rolls — whatever feels good.',
    svg:`<svg viewBox="0 0 60 60"><circle cx="30" cy="12" r="7" ${F}/><line x1="30" y1="19" x2="30" y2="40" ${S}/><line x1="30" y1="40" x2="30" y2="53" ${S}/><line x1="30" y1="23" x2="46" y2="32" ${S}/><line x1="30" y1="23" x2="14" y2="18" ${S}/></svg>` },
];

const CATS = [
  { id:'all', label:'All' },
  { id:'warmup', label:'Warm-up' },
  { id:'lower', label:'Lower body' },
  { id:'upper', label:'Upper body' },
  { id:'core', label:'Core' },
  { id:'yoga', label:'Yoga / stretch' },
  { id:'cooldown', label:'Cool-down' },
];

const CAT_TITLES = {
  warmup: 'Warm-up', lower: 'Lower body', upper: 'Upper body',
  core: 'Core', yoga: 'Yoga / stretching', cooldown: 'Cool-down'
};

const MUSCLE_LABELS = {
  shoulders:'Shoulders', chest:'Chest', arms:'Arms', back:'Back', core:'Core',
  hips:'Hips / Glutes', quads:'Quads', hamstrings:'Hamstrings', calves:'Calves'
};

const ZONE_MAP = {
  shoulders: ['z-shoulders-l','z-shoulders-r'],
  chest: ['z-chest'],
  arms: ['z-arms-l','z-arms-r'],
  core: ['z-core'],
  // This simplified front view uses the torso for back work as well.
  back: ['z-core'],
  hips: ['z-hips'],
  quads: ['z-quads-l','z-quads-r'],
  // The body map is front-facing, so use the thigh zones for hamstrings too.
  hamstrings: ['z-quads-l','z-quads-r'],
  calves: ['z-calves-l','z-calves-r'],
};

let activeFilter = 'all';
let doneState = {};
let suggestedIds = null; // null = not in suggested mode; array = list of exercise ids
let muscleFilter = null; // null or a muscle key like 'core'

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// How many to pull from each category for a balanced session, and target muscle spread
const GENERATE_PLAN = { warmup: 1, lower: 2, upper: 2, core: 2, yoga: 1, cooldown: 1 };

function generateWorkout() {
  muscleFilter = null;
  activeFilter = 'all';
  const picked = [];
  Object.keys(GENERATE_PLAN).forEach(cat => {
    const pool = shuffle(EX.filter(e => e.cat === cat));
    const usedMuscles = new Set();
    const chosen = [];
    // try to pick items that cover different muscles first
    for (const ex of pool) {
      if (chosen.length >= GENERATE_PLAN[cat]) break;
      const overlap = ex.muscles.some(m => usedMuscles.has(m));
      if (!overlap || chosen.length === 0) {
        chosen.push(ex);
        ex.muscles.forEach(m => usedMuscles.add(m));
      }
    }
    // fill remaining slots if not enough variety found
    for (const ex of pool) {
      if (chosen.length >= GENERATE_PLAN[cat]) break;
      if (!chosen.includes(ex)) chosen.push(ex);
    }
    picked.push(...chosen);
  });
  suggestedIds = picked.map(e => e.id);
  renderSuggestedBanner();
  renderFilters();
  renderChips();
  renderZones();
  renderList();
}

function renderSuggestedBanner() {
  const el = document.getElementById('suggestedBanner');
  if (!suggestedIds) { el.style.display = 'none'; el.innerHTML=''; return; }
  el.style.display = 'block';
  el.innerHTML = `
    <div class="suggested-banner">
      <div>
        <strong>Today's balanced mix — ${suggestedIds.length} moves</strong>
        A little from each area: warm-up, legs, upper body, core, and a stretch.
      </div>
      <div class="suggested-banner-actions">
        <button class="mini-btn" id="regenBtn">Shuffle</button>
        <button class="mini-btn" id="clearSuggestBtn">Show all</button>
      </div>
    </div>
  `;
  document.getElementById('regenBtn').onclick = generateWorkout;
  document.getElementById('clearSuggestBtn').onclick = () => {
    suggestedIds = null;
    renderSuggestedBanner();
    renderList();
  };
}

document.getElementById('generateBtn').addEventListener('click', generateWorkout);

function renderFilters() {
  const row = document.getElementById('filterRow');
  row.innerHTML = '';
  CATS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'filter-pill' + (c.id === activeFilter ? ' active' : '');
    btn.textContent = c.label;
    btn.onclick = () => { activeFilter = c.id; suggestedIds = null; muscleFilter = null; renderSuggestedBanner(); renderFilters(); renderChips(); renderZones(); renderList(); };
    row.appendChild(btn);
  });
}

function renderChips() {
  const row = document.getElementById('chipRow');
  row.innerHTML = '';
  Object.keys(MUSCLE_LABELS).forEach(m => {
    const worked = EX.some(e => doneState[e.id] && e.muscles.includes(m));
    const chip = document.createElement('span');
    chip.className = 'chip' + (worked ? ' active' : '') + (muscleFilter === m ? ' selected' : '');
    chip.textContent = MUSCLE_LABELS[m];
    chip.title = 'Show ' + MUSCLE_LABELS[m] + ' exercises';
    chip.onclick = () => selectMuscleFilter(m);
    row.appendChild(chip);
  });
}

function selectMuscleFilter(m) {
  muscleFilter = (muscleFilter === m) ? null : m;
  suggestedIds = null;
  activeFilter = 'all';
  renderSuggestedBanner();
  renderFilters();
  renderChips();
  renderZones();
  renderList();
  if (muscleFilter) {
    document.getElementById('listRoot').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function renderZones() {
  const zoneMuscles = {};
  Object.entries(ZONE_MAP).forEach(([muscle, zoneIds]) => {
    zoneIds.forEach(id => {
      (zoneMuscles[id] ||= []).push(muscle);
    });
  });

  Object.entries(zoneMuscles).forEach(([id, muscles]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const worked = EX.some(e => doneState[e.id] && e.muscles.some(m => muscles.includes(m)));
    el.classList.toggle('active', worked);
    el.classList.toggle('selected', muscleFilter ? muscles.includes(muscleFilter) : false);
    // Shared thigh zones default to quads when clicked; the Hamstrings chip remains
    // available for the more specific exercise filter.
    el.onclick = () => selectMuscleFilter(muscles[0]);
  });
}

function renderList() {
  const root = document.getElementById('listRoot');
  root.innerHTML = '';

  if (suggestedIds) {
    const items = suggestedIds.map(id => EX.find(e => e.id === id)).filter(Boolean);
    items.forEach(e => root.appendChild(buildCard(e)));
    return;
  }

  if (muscleFilter) {
    const items = EX.filter(e => e.muscles.includes(muscleFilter));
    const label = document.createElement('div');
    label.className = 'day-label';
    label.innerHTML = `<span class="num">${items.length}</span><h2>${MUSCLE_LABELS[muscleFilter]} exercises</h2><span class="count clear-link" id="clearMuscleBtn">✕ clear</span>`;
    root.appendChild(label);
    items.forEach(e => root.appendChild(buildCard(e)));
    document.getElementById('clearMuscleBtn').onclick = () => selectMuscleFilter(muscleFilter);
    return;
  }

  const cats = activeFilter === 'all' ? Object.keys(CAT_TITLES) : [activeFilter];
  let num = 1;
  cats.forEach(catId => {
    const items = EX.filter(e => e.cat === catId);
    if (!items.length) return;
    const label = document.createElement('div');
    label.className = 'day-label';
    label.innerHTML = `<span class="num">${num++}</span><h2>${CAT_TITLES[catId]}</h2><span class="count">${items.length} move${items.length>1?'s':''}</span>`;
    root.appendChild(label);
    items.forEach(e => root.appendChild(buildCard(e)));
  });
}

const timerStates = new Map();
let timerTicker = null;

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function getTimerState(exercise) {
  if (!timerStates.has(exercise.id)) {
    timerStates.set(exercise.id, {
      duration: exercise.timerSeconds,
      remaining: exercise.timerSeconds,
      running: false,
      finished: false,
      endsAt: null,
    });
  }
  return timerStates.get(exercise.id);
}

function refreshRunningTimer(state) {
  if (!state.running) return false;
  state.remaining = Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
  if (state.remaining > 0) return false;
  state.running = false;
  state.finished = true;
  state.endsAt = null;
  return true;
}

function timerMarkup(exercise) {
  if (!exercise.timerSeconds) return '';
  const state = getTimerState(exercise);
  refreshRunningTimer(state);
  const primaryLabel = state.running ? 'Pause' : state.finished ? 'Restart' : state.remaining < state.duration ? 'Resume' : 'Start';
  return `
    <div class="exercise-timer${state.finished ? ' finished' : ''}" data-timer-id="${exercise.id}">
      <span class="timer-display" role="timer" aria-live="polite">${formatTimer(state.remaining)}</span>
      <button type="button" class="timer-btn timer-toggle">${primaryLabel}</button>
      <button type="button" class="timer-btn timer-reset"${state.remaining === state.duration && !state.running ? ' disabled' : ''}>Reset</button>
    </div>
  `;
}

function updateTimerElement(exerciseId) {
  const exercise = EX.find(e => e.id === exerciseId);
  const state = timerStates.get(exerciseId);
  const el = document.querySelector(`[data-timer-id="${exerciseId}"]`);
  if (!exercise || !state || !el) return;
  el.classList.toggle('finished', state.finished);
  el.querySelector('.timer-display').textContent = formatTimer(state.remaining);
  el.querySelector('.timer-toggle').textContent = state.running ? 'Pause' : state.finished ? 'Restart' : state.remaining < state.duration ? 'Resume' : 'Start';
  el.querySelector('.timer-reset').disabled = state.remaining === state.duration && !state.running;
}

function runTimerTicker() {
  if (timerTicker) return;
  timerTicker = setInterval(() => {
    let hasRunningTimer = false;
    timerStates.forEach((state, exerciseId) => {
      if (!state.running) return;
      hasRunningTimer = true;
      const justFinished = refreshRunningTimer(state);
      updateTimerElement(exerciseId);
      if (justFinished) {
        const exercise = EX.find(e => e.id === exerciseId);
        showToast(`Timer finished — ${exercise?.name || 'exercise'}`);
        if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
      }
    });
    if (!hasRunningTimer || ![...timerStates.values()].some(state => state.running)) {
      clearInterval(timerTicker);
      timerTicker = null;
    }
  }, 250);
}

function toggleTimer(exercise) {
  const state = getTimerState(exercise);
  refreshRunningTimer(state);
  if (state.running) {
    state.running = false;
    state.endsAt = null;
  } else {
    if (state.finished || state.remaining <= 0) state.remaining = state.duration;
    state.finished = false;
    state.running = true;
    state.endsAt = Date.now() + state.remaining * 1000;
    runTimerTicker();
  }
  updateTimerElement(exercise.id);
}

function resetTimer(exercise) {
  const state = getTimerState(exercise);
  state.remaining = state.duration;
  state.running = false;
  state.finished = false;
  state.endsAt = null;
  updateTimerElement(exercise.id);
}

function resetAllTimers() {
  timerStates.clear();
  if (timerTicker) clearInterval(timerTicker);
  timerTicker = null;
}

function buildCard(e) {
  const card = document.createElement('div');
  card.className = 'card' + (doneState[e.id] ? ' done' : '');
  card.dataset.id = e.id;
  const muscleChips = e.muscles.map(m => `<span class="muscle-chip">${MUSCLE_LABELS[m]}</span>`).join('');
  const searchUrl = 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(e.name + ' exercise how to');
  card.innerHTML = `
    <div class="icon-col">
      <div class="icon-wrap" data-search="${searchUrl}">
        ${e.svg}
        <span class="search-badge"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
      </div>
      <div class="icon-hint">tap for photos</div>
    </div>
    <div class="info">
      <div class="name">${e.name}</div>
      <div class="reps">${e.reps}</div>
      <div class="howto">${e.howto}</div>
      ${timerMarkup(e)}
      <div class="muscle-chips">${muscleChips}</div>
    </div>
    <div class="check"><svg viewBox="0 0 24 24"><polyline points="4,13 9,18 20,6"/></svg></div>
  `;
  card.querySelector('.icon-wrap').addEventListener('click', (evt) => {
    evt.stopPropagation();
    window.open(searchUrl, '_blank', 'noopener');
  });
  const timer = card.querySelector('.exercise-timer');
  if (timer) {
    timer.addEventListener('click', evt => evt.stopPropagation());
    timer.querySelector('.timer-toggle').addEventListener('click', () => toggleTimer(e));
    timer.querySelector('.timer-reset').addEventListener('click', () => resetTimer(e));
  }
  card.addEventListener('click', () => toggleExercise(e.id));
  return card;
}

function toggleExercise(id) {
  if (!EX.some(e => e.id === id)) return;
  doneState[id] = !doneState[id];
  renderList();
  renderChips();
  renderZones();
  saveState();
  checkCelebration();
}

function checkCelebration() {
  if (!suggestedIds || !suggestedIds.length) return;
  const allDone = suggestedIds.every(id => doneState[id]);
  if (allDone) showCelebration();
}

function showCelebration() {
  showToast('🎉 Workout complete — nice work!');
}

function showToast(message) {
  const toast = document.getElementById('celebrateToast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2600);
}

const total = EX.length;
const progressText = document.getElementById('progressText');
const streakText = document.getElementById('streakText');
const ring = document.getElementById('ringProgress');
const CIRC = 132;
const exerciseIds = new Set(EX.map(e => e.id));

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function doneCount(state = doneState) {
  return EX.reduce((count, exercise) => count + (state[exercise.id] === true ? 1 : 0), 0);
}

function normalizeDoneState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([id, isDone]) => exerciseIds.has(id) && isDone === true)
  );
}

const todayKey = () => localDateKey();

let lastDoneCount = 0;

function updateRing() {
  const done = doneCount();
  const pct = done / total;
  ring.setAttribute('stroke-dashoffset', CIRC - pct * CIRC);
  progressText.textContent = done + ' done today';
  updateMotivateText(lastDoneCount, done);
  lastDoneCount = done;
  renderWeekDots();
}

function renderWeekDots() {
  const el = document.getElementById('weekDots');
  const days = ['S','M','T','W','T','F','S'];
  const today = new Date();
  const dayIdx = today.getDay(); // 0=Sun
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayIdx);

  let html = '<span class="wd-label">This week</span>';
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const key = 'workout-day-done2:' + localDateKey(d);
    const filled = kvCache[key] === 'true';
    const isToday = d.toDateString() === today.toDateString();
    html += `<span class="week-dot${filled ? ' filled' : ''}${isToday ? ' today' : ''}">${days[i]}</span>`;
  }
  el.innerHTML = html;
}

const MOTIVATE_MESSAGES = [
  { min: 0, max: 0, text: '' },
  { min: 1, max: 2, text: "Nice, you're moving 💪" },
  { min: 3, max: 5, text: "Good momentum going" },
  { min: 6, max: 8, text: "You're on a roll today 🔥" },
  { min: 9, max: 999, text: "Incredible session — great job!" },
];

function updateMotivateText(prevDone, doneCount) {
  const el = document.getElementById('motivateText');
  const match = MOTIVATE_MESSAGES.find(m => doneCount >= m.min && doneCount <= m.max);
  el.textContent = match ? match.text : '';
  if (doneCount > prevDone && doneCount > 0) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'popIn 0.35s ease';
  }
}

let kvCache = {};

async function initApp() {
  const userId = currentUser?.uid;
  resetAllTimers();
  activeFilter = 'all';
  suggestedIds = null;
  muscleFilter = null;
  lastDoneCount = 0;
  statsPanel.style.display = 'none';
  streakText.textContent = 'Loading your streak…';
  let loadedCache = {};
  try {
    const all = await dbGetAllKV();
    all.forEach(item => { loadedCache[item.key] = item.value; });
  } catch (e) {
    console.error('Failed to load your data', e);
  }
  // Ignore a slow response if the signed-in account changed while loading.
  if (!currentUser || currentUser.uid !== userId) return;
  kvCache = loadedCache;
  renderSuggestedBanner();
  renderFilters();
  loadState();
}

function loadState() {
  try {
    const raw = kvCache['checklist2:' + todayKey()];
    doneState = normalizeDoneState(raw ? JSON.parse(raw) : {});
  } catch (e) { doneState = {}; }
  renderList();
  renderChips();
  renderZones();
  updateRing();
  loadStreak();
}

function saveState() {
  const val = JSON.stringify(doneState);
  kvCache['checklist2:' + todayKey()] = val;
  dbSet('checklist2:' + todayKey(), val).catch(e => console.error('save failed', e));
  updateRing();

  const completedCount = doneCount();
  const workoutDayKey = 'workout-day-done2:' + todayKey();
  if (completedCount >= 4) {
    kvCache[workoutDayKey] = 'true';
    dbSet(workoutDayKey, 'true').catch(e => console.error('streak save failed', e));
  } else if (kvCache[workoutDayKey] !== undefined) {
    delete kvCache[workoutDayKey];
    dbDelete(workoutDayKey).catch(e => console.error('streak cleanup failed', e));
  }
  loadStreak();
  if (statsPanel.style.display !== 'none') renderStats();
}

function loadStreak() {
  try {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < 400; i++) {
      const key = 'workout-day-done2:' + localDateKey(d);
      const val = kvCache[key];
      if (val === 'true') { count++; }
      else if (i > 0) { break; }
      d.setDate(d.getDate() - 1);
    }
    if (count === 0) streakText.textContent = "Let's get your first day in";
    else if (count === 1) streakText.textContent = '1 day streak — nice start';
    else streakText.textContent = count + ' day streak — keep going';
  } catch (e) {
    streakText.textContent = 'Consistency beats intensity';
  }
}

document.getElementById('resetBtn').addEventListener('click', () => {
  doneState = {};
  const checklistKey = 'checklist2:' + todayKey();
  const workoutDayKey = 'workout-day-done2:' + todayKey();
  delete kvCache[checklistKey];
  delete kvCache[workoutDayKey];
  dbDelete(checklistKey).catch(e => console.error('checklist reset failed', e));
  dbDelete(workoutDayKey).catch(e => console.error('streak reset failed', e));
  renderList(); renderChips(); renderZones(); updateRing(); loadStreak();
  if (statsPanel.style.display !== 'none') renderStats();
});

// ---- Stats panel ----
const statsPanel = document.getElementById('statsPanel');
document.getElementById('statsBtn').addEventListener('click', () => {
  if (statsPanel.style.display === 'none') {
    renderStats();
    statsPanel.style.display = 'block';
    statsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    statsPanel.style.display = 'none';
  }
});

function renderStats() {
  const dayEntries = Object.keys(kvCache)
    .filter(k => k.startsWith('checklist2:'))
    .map(k => ({ date: k.slice('checklist2:'.length), done: (() => { try { return JSON.parse(kvCache[k] || '{}'); } catch(e){ return {}; } })() }));

  let totalExercisesLogged = 0;
  const muscleCount = {};
  dayEntries.forEach(e => {
    Object.keys(e.done).forEach(exId => {
      if (e.done[exId]) {
        const ex = EX.find(x => x.id === exId);
        if (ex) {
          totalExercisesLogged++;
          ex.muscles.forEach(m => { muscleCount[m] = (muscleCount[m] || 0) + 1; });
        }
      }
    });
  });

  const workoutDoneDates = Object.keys(kvCache)
    .filter(k => k.startsWith('workout-day-done2:') && kvCache[k] === 'true')
    .map(k => k.slice('workout-day-done2:'.length))
    .sort();
  const totalWorkoutDays = workoutDoneDates.length;
  const doneDateSet = new Set(workoutDoneDates);

  let currentStreak = 0;
  {
    let d = new Date();
    for (let i = 0; i < 400; i++) {
      const key = localDateKey(d);
      if (doneDateSet.has(key)) currentStreak++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
  }

  let longestStreak = 0, run = 0, prevDate = null;
  workoutDoneDates.forEach(dateStr => {
    const cur = new Date(dateStr);
    if (prevDate) {
      const diffDays = Math.round((cur - prevDate) / 86400000);
      run = (diffDays === 1) ? run + 1 : 1;
    } else run = 1;
    longestStreak = Math.max(longestStreak, run);
    prevDate = cur;
  });

  const favMuscle = Object.keys(muscleCount).sort((a,b) => muscleCount[b] - muscleCount[a])[0];

  const heatCells = [];
  {
    let d = new Date();
    d.setDate(d.getDate() - 69);
    for (let i = 0; i < 70; i++) {
      const key = localDateKey(d);
      let cnt = 0;
      try { cnt = doneCount(normalizeDoneState(JSON.parse(kvCache['checklist2:' + key] || '{}'))); } catch(e){}
      let lvl = 0;
      if (cnt >= 1 && cnt <= 3) lvl = 1;
      else if (cnt >= 4 && cnt <= 7) lvl = 2;
      else if (cnt >= 8 && cnt <= 12) lvl = 3;
      else if (cnt >= 13) lvl = 4;
      heatCells.push(`<div class="heatmap-cell${lvl ? ' lvl'+lvl : ''}" title="${key}: ${cnt} exercise${cnt===1?'':'s'}"></div>`);
      d.setDate(d.getDate() + 1);
    }
  }

  statsPanel.innerHTML = `
    <h3>Your stats</h3>
    <div class="stats-grid">
      <div class="stat-card"><div class="num">${currentStreak}</div><div class="label">Current streak</div></div>
      <div class="stat-card"><div class="num">${longestStreak}</div><div class="label">Longest streak ever</div></div>
      <div class="stat-card"><div class="num">${totalWorkoutDays}</div><div class="label">Total workout days</div></div>
      <div class="stat-card"><div class="num">${totalExercisesLogged}</div><div class="label">Exercises logged</div></div>
    </div>
    <div class="heatmap-title">Last 10 weeks</div>
    <div class="heatmap-scroll"><div class="heatmap-grid">${heatCells.join('')}</div></div>
    ${favMuscle ? `<p class="muscle-fav">Most-worked muscle so far: <strong>${MUSCLE_LABELS[favMuscle]}</strong></p>` : '<p class="muscle-fav">Check off a few exercises to start seeing trends here.</p>'}
  `;
}
