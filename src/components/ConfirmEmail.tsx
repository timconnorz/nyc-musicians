import React from 'react';

interface ConfirmEmailProps {}

const ConfirmEmail: React.FC<ConfirmEmailProps> = () => {
  return (
    <div
      className='text-white px-6 py-8 rounded-lg shadow-lg relative'
      role='alert'
    >
      <h1 className='text-3xl font-bold mb-4 text-[#1DB954]'>
        Confirm your email!
      </h1>
      <h3 className='text-lg text-[#B3B3B3] mb-6'>
        Click the link we sent you to finish signing up. Check your spam folder
        if you don't see it!
      </h3>
    </div>
  );
};

export default ConfirmEmail;
