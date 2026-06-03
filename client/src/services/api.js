import axios from "axios";
import { getBaseURL } from "../utils/url";
import { logout } from "../utils/auth";

const API = axios.create({
  baseURL: `${getBaseURL()}/api`,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  const tenantId = localStorage.getItem("selectedTenantId");
  
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    req.headers['X-Tenant-ID'] = tenantId;
  }
  // Prevent browser caching of API responses
  req.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  req.headers['Pragma'] = 'no-cache';
  req.headers['Expires'] = '0';
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Prevent logout if the 401 came from Razorpay rejecting the keys during create-order
      const isPaymentError = error.config && error.config.url && error.config.url.includes('/payment/create-order');
      if (!isPaymentError) {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default API;
