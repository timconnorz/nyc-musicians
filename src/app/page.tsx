'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <div className='flex flex-col items-center justify-center h-screen'>
        <Image src='/logo.svg' alt='logo' width={200} height={200} />
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
