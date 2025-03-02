import "@/styles/globals.css";
import { useEffect, useState } from 'react';
import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      const auth = async () => {
        const username = window.prompt('Username:');
        const password = window.prompt('Password:');
        
        if (username === 'user' && password === 'user') {
          setIsAuthenticated(true);
          return;
        }
        
        // 認証失敗時は再帰的に認証を要求
        auth();
      };
      
      auth();
    }
  }, []);

  // 認証が通るまでは何も表示しない
  if (!isAuthenticated) {
    return null;
  }

  return <Component {...pageProps} />;
}

export default MyApp;
