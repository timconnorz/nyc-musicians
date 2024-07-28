'use client';

import SubmissionForm from '@/components/SubmissionForm';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Submission() {
  const router = useRouter();
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  const handleClose = () => {
    router.push('/');
  };

  return (
    <div className='container max-w-3xl py-12'>
      <div className='flex justify-end mb-2'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-8 w-8 cursor-pointer'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          onClick={handleClose}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M6 18L18 6M6 6l12 12'
          />
        </svg>
      </div>
      <main className='flex flex-col items-center justify-center p-2 sm:p-8 md:p-12'>
        <div className='container max-w-xl mx-auto'>
          <h1 className='text-3xl font-bold text-center mb-8'>
            Submit an Opportunity
          </h1>
          <SubmissionForm />
        </div>
      </main>
    </div>
  );
}
