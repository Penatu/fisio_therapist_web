const API_URL = "http://76.13.23.68:8990/api/v1";

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/auth-user/login/therapist`,
  REGISTER: `${API_URL}/therapist/register`,
  VERIFY_OTP: `${API_URL}/therapist/verify-otp`,
  VERIFY_USER_PROFILE: `${API_URL}/therapist/onboarding`,
};
