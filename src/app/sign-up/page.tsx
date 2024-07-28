'use client';

import SignUpForm from '@/components/SignUpForm';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/spinner';

export default function SignUp() {
  const router = useRouter();
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [ignoreWarning, setIgnoreWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    router.push('/');
  };

  /**
   * Check if the user is logged in
   */
  useEffect(() => {
    setLoading(true);
    async function checkUser() {
      const session = await getSupabaseAnonClient().auth.getSession();
      if (session) {
        setSignedInEmail(session.data.session?.user.email || null);
      }
      setLoading(false);
    }
    checkUser();
  }, []);

  return loading ? (
    <div className='container max-w-3xl py-12'></div>
  ) : (
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
          <h1 className='text-3xl font-bold text-center mb-8'>Sign Up</h1>
          {signedInEmail && !ignoreWarning ? (
            <div className='flex flex-col gap-y-2 items-center'>
              <p>Your email is already subscribed: {signedInEmail}</p>
              <Button
                className='px-0'
                variant='link'
                onClick={() => setIgnoreWarning(true)}
              >
                Sign up a different email
              </Button>
            </div>
          ) : (
            <SignUpForm />
          )}
        </div>
      </main>
    </div>
  );
}
