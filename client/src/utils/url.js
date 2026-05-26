export const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  return `http://${window.location.hostname}:5001`;
};

export const getMediaUrl = (path) => {
  if (!path) return '';
  
  // If the path is already a fully qualified URL (starts with http:// or https:// or //)
  if (/^(https?:)?\/\//i.test(path)) {
    return path;
  }
  
  const base = import.meta.env.VITE_MEDIA_URL || getBaseURL();
  const sanitizedBase = base.replace(/\/+$/, '');
  const sanitizedPath = path.replace(/^\/+/, '');
  
  return `${sanitizedBase}/${sanitizedPath}`;
};

export const getFullUrl = getMediaUrl;
