import axios from "axios";

export const AUTH_TOKEN_KEY = "kabumikke_access_token";
export const getAccessToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);
export const getAuthorizationHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
export const setAccessToken = (token: string) => {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  axios.defaults.headers.common.Authorization = `Bearer ${token}`;
};
export const clearAccessToken = () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  delete axios.defaults.headers.common.Authorization;
};

export const configureAuthInterceptor = () => {
  const token = getAccessToken();
  if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  axios.interceptors.request.use((config) => {
    const currentToken = getAccessToken();
    if (currentToken) config.headers.Authorization = `Bearer ${currentToken}`;
    return config;
  });
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const requestUrl = String(error.config?.url || "");
      if (error.response?.status === 401 && !requestUrl.endsWith("/api/auth/login")) {
        clearAccessToken();
        window.location.assign("/login");
      }
      return Promise.reject(error);
    }
  );
};
