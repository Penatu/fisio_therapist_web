const API_URL = "http://76.13.23.68:8990/api/v1";

export const SOCKET_BASE_URL = API_URL.replace(/\/api\/v1\/?$/, "");

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/auth-user/login/therapist`,
  REGISTER: `${API_URL}/therapist/register`,
  VERIFY_OTP: `${API_URL}/therapist/verify-otp`,
  VERIFY_USER_PROFILE: `${API_URL}/therapist/onboarding`,
  UPLOAD_FILE: `${API_URL}/therapist/upload`,
  GET_USER_PROFILE: `${API_URL}/therapist/onboarding`,
  PRACTICE_SCHEDULE: `${API_URL}/therapist/schedules`,
  GET_SERVICE_LIST: `${API_URL}/therapist/settings/get-service`,
  SET_ACTIVE_SERVICE: `${API_URL}/therapist/settings/set-active-service`,
  THERAPIST_SERVICE: `${API_URL}/therapist/services`,
  GET_ORDER_LIST: `${API_URL}/therapist/booking/list`,
  GET_ORDER_DETAIL: `${API_URL}/therapist/booking/detail/:code`,
  CALNCEL_ORDER: `${API_URL}/booking/cancel/:code`,
  CONFIRM_ORDER: `${API_URL}/booking/confirm/:code`,
  VISIT_ORDER: `${API_URL}/booking/visit/:code`,
  UPLOAD_REPORT_CONSENT: `${API_URL}/booking/report/upload`,
  FINISH_ORDER: `${API_URL}/booking/finish/:code`,
  GET_CHAT_ROOM: `${API_URL}/therapist/booking/chat-room`,
  GET_CHAT_HISTORY: `${API_URL}/chat/history`,
  GET_ONBOARDING_STATUS: `${API_URL}/therapist/onboarding/status`,
  GET_PAYROLL_LIST: `${API_URL}/therapist/payroll/paid-payroll`,
  GET_DETAIL_PAYROLL: `${API_URL}/therapist/payroll/paid-payroll/:payrollCode`,
  NOTIF_GET_NOTIFICATIONS: `${API_URL}/notification`,
  NOTIF_GET_UNREAD: `${API_URL}/notification/unread-count`,
  NOTIF_READ_ALL: `${API_URL}/notification/read-all`,
  NOTIF_READ_ONE: `${API_URL}/notification/:code/read`,
};

export const NOTIFICATION_SOCKET_URL = `${SOCKET_BASE_URL}/notification`;
