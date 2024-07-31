'use client';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { isWebUri } from 'valid-url';
import { toast } from 'sonner';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import CustomForm from './CustomForm';
import ConfirmEmail from './ConfirmEmail';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Rules from './Rules';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  'one sentence headline': z
    .string()
    .min(1, { message: 'Required' })
    .max(50, { message: 'Must be less than 50 characters' })
    .refine(value => !isWebUri(value), { message: 'Links are not allowed' }),
  details: z
    .string()
    .min(1, { message: 'Required' })
    .max(500, { message: 'Must be less than 500 characters' })
    .refine(value => !isWebUri(value), { message: 'Links are not allowed' }),
});

type SubmissionFormData = z.infer<typeof formSchema>;

const sendSubmissionConfirmEmail = async (email: string) => {
  const response = await fetch('/api/send/submission-confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
};

export default function SubmissionForm() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [defaultValues, setDefaultValues] = useState<SubmissionFormData>({
    email: '',
    'one sentence headline': '',
    details: '',
  });

  useEffect(() => {
    async function checkUser() {
      const session = await getSupabaseAnonClient().auth.getSession();
      if (session.data.session?.user.email) {
        setDefaultValues(prev => ({
          ...prev,
          email: session.data.session?.user.email!,
        }));
      }
    }
    checkUser();
  }, []);

  const onSubmit = async (values: SubmissionFormData) => {
    try {
      const [response, session] = await Promise.all([
        fetch('/api/submission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        }),
        getSupabaseAnonClient().auth.getSession(),
      ]);

      if (response.ok) {
        // If the signed in email matches the email in the form, then we're good to go
        if (session?.data.session?.user.email === values.email) {
          await sendSubmissionConfirmEmail(values.email);

          // send email without waiting for response
          sendSubmissionConfirmEmail(values.email);

          router.push('/submission-success');
        }

        // Otherwise we need to confirm the email
        else {
          setIsSubmitted(true);
          const { error } = await getSupabaseAnonClient().auth.signInWithOtp({
            email: values.email,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/submission-success`,
            },
          });
          if (error) {
            throw new Error('Error signing in');
          }
        }
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      toast.error('Error submitting form');
    }
  };

  return (
    <>
      {isSubmitted ? (
        <ConfirmEmail />
      ) : (
        <>
          <p className='text-center text-[#888] pb-4'>
            Please consult{' '}
            {
              <Dialog>
                <DialogTrigger asChild>
                  <span className='underline cursor-pointer'>the rules</span>
                </DialogTrigger>
                <DialogContent className='bg-[#121212] text-white border-[#282828]'>
                  <DialogHeader className='text-center flex flex-col items-center'>
                    <DialogTitle className='text-white mb-4'>Rules</DialogTitle>
                    <Rules />
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            }{' '}
            before submitting.
          </p>
          <CustomForm<SubmissionFormData>
            onSubmit={onSubmit}
            schema={formSchema}
            defaultValues={defaultValues}
          />
        </>
      )}
    </>
  );
}
