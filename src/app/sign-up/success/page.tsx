'use client';

import SignUpSuccess from '@/components/SignUpSuccess';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import jsConfetti from '@/lib/confetti';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import { toast } from 'sonner';

export default function SignUp() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  /**
   * Check if the user is logged in, if not, redirect to the home page
   * If the user is logged in, show a confetti
   */
  useEffect(() => {
    async function checkUser() {
      try {
        const session = await getSupabaseAnonClient().auth.getSession();
        if (!session) {
          router.push('/');
        } else if (session.data.session?.user?.email) {
          // Add to Resend audience
          await fetch('/api/sign-up', {
            method: 'POST',
            body: JSON.stringify({ email: session.data.session?.user?.email }),
          });

          jsConfetti?.addConfetti({
            emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸'],
          });
        }
      } catch (error) {
        console.error(error);
        toast.error('Something went wrong');
      }
    }
    checkUser();
  }, []);

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
          <h1 className='text-3xl font-bold text-center mb-8'>Sign Up</h1>
          <SignUpSuccess />
        </div>
      </main>
    </div>
  );
}
