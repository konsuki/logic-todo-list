// Google Calendar OAuth 認証（Authorization Code flow + PKCE）用の API クライアント。
// バックエンド（/api → localhost:8000）にトークン交換を委譲する。

const API_BASE_URL = '/api';

// Google OAuth の認可エンドポイント
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

// クライアント情報はバックエンド側で管理するため、フロントには client_id を公開して良い。
// （client_secret は絶対にフロントに置かない）
export const GOOGLE_CLIENT_ID = '923750260675-88o2ggt5i767g1uhcuolis83nb5h7vjl.apps.googleusercontent.com';
export const GOOGLE_REDIRECT_URI = 'http://localhost:5173';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';

/**
 * PKCE の code_verifier を生成する（RFC 7636）。
 * 43〜128 文字の URL-safe 文字列を返す。
 */
function generateCodeVerifier() {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * code_verifier から code_challenge を導出する（S256 方式）。
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 認可リクエストを開始する（Google 同意画面へ遷移）。
 * PKCE の code_verifier を sessionStorage に保存し、リダイレクト後に使う。
 */
export async function startGoogleAuth() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem('google_oauth_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline', // refresh_token を取得するために必要
    prompt: 'consent', // 再認可でも refresh_token を返させるため
  });

  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * リダイレクト URL から認可コードを取り出す。
 * コードが無ければ null を返す。
 */
export function extractAuthCode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

/**
 * リダイレクト後の認可コードを、バックエンドに送ってトークン交換する。
 */
export async function exchangeCode(code) {
  const codeVerifier = sessionStorage.getItem('google_oauth_code_verifier');
  if (!codeVerifier) {
    throw new Error('code_verifier が見つかりません。認可フローを最初からやり直してください。');
  }

  const response = await fetch(`${API_BASE_URL}/oauth/google/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `トークン交換に失敗しました (HTTP ${response.status})`);
  }

  // 成功したら code_verifier を破棄
  sessionStorage.removeItem('google_oauth_code_verifier');
  return response.json();
}

/**
 * 連携状態を取得する。
 */
export async function getGoogleAuthStatus() {
  const response = await fetch(`${API_BASE_URL}/oauth/google/status`);
  if (!response.ok) {
    throw new Error(`連携状態の取得に失敗しました (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * タスクの実行実績をカレンダーへ同期する（作成 or 更新）。
 * バックエンドが専用カレンダーを自動作成し、events.insert/update する。
 *
 * @param {Object} payload - { title, description, startAt, completedAt, eventId }
 * @returns {Promise<string>} 作成/更新された eventId
 */
export async function syncCalendarEvent({ title, description, startAt, completedAt, eventId }) {
  const response = await fetch(`${API_BASE_URL}/calendar/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, startAt, completedAt, eventId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `カレンダー同期に失敗しました (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data.eventId;
}
