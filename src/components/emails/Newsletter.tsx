import * as React from 'react';

interface NewsletterProps {
  date: string;
  submissions: Array<{
    headline: string;
    details: string;
  }>;
}

export const Newsletter: React.FC<Readonly<NewsletterProps>> = ({
  date,
  submissions,
}) => (
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
      NYC Musicians Wanted: {date}
    </h1>
    <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '20px' }}>
      Here are the latest opportunities in NYC. If you have an opportunity you'd
      like to share in this newsletter, please submit your details at{' '}
      <a
        href='https://nycmusicianswanted.com'
        style={{ color: '#1DB954', textDecoration: 'none' }}
      >
        nyc-musicians-wanted.com
      </a>
      .
    </p>

    {submissions.map((submission, index) => (
      <div
        key={index}
        style={{
          backgroundColor: '#F8F8F8',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#181818',
            marginBottom: '10px',
          }}
        >
          {submission.headline}
        </h2>
        <p style={{ fontSize: '14px', lineHeight: '1.4', color: '#282828' }}>
          {submission.details}
        </p>
      </div>
    ))}

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

export default Newsletter;
