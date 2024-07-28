import React from 'react';

interface SubmissionSuccessProps {}

const SubmissionSuccess: React.FC<SubmissionSuccessProps> = () => {
  console.log('Sign up successful');
  return (
    <div
      className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative'
      role='alert'
    >
      <h1 className='font-bold my-2'>Success!</h1>
      <h3 className='block sm:inline'>{'Thanks for signing up!'}</h3>
    </div>
  );
};

export default SubmissionSuccess;
