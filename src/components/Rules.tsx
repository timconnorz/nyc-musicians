import React from 'react';

const Rules = () => {
  return (
    <div className='shadow-md rounded-lg p-4 sm:p-8 max-w-2xl mx-auto text-white text-left'>
      <p className='mb-4 text-md leading-relaxed text-gray-300'>
        We aim to provide a space for legitimate opportunities for musicians in
        New York City.{' '}
      </p>
      <p className='mb-4 text-md leading-relaxed text-gray-300'>
        All posts must clearly state the opportunity details, including date,
        location, compensation, and expectations.
      </p>
      <div className='space-y-6'>
        <Section title='Good Examples'>
          <ul className='list-disc pl-5 text-gray-400'>
            <li>Posts seeking musicians for gigs</li>
            <li>Opportunities to join bands or collaborate with other musicians</li>
            <li>Any genuine music-related opportunity</li>
          </ul>
        </Section>
        <Section title='Bad Examples'>
          <ul className='list-disc pl-5 text-gray-400'>
            <li>Self-promotion of any kind</li>
            <li>Posts that are not music-related</li>
            <li>Spam or inappropiate content</li>
          </ul>
        </Section>
      </div>
      <p className='mt-6 text-yellow-500 font-semibold'>
        Consistent rule violations may result in being banned from the platform.
      </p>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3 className='text-lg font-semibold mb-2 text-white'>{title}</h3>
    {children}
  </div>
);

export default Rules;
