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
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { LoadingSpinner } from './ui/spinner';

const formSchema = z.object({
  code: z.string().min(1, 'Enter your code'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CodeForm({
  message,
  unverifiedEmail,
  callback,
}: {
  message: string;
  unverifiedEmail: string | null;
  callback: () => Promise<void>;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (!unverifiedEmail) {
        toast.error('Error: Try requesting a code again');
        return;
      }

      const {
        error: signInError,
        data: { session },
      } = await getSupabaseAnonClient().auth.verifyOtp({
        email: unverifiedEmail,
        token: values.code,
        type: 'email',
      });

      if (signInError || !session) throw signInError;

      // Call the callback function
      await callback();
    } catch (error) {
      console.error('Error', error);
      toast.error('Error', {
        description: `Error: ${error}`,
      });
    }
  }

  return (
    <>
      {
        <Form {...form}>
            <div className='relative w-full sm:w-80 mx-auto text-center'>{message}</div>
          <div className='relative w-full sm:w-80 mx-auto pt-5'>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6 w-full'
            >
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-[#b3b3b3] text-base text-left'>
                      Code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter your code'
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
