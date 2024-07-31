'use client';
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
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function Home() {
  // print to console whether we are signed in
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await getSupabaseAnonClient().auth.getSession();
      console.log(session ? 'Signed in' : 'Not signed in');
    }
    checkSession();
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
    <div className='flex flex-col items-center justify-center min-h-screen p-4 bg-black'>
      <div className='w-full sm:w-72'>
        <Image
          src='/logo-white.svg'
          alt='logo'
          width={200}
          height={200}
          priority
          className='mx-auto mb-8'
        />
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
              <DialogHeader className='text-center flex flex-col items-center'>
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
              <DialogHeader className='text-center flex flex-col items-center'>
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
              <DialogHeader className='text-center flex flex-col items-center'>
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
              <DialogHeader className='text-center flex flex-col items-center'>
                <DialogTitle className='text-white mb-4'>About</DialogTitle>
                <div className='text-left w-full'>
                  <p className='mb-4'>
                    This newsletter is built for the musician community of NYC.
                    It was born by necessity when the "NYC Musicians Wanted"
                    group on{' '}
                    <a
                      href='https://www.facebook.com/groups/2021146228121097'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-400 hover:underline'
                    >
                      Facebook
                    </a>{' '}
                    became too large and noisy to moderate effectively.
                  </p>
                  <p>
                    If you have any feedback or suggestions, please reach out to
                    us at{' '}
                    <a href='mailto:info@nyc-musicians-wanted.com'>
                      info@nyc-musicians-wanted.com
                    </a>
                  </p>
                  <p className='text-[#888] mt-4'>Last Updated Aug 1st 2024</p>
                </div>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
