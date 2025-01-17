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
import { getSupabaseAnonClient } from '@/lib/client/supabaseFE';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import CodeForm from './CodeForm';
import { LoadingSpinner } from './ui/spinner';
import { newsletterSignUp, sendSignUpConfirmationEmail } from '@/app/actions';
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignUpForm() {
  const router = useRouter();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [codeRequired, setCodeRequired] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function signUpForNewsletter(email: string | null) {
    try {
      if (!email) {
        throw new Error('No email provided');
      }

      // Get the session again to make sure it's still valid
      const {
        data: { session },
      } = await getSupabaseAnonClient().auth.getSession();
      const jwt = session?.access_token;

      if (!jwt) {
        throw new Error('No session token found');
      }

      if (!session?.user.email) {
        throw new Error('No user email found');
      }

      // Add to Resend audience
      await newsletterSignUp(email);

      // Send sign up confirmation email
      await sendSignUpConfirmationEmail(email);

      router.push('/sign-up-success');
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Error signing up');
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const {
        data: { session },
      } = await getSupabaseAnonClient().auth.getSession();

      // If the signed in email matches the email in the form, we're good to go
      if (session?.user.email && session.user.email === values.email) {
        await signUpForNewsletter(values.email);
        return;
      }

      setUnverifiedEmail(values.email.trim());

      // Send a one time code to the users inbox
      const { error: signInError } =
        await getSupabaseAnonClient().auth.signInWithOtp({
          email: values.email.trim(),
          options: {
            shouldCreateUser: true,
          },
        });

      if (signInError) throw signInError;

      setCodeRequired(true);
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Error signing up');
    }
  };

  return codeRequired ? (
    <CodeForm
      message='We sent a one time code to your inbox. Enter it here to finish signing up!'
      unverifiedEmail={unverifiedEmail}
      callback={() => signUpForNewsletter(unverifiedEmail)}
    />
  ) : (
    <>
      {
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
      }
    </>
  );
}
