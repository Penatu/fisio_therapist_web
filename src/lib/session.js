const SESSION_EXPIRED_MESSAGE = 'Sesi habis, silahkan login ulang';

const PUBLIC_AUTH_PATHS = [
  '/auth-user/login/',
  '/therapist/register',
  '/therapist/verify-otp',
];

let handlingSessionExpired = false;

function requestUrl(input) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof input.url === 'string') return input.url;
  return '';
}

function isPublicAuthRequest(input) {
  const url = requestUrl(input);
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

export function handleSessionExpired() {
  if (handlingSessionExpired) return;
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/auth/')) return;

  handlingSessionExpired = true;
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.dispatchEvent(
    new CustomEvent('session-expired', { detail: { message: SESSION_EXPIRED_MESSAGE } })
  );
  window.setTimeout(() => {
    handlingSessionExpired = false;
  }, 1500);
}

export function installUnauthorizedFetch() {
  if (typeof window === 'undefined' || window.__unauthorizedFetchInstalled) return;

  const originalFetch = window.fetch.bind(window);
  window.__unauthorizedFetchInstalled = true;

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    if (response.status === 401 && !isPublicAuthRequest(input)) {
      handleSessionExpired();
    }
    return response;
  };
}
