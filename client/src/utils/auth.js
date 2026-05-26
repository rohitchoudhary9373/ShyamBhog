export const getToken = () => {
    try {
      const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
      return user?.token;
    } catch {
      return null;
    }
  };
  
  export const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "null");
    } catch {
      return null;
    }
  };
  
  export const isLoggedIn = () => {
    const user = localStorage.getItem("userInfo");
    const token = localStorage.getItem("token");
    return !!(user && token);
  };
  
  export const logout = () => {
    // Clear all authentication states
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    localStorage.removeItem("shyam_bhog_cart"); // Clear cart on logout
    sessionStorage.removeItem("adminUser");
    sessionStorage.removeItem("adminToken");

    // Set a temporary flag for the login page toast
    localStorage.setItem("logout_success", "true");

    // Disconnect active socket connection if initialized
    if (window.socket && typeof window.socket.disconnect === 'function') {
      try {
        window.socket.disconnect();
      } catch (err) {
        console.error("Failed to disconnect global socket on logout:", err);
      }
    }

    // Force replace URL context to prevent page back-button navigation
    window.location.replace('/login');
  };