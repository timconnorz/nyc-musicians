import React from 'react';

interface SubmissionSuccessProps {}

const SubmissionSuccess: React.FC<SubmissionSuccessProps> = () => {
  return (
    <div
      className='bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative'
      role='alert'
    >
      <h1 className='font-bold my-2'>Confirm Your Email</h1>
      <h3 className='block sm:inline'>
        {
          'Last step! Please confirm your email by clicking the link we just sent you.'
        }
      </h3>
    </div>
  );
};

export default SubmissionSuccess;
