import * as React from 'react';

interface LoginCodeProps {
  code: string;
}

const LoginCode: React.FC<Readonly<LoginCodeProps>> = ({ code }) => (
  <div
    style={{
      fontFamily: "'Circular', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: '#181818',
      backgroundColor: '#ffffff',
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
    }}
  >
    <h1
      style={{
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#1DB954',
        marginBottom: '20px',
      }}
    >
      Your one time code
    </h1>
    <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '20px' }}>
      Enter this code on NYC Musicians Wanted to confirm your email. It expires
      in 10 minutes.
    </p>
    <p
      style={{
        fontSize: '32px',
        fontWeight: 'bold',
        letterSpacing: '8px',
        marginBottom: '20px',
      }}
    >
      {code}
    </p>
    <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#888888' }}>
      If you didn't request this code, you can ignore this email.
    </p>
    <div
      style={{
        borderTop: '1px solid #DDDDDD',
        paddingTop: '20px',
        marginTop: '20px',
        textAlign: 'center',
      }}
    >
      <a
        href='https://nycmusicianswanted.com'
        style={{
          color: '#1DB954',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        NYC Musicians Wanted
      </a>
    </div>
  </div>
);

export default LoginCode;
