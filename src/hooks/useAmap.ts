import { useEffect, useState } from 'react';

declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
    AMap: any;
  }
}

export const useAmap = (key: string, secret: string) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.AMap) {
      setLoaded(true);
      return;
    }

    window._AMapSecurityConfig = {
      securityJsCode: secret,
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Scale,AMap.ToolBar`;
    script.async = true;

    script.onload = () => {
      setLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Amap SDK');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if necessary
    };
  }, [key, secret]);

  return { loaded, error };
};
