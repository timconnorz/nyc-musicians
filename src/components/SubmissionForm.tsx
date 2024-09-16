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
import { Textarea } from '@/components/ui/textarea';
import { getSupabaseAnonClient } from '@/lib/client/supabaseFE';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { isWebUri } from 'valid-url';
import { z } from 'zod';
import Rules from './Rules';
import { LoadingSpinner } from './ui/spinner';
import CodeForm from './CodeForm';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import {
  submitSubmission,
  sendSubmissionConfirmationEmail,
} from '@/app/actions';
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

export default function SubmissionForm() {
  const [codeRequired, setCodeRequired] = useState(false);
  const [pendingSubmission, setPendingSubmission] =
    useState<SubmissionFormData | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      'one sentence headline': '',
      details: '',
    },
  });

  // Use useEffect to set the email value
  useEffect(() => {
    async function setFormEmail() {
      const session = await getSupabaseAnonClient().auth.getSession();
      if (session.data.session?.user.email) {
        form.setValue('email', session.data.session.user.email);
      }
    }
    setFormEmail();
  }, []);

  const sendSubmission = async (submission: SubmissionFormData | null) => {
    // Get the session again to make sure it's still valid
    const {
      data: { session },
    } = await getSupabaseAnonClient().auth.getSession();

    if (!session?.user.email) {
      throw new Error('No user email found');
    }

    if (!submission) {
      throw new Error('No submission');
    }

    if (submission.email !== session.user.email) {
      throw new Error('user_email does not match session email');
    }

    try {
      await submitSubmission(
        submission.email.trim(),
        submission['one sentence headline'],
        submission.details
      );
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Error submitting');
    }

    // Send email to user with submission confirmation
    await sendSubmissionConfirmationEmail(submission.email);

    // Reroute to /submission-success
    router.push('/submission-success');
  };

  const onSubmit = async (values: SubmissionFormData) => {
    try {
      const {
        data: { session },
      } = await getSupabaseAnonClient().auth.getSession();

      // If the signed in email matches the email in the form, then we're good to go
      if (session?.user.email && session.user.email === values.email) {
        await sendSubmission(values);
        return;
      }

      setPendingSubmission(values);
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
      console.error('Error submitting:', error);
      toast.error('Error submitting');
    }
  };

  return codeRequired ? (
    <CodeForm
      message='We sent a one time code to your inbox. Enter it here to finalize your submission'
      unverifiedEmail={unverifiedEmail}
      callback={() => sendSubmission(pendingSubmission)}
    />
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
  );
}
