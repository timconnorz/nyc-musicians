import React from 'react';

interface SubmissionSuccessProps {}

const SubmissionSuccess: React.FC<SubmissionSuccessProps> = () => {
  return (
    <div
      className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative'
      role='alert'
    >
      <h1 className='font-bold my-2'>Success!</h1>
      <h3 className='block sm:inline'>
        {"We've received your submission! If it doesn't break "}
        <a
          href='/rules'
          className='text-green-800 underline hover:text-green-900'
        >
          the rules
        </a>
        {', it will be featured in our next newsletter.'}
      </h3>
    </div>
  );
};

export default SubmissionSuccess;
