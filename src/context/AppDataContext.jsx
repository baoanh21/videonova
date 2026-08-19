import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getVideos,
} from '../api/videoApi';

import {
  getCreditBalance,
} from '../api/creditApi';

import {
  isVideoProcessing,
} from '../utils/videoStatus';

const AppDataContext =
  createContext(null);

const POLL_INTERVAL =
  Number(
    import.meta.env.VITE_API_POLL_INTERVAL
  ) || 3000;

export function AppDataProvider({
  children,
}) {
  const [credit, setCredit] =
    useState(null);

  const [videos, setVideos] =
    useState([]);

  const [videoTotal, setVideoTotal] =
    useState(0);

  const [videoSummary, setVideoSummary] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const refreshCredit =
    useCallback(async () => {
      const result =
        await getCreditBalance();

      setCredit(result);

      return result;
    }, []);

  const refreshVideos =
    useCallback(async () => {
      const result = await getVideos();

      setVideos(result.items);
      setVideoTotal(result.total);
      setVideoSummary(result.summary);

      return result;
    }, []);

  const refreshAll =
    useCallback(async () => {
      setError('');

      try {
        await Promise.all([
          refreshCredit(),
          refreshVideos(),
        ]);
      } catch (err) {
        setError(
          err.message ||
            'Không thể tải dữ liệu.'
        );

        throw err;
      } finally {
        setLoading(false);
      }
    }, [
      refreshCredit,
      refreshVideos,
    ]);

  useEffect(() => {
    refreshAll().catch(() => {});
  }, [refreshAll]);

  /*
   * Poll API thật khi có video nằm trong queue.
   *
   * Đây KHÔNG phải giả lập queue.
   * Backend vẫn là nơi xử lý queue.
   */
  const hasActiveVideo = videos.some(
    (video) =>
      isVideoProcessing(video.status)
  );

  useEffect(() => {
    if (!hasActiveVideo) return;

    const interval = setInterval(() => {
      refreshVideos().catch(() => {});
    }, POLL_INTERVAL);

    return () =>
      clearInterval(interval);
  }, [
    hasActiveVideo,
    refreshVideos,
  ]);

  const value = useMemo(
    () => ({
      credit,
      videos,
      videoTotal,
      videoSummary,
      loading,
      error,

      refreshCredit,
      refreshVideos,
      refreshAll,
    }),
    [
      credit,
      videos,
      videoTotal,
      videoSummary,
      loading,
      error,
      refreshCredit,
      refreshVideos,
      refreshAll,
    ]
  );

  return (
    <AppDataContext.Provider
      value={value}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context =
    useContext(AppDataContext);

  if (!context) {
    throw new Error(
      'useAppData phải nằm trong AppDataProvider'
    );
  }

  return context;
}