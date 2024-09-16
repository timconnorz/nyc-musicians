'use client';
import About from '@/components/About';
import Rules from '@/components/Rules';
import SignUpForm from '@/components/SignUpForm';
import SubmissionForm from '@/components/SubmissionForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import Image from 'next/image';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useCheckUser } from '@/useCheckUser';
export default function Home() {
  // print the user's email to the console if they are signed in
  useEffect(() => {
    async function checkUser() {
      const session = await getSupabaseAnonClient().auth.getSession();
      if (session.data.session?.user.email) {
        console.log(`Signed in as ${session.data.session.user.email}`);
      }
    }
    checkUser();
  }, []);

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

  return (
    <div className='flex flex-col items-center pt-[15%] mb-10 sm:pt-0 sm:justify-center h-screen p-4 bg-black'>
      <div className='w-auto max-w-96 sm:max-w-72'>
        <Image
          src='/logo-white.svg'
          alt='logo'
          width={200}
          height={200}
          priority
          className='mx-auto mb-4'
        />
        <p className='text-[#b3b3b3] text-center mb-8 text-lg sm:text-md px-10 sm:px-0'>
          A curated list of opportunities for musicians, sent weekly.
        </p>
        <div className='space-y-4 flex flex-col items-center w-full'>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='default'
                className='w-full text-lg py-5 bg-green-500 hover:bg-green-400 text-black cursor-pointer'
              >
                Newsletter Sign Up
              </Button>
            </DialogTrigger>
            <DialogContent className='bg-[#121212] text-white border-[#282828]'>
              <DialogHeader className='text-left flex flex-col items-center'>
                <DialogTitle className='text-white mb-4'>Sign Up</DialogTitle>
                <SignUpForm />
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='default'
                className='w-full text-lg py-5 bg-gray-800 hover:bg-gray-700 text-white cursor-pointer'
              >
                Make a Submission
              </Button>
            </DialogTrigger>
            <DialogContent className='bg-[#121212] text-white border-[#282828]'>
              <DialogHeader className='text-left flex flex-col items-center'>
                <DialogTitle className='text-white mb-4'>
                  Make a Submission
                </DialogTitle>
                <SubmissionForm />
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='default'
                className='w-full text-lg py-5 bg-black hover:bg-gray-900 text-white border border-gray-700 cursor-pointer'
              >
                Rules
              </Button>
            </DialogTrigger>
            <DialogContent className='bg-[#121212] text-white border-[#282828]'>
              <DialogHeader className='flex flex-col items-center'>
                <DialogTitle className='text-white mb-4'>Rules</DialogTitle>
                <Rules />
              </DialogHeader>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='default'
                className='w-full text-lg py-5 bg-black hover:bg-gray-900 text-white border border-gray-700 cursor-pointer'
              >
                About
              </Button>
            </DialogTrigger>
            <DialogContent className='bg-[#121212] text-white border-[#282828]'>
              <DialogHeader className='flex flex-col items-center'>
                <DialogTitle className='text-white mb-4'>About</DialogTitle>
                <About />
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
