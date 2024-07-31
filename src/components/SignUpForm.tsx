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
import { getSupabaseAnonClient } from '@/lib/supabaseFE';
import { useEffect, useState } from 'react';
import { Path } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import ConfirmEmail from './ConfirmEmail';
import { LoadingSpinner } from './ui/spinner';
import { Textarea } from './ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [ignoreWarning, setIgnoreWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

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
    <>
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
            className='w-full text-lg py-5 bg-green-500 hover:bg-green-400 text-black cursor-pointer'
          >
            Sign up with a different email
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <div className='relative w-[80%] sm:w-80 mx-auto pt-5'>
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
      )}
    </>
  );
}
