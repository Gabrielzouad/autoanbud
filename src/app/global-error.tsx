'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang='no'>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            backgroundColor: '#fafaf9',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
              Noe gikk galt
            </h2>
            <p style={{ color: '#78716c', fontSize: 14, marginBottom: 24 }}>
              En kritisk feil oppstod. Prøv å laste siden på nytt.
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#14532d',
                color: 'white',
                padding: '8px 20px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Last siden på nytt
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
