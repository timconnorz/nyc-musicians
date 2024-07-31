'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { isWebUri } from 'valid-url';
import { z } from 'zod';
import ConfirmEmail from './ConfirmEmail';
import Rules from './Rules';
import { LoadingSpinner } from './ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      'one sentence headline': '',
      details: '',
    },
  });

  useEffect(() => {
    async function checkUser() {
      const session = await getSupabaseAnonClient().auth.getSession();
      if (session.data.session?.user.email) {
        form.setValue('email', session.data.session.user.email);
      }
    }
    checkUser();
  }, [form]);

  const onSubmit = async (values: SubmissionFormData) => {
    try {
      const [response, session] = await Promise.all([
        fetch('/api/submission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: values.email,
            headline: values['one sentence headline'],
            details: values.details,
          }),
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
          <Form {...form}>
            <div className='relative w-full sm:w-80 mx-auto pt-5'>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6 w-full'
              >
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-[#b3b3b3] text-base text-left'>
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter your email'
                          {...field}
                          className='bg-[#282828] text-white border-[#535353] focus:border-[#1DB954] focus:ring-[#1DB954] w-full text-base'
                        />
                      </FormControl>
                      <FormDescription className='text-[#b3b3b3] text-base'></FormDescription>
                      <FormMessage className='text-[#1DB954] text-base' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='one sentence headline'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-[#b3b3b3] text-base text-left'>
                        One Sentence Headline
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter your headline'
                          {...field}
                          className='bg-[#282828] text-white border-[#535353] focus:border-[#1DB954] focus:ring-[#1DB954] w-full text-base'
                        />
                      </FormControl>
                      <FormDescription className='text-[#b3b3b3] text-base'></FormDescription>
                      <FormMessage className='text-[#1DB954] text-base' />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='details'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-[#b3b3b3] text-base text-left'>
                        Details
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Enter details'
                          {...field}
                          className='bg-[#282828] text-white border-[#535353] focus:border-[#1DB954] focus:ring-[#1DB954] w-full text-base'
                        />
                      </FormControl>
                      <FormDescription className='text-[#b3b3b3] text-base'></FormDescription>
                      <FormMessage className='text-[#1DB954] text-base' />
                    </FormItem>
                  )}
                />
                <Button
                  type='submit'
                  className='w-full text-lg py-5 bg-green-500 hover:bg-green-400 text-black cursor-pointer'
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <LoadingSpinner className='text-black' />
                  ) : (
                    'Submit'
                  )}
                </Button>
              </form>
            </div>
          </Form>
        </>
      )}
    </>
  );
}
