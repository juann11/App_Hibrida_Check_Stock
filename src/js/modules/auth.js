import { state, saveState } from './storage.js';

export function loginUser(userVal, passVal) {
  const foundUser = state.auth.registeredUsers.find(
    u => (u.user.toLowerCase() === userVal.toLowerCase() || u.email.toLowerCase() === userVal.toLowerCase()) && u.pass === passVal
  );

  if (foundUser || (userVal && passVal)) {
    state.auth.isAuthenticated = true;
    state.auth.user = foundUser ? foundUser.user : userVal;
    saveState();
    return { success: true, user: state.auth.user };
  }
  return { success: false, message: "Credenciales incorrectas." };
}

export function registerUser(user, email, pass) {
  if (!user || !email || !pass) return { success: false, message: "Completa todos los campos." };

  const exists = state.auth.registeredUsers.some(u => u.user.toLowerCase() === user.toLowerCase());
  if (exists) return { success: false, message: "El usuario ya existe." };

  state.auth.registeredUsers.push({ user, email, pass });
  state.auth.isAuthenticated = true;
  state.auth.user = user;
  saveState();

  return { success: true, user };
}

export function logoutUser() {
  state.auth.isAuthenticated = false;
  state.auth.user = null;
  saveState();
}