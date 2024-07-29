'use client';
import React from 'react';
import ConfirmEmail from './ConfirmEmail';
import { getSupabaseAnonClient } from '@/lib/supabaseFE';

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
import jsConfetti from '@/lib/confetti';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { LoadingSpinner } from './ui/spinner';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function SignUpForm() {
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { data, error: signInError } =
        await getSupabaseAnonClient().auth.signInWithOtp({
          email: values.email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up/success`,
          },
        });

      if (signInError) {
        throw signInError;
      }

      form.reset();
      setIsSubmitted(true);

      console.log('Email verification sent');
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Error signing up');
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
            <Button type='submit'>
              <div className='flex justify-center items-center w-16'>
                {form.formState.isSubmitting ? <LoadingSpinner /> : 'Submit'}
              </div>
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
