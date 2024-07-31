'use client';
import { Button } from '@/components/ui/button';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import ConfirmEmail from './ConfirmEmail';
import { LoadingSpinner } from './ui/spinner';
import CustomForm from './CustomForm';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const defaultValues = {
  email: '',
};

type FormValues = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [ignoreWarning, setIgnoreWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  async function onSubmit(values: FormValues) {
    try {
      const { error: signInError } =
        await getSupabaseAnonClient().auth.signInWithOtp({
          email: values.email.trim(),
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up-success`,
          },
        });

      if (signInError) throw signInError;

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Error signing up');
    }
  }

  useEffect(() => {
    async function checkUser() {
      const session = await getSupabaseAnonClient().auth.getSession();
      setSignedInEmail(session.data.session?.user.email || null);
      setLoading(false);
    }
    checkUser();
  }, []);

  return (
    <div>
      {loading ? (
        <LoadingSpinner className='text-white mx-auto' />
      ) : isSubmitted ? (
        <ConfirmEmail />
      ) : signedInEmail && !ignoreWarning ? (
        <div className='text-center text-[#b3b3b3]'>
          <p className='mb-2'>You're already signed up with:</p>
          <p className='font-semibold text-white mb-4'>{signedInEmail}</p>
          <Button
            onClick={() => setIgnoreWarning(true)}
            className='bg-[#1DB954] hover:bg-[#1ED760] text-zinc-900 font-bold my-4 py-4 px-4 rounded-full w-full'
          >
            Sign up with a different email
          </Button>
        </div>
      ) : (
        <CustomForm
          onSubmit={onSubmit}
          schema={formSchema}
          defaultValues={defaultValues}
        />
      )}
    </div>
  );
}
