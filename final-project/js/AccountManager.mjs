/**
 * AccountManager.mjs
 * Dedicated Client-Side Identity Provider & Session Controller Module
 */

export const AccountManager = {
  currentUser: null,

  /**
   * Initializes the manager by reading any active sessions persisted in local memory
   * @returns {Object|null} The active user object if logged in, otherwise null
   */
  init() {
    const activeSession = localStorage.getItem("crh_user_session");
    if (activeSession) {
      this.currentUser = JSON.parse(activeSession);
    } else {
      this.currentUser = null;
    }
    return this.currentUser;
  },

  /**
   * Registers a new account slot inside the local storage mock database
   * @param {string} email
   * @param {string} password
   * @returns {boolean} True if successful, false if account exists
   */
  registerNewAccount(email, password) {
    const database = JSON.parse(localStorage.getItem("crh_users_db") || "[]");

    if (database.some((user) => user.email === email)) {
      alert("An account with this email address already exists.");
      return false;
    }

    database.push({ email, password });
    localStorage.setItem("crh_users_db", JSON.stringify(database));

    // Auto sign-in upon account creation
    return this.establishSession(email);
  },

  /**
   * Verifies user credentials against the local storage mock database
   * @param {string} email
   * @param {string} password
   * @returns {boolean} True if successful, false if credentials fail
   */
  verifyCredentialsAndLogin(email, password) {
    const database = JSON.parse(localStorage.getItem("crh_users_db") || "[]");
    const matchingUser = database.find(
      (u) => u.email === email && u.password === password,
    );

    if (!matchingUser) {
      alert("Invalid academic email or password credentials.");
      return false;
    }
    return this.establishSession(email);
  },

  /**
   * Configures the browser session state tokens
   * @param {string} email
   * @returns {boolean}
   */
  establishSession(email) {
    this.currentUser = { email, loginTimestamp: Date.now() };
    localStorage.setItem("crh_user_session", JSON.stringify(this.currentUser));
    return true;
  },

  /**
   * Terminates the active user context profile instantly
   */
  terminateSession() {
    this.currentUser = null;
    localStorage.removeItem("crh_user_session");
  },

  /**
   * Helper to determine security visibility permissions
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.currentUser !== null;
  },

  /**
   * Gets the authenticated user details
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.currentUser;
  },
};
