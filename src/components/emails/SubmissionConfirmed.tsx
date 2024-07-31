import * as React from 'react';

interface SubmissionConfirmedProps {}

export const SubmissionConfirmed: React.FC<
  Readonly<SubmissionConfirmedProps>
> = () => (
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
      Thanks for your submission!
    </h1>
    <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '20px' }}>
      If your submission follows our rules, it will be added to our next
      newsletter. Thanks for supporting NYC Musicians!
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

export default SubmissionConfirmed;
