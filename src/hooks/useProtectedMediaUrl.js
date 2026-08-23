import {
  useEffect,
  useState,
} from 'react';

import {
  getMediaObjectUrl,
} from '../api/mediaApi';

export default function useProtectedMediaUrl(
  path
) {
  const [
    objectUrl,
    setObjectUrl,
  ] = useState('');

  useEffect(() => {
    if (!path) {
      setObjectUrl('');

      return undefined;
    }

    let cancelled = false;
    let createdUrl = '';

    const loadMedia =
      async () => {
        try {
          createdUrl =
            await getMediaObjectUrl(
              path
            );

          if (!cancelled) {
            setObjectUrl(
              createdUrl
            );
          }
        } catch (err) {
          console.error(
            'Không thể tải media:',
            err
          );

          if (!cancelled) {
            setObjectUrl('');
          }
        }
      };

    loadMedia();

    return () => {
      cancelled = true;

      if (createdUrl) {
        URL.revokeObjectURL(
          createdUrl
        );
      }
    };
  }, [path]);

  return objectUrl;
}