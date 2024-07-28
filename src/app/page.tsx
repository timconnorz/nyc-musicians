'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Home() {
  const router = useRouter();

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
    <div>
      <div className='flex flex-col items-center justify-center h-screen'>
        <Image src='/logo.svg' alt='logo' width={200} height={200} priority />
        <div className='flex flex-col'>
          <Button
            variant='link'
            onClick={() => {
              router.push('/sign-up');
            }}
          >
            Sign Up for the Newsletter
          </Button>
          <Button
            variant='link'
            onClick={() => {
              router.push('/submission');
            }}
          >
            Make a Submission
          </Button>
        </div>
      </div>
    </div>
  );
}
