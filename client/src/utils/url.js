export const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "https://shyambhog.onrender.com";
};

export const getMediaUrl = (path) => {
  if (!path || path === '/logo.png' || path === 'logo.png' || path.includes('logo.png')) {
    return '/logo.png';
  }
  
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
