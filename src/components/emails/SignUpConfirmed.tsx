import * as React from 'react';

interface SignUpConfirmedProps {}

const SignUpConfirmed: React.FC<Readonly<SignUpConfirmedProps>> = () => (
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
      Thanks for signing up!
    </h1>
    <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '20px' }}>
      You'll now receive our newsletter with the latest music opportunities in
      NYC.
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

export default SignUpConfirmed;
