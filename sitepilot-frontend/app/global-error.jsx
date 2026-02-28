'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <head></head>
      <body style={{ margin: 0, padding: '2rem', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Something went wrong!</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>{error?.message || "A critical error occurred."}</p>
        <button
          onClick={() => reset()}
          style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
