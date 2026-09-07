import { useState, useEffect, useCallback } from 'react';
import {
  startGoogleAuth,
  extractAuthCode,
  exchangeCode,
  getGoogleAuthStatus,
} from '../api/googleCalendarApi';

/**
 * Google カレンダー連携（OAuth）の状態管理フック。
 *
 * - マウント時にリダイレクトから認可コードを拾ってトークン交換する
 * - connected 状態を保持し、設定画面などから参照できる
 */
export function useGoogleAuth() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(() => {
    setError(null);
    startGoogleAuth();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const handleRedirect = async () => {
      const code = extractAuthCode();
      if (!code) {
        // 認可コードが無ければ通常表示（連携状態だけ確認）
        try {
          const status = await getGoogleAuthStatus();
          if (!cancelled) setConnected(status.connected);
        } catch {
          // バックエンド未起動などは無視
        }
        return;
      }

      // URL から code を消す（履歴に残さない）
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);

      setLoading(true);
      try {
        await exchangeCode(code);
        if (!cancelled) {
          setConnected(true);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Google 連携に失敗しました');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    handleRedirect();
    return () => {
      cancelled = true;
    };
  }, []);

  return { connected, loading, error, connect };
}
