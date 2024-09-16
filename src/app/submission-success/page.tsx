'use client';

import Rules from '@/components/Rules';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getSupabaseAnonClient } from '@/lib/client/supabaseFE';
import jsConfetti from '@/lib/client/confetti';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function Submission() {
  const router = useRouter();

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

            <Button
              onClick={() => router.push('/')}
              variant='default'
              className='mt-8 w-full text-lg py-5 bg-green-500 hover:bg-green-400 text-black cursor-pointer'
            >
              Back to Home
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
