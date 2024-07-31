'use client';

import Rules from '@/components/Rules';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import jsConfetti from '@/lib/confetti';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Submission() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  useEffect(() => {
    async function checkUser() {
      try {
        const session = await getSupabaseAnonClient().auth.getSession();
        if (!session) {
          router.push('/');
        }
        jsConfetti?.addConfetti({
          emojis: ['🎶', '🗞️', '📣', '🎸', '📩', '📰'],
        });
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
                {"We've received your submission! If it doesn't break "}
                <br />
                <Dialog>
                  <DialogTrigger asChild>
                    <span className='text-[#1DB954] hover:text-[#1ed760] cursor-pointer underline'>
                      the rules
                    </span>
                  </DialogTrigger>
                  <DialogContent className='bg-[#121212] text-white border-[#282828]'>
                    <DialogHeader className='text-center flex flex-col items-center'>
                      <DialogTitle className='text-white mb-4'>
                        Rules
                      </DialogTitle>
                      <Rules />
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                {', it will be featured in our next newsletter.'}
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
