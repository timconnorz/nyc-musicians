'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { isWebUri } from 'valid-url';
import { z } from 'zod';
import ConfirmEmail from './ConfirmEmail';
import { LoadingSpinner } from './ui/spinner';

const formSchema = z.object({
  headline: z
    .string()
    .min(1)
    .max(50, { message: 'Must be less than 50 characters' })
    .refine(value => !isWebUri(value), { message: 'Links are not allowed' }),
  body: z
    .string()
    .min(1)
    .max(500, { message: 'Must be less than 500 characters' })
    .refine(value => !isWebUri(value), { message: 'Links are not allowed' }),
  email: z.string().email('Invalid email address'),
});

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
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headline: '',
      email: '',
      body: '',
    },
  });

  // Pre-fill the email field with the user's email if they are logged in
  useEffect(() => {
    async function checkUser() {
      const session = await getSupabaseAnonClient().auth.getSession();
      if (session) {
        form.setValue('email', session.data.session?.user.email || '');
      }
    }
    checkUser();
  }, []);

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
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
          form.reset();
          setIsLoading(false);
          await sendSubmissionConfirmEmail(values.email);

          // send email without waiting for response
          sendSubmissionConfirmEmail(values.email);

          router.push('/submission/success');
        }

        setIsLoading(false);
        form.reset();
        setIsSubmitted(true);

        const { error, data } =
          await getSupabaseAnonClient().auth.signInWithOtp({
            email: values.email,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/submission/success`,
            },
          });
        if (error) {
          throw new Error('Error signing in');
        }
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Error submitting form');
    }
  }

  return (
    <>
      {isSubmitted ? (
        <ConfirmEmail />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='' {...field} />
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='headline'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input placeholder='' {...field} />
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='body'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea placeholder='' {...field} />
                  </FormControl>
                  <FormDescription></FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit'>
              {isLoading ? <LoadingSpinner /> : 'Submit'}
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
