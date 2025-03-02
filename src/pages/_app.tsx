import "@/styles/globals.css";
import { useEffect, useState } from 'react';
import type { AppProps } from "next/app";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";
// 参考: https://www.php.cn/ja/faq/1796606378.html
// 参考: https://vincentgarreau.com/particles.js/#default

function MyApp({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [init, setInit] = useState(false);

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
    initParticlesEngine(async (engine) => { 
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  // 認証が通るまでは何も表示しない
  if (!isAuthenticated) {
    return null;
  }

  console.log(init);

  return (
    <div>
      <Component {...pageProps} />
      {init && (
        <div style={{ zIndex: -10 }}>
          <Particles url="particlesjs-config.json"/>
        </div>
      )}
    </div>
  );
}

export default MyApp;
