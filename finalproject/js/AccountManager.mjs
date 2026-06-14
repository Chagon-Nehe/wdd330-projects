/**
 * Clinical Research Hub - Academic Authentication Manager (ES Module)
 */
import { StorageEngine } from "./StorageEngine.mjs";

const USERS_DB_KEY = "crh_users_db";
const SESSION_KEY = "crh_user_session";

export const AccountManager = {
  /**
   * Checks browser storage on startup to restore an existing session
   */
  init() {
    // Automatically check if a database exists; if not, initialize an empty registry array
    if (!StorageEngine.get(USERS_DB_KEY)) {
      StorageEngine.set(USERS_DB_KEY, []);
    }
  },

  /**
   * Registers a brand new user profile into the browser database
   */
  registerNewAccount(email, password) {
    if (!email || !password) return false;

    const users = StorageEngine.get(USERS_DB_KEY) || [];

    // Prevent duplicate user registrations
    const userExists = users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (userExists) {
      alert(
        "Registration Exception: An academic profile with this email address already exists.",
      );
      return false;
    }

    // Add new profile and save using our storage engine module
    users.push({ email, password });
    StorageEngine.set(USERS_DB_KEY, users);

    // Auto-login the user immediately upon successful registration
    StorageEngine.set(SESSION_KEY, { email });
    return true;
  },

  /**
   * Verifies typed credentials against the stored user database records
   */
  verifyCredentialsAndLogin(email, password) {
    const users = StorageEngine.get(USERS_DB_KEY) || [];

    const matchingUser = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    );

    if (!matchingUser) {
      alert(
        "Authentication Denied: Invalid academic email or security password.",
      );
      return false;
    }

    // Commit active session state
    StorageEngine.set(SESSION_KEY, { email: matchingUser.email });
    return true;
  },

  /**
   * Evaluates whether a user token is currently alive in browser memory
   */
  isAuthenticated() {
    return StorageEngine.get(SESSION_KEY) !== null;
  },

  /**
   * Returns the active user account metadata profile details
   */
  getCurrentUser() {
    return StorageEngine.get(SESSION_KEY);
  },

  /**
   * Clears user tokens out of memory to close secure view channels
   */
  terminateSession() {
    StorageEngine.remove(SESSION_KEY);
  },
};
