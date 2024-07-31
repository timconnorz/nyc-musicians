'use client';

import jsConfetti from '@/lib/confetti';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function SignUp() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  // Show Error Toast if there is an error in the URL
  useEffect(() => {
    const url = new URL(window.location.href);

    const hashParams = new URLSearchParams(url.hash.slice(1));
    const error = hashParams.get('error');

    if (error) {
      const error_description = hashParams.get('error_description');
      console.error(error, error_description);
      toast.error(`Error: ${error_description}`);
    }
  }, []);

  /**
   * Check if the user is logged in, if not, redirect to the home page
   * If the user is logged in, show a confetti
   */
  useEffect(() => {
    async function checkUser() {
      try {
        const session = await getSupabaseAnonClient().auth.getSession();
        const email = session.data.session?.user?.email;
        if (!email) {
          router.push('/');
        } else {
          // Add to Resend audience and send sign up confirmation email
          await Promise.all([
            fetch('/api/sign-up', {
              method: 'POST',
              body: JSON.stringify({ email }),
            }),
            fetch('/api/send/sign-up-confirm', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
            }),
          ]);

          jsConfetti?.addConfetti({
            emojis: ['🎶', '🎵', '🎸', '🎹', '🎺', '🎻'],
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
    <div className='flex items-center justify-center min-h-screen  bg-black'>
      <div className='container max-w-3xl py-12 text-white'>
        <main className='flex flex-col items-center justify-center p-4 sm:p-8'>
          <div className='w-full max-w-md'>
            <div
              className='bg-[#282828] px-6 py-5 rounded-lg shadow-lg'
              role='alert'
            >
              <h1 className='font-bold text-2xl mb-4 text-white'>Success!</h1>
              <p className='text-gray-300 mb-4'>
                Thanks for signing up! You'll now receive our newsletter with
                the latest music opportunities in NYC.
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className='mt-8 w-full bg-[#1DB954] hover:bg-[#1ED760] text-black font-bold py-3 px-4 rounded-full transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:ring-opacity-50'
            >
              Back to Home
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}