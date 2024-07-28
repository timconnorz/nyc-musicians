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
import { APP_URL } from '@/constants';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export default function SignUpForm() {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const toast = useToast();

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
      const { data, error } = await getSupabaseAnonClient().auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${APP_URL}/sign-up/success`,
        },
      });

      if (!error) {
        console.log('Sign up successful');
        form.reset(); // Reset the form
        setIsSubmitted(true);

        // Add to Resend audience
        fetch('/api/sign-up', {
          method: 'POST',
          body: JSON.stringify({ email: values.email }),
        }).catch(error => {
          console.error('Error adding to Resend audience:', error);
          toast.toast({
            title: 'Error signing up',
            description: 'Please try again',
            variant: 'destructive',
          });
        });

        jsConfetti?.addConfetti({
          emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸'],
        });
      } else {
        throw new Error('Sign up failed');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      toast.toast({
        title: 'Error signing up',
        description: 'Please try again',
        variant: 'destructive',
      });
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
            <Button type='submit'>Submit</Button>
          </form>
        </Form>
      )}
    </>
  );
}
