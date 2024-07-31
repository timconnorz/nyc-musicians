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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, DefaultValues, Path } from 'react-hook-form';
import { LoadingSpinner } from './ui/spinner';
import { z } from 'zod';
import { useEffect } from 'react';

const CustomForm = <T extends Record<string, any>>({
  onSubmit,
  schema,
  defaultValues,
}: {
  onSubmit: (values: T) => Promise<void>;
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
}) => {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  return (
    <Form {...form}>
      <div className='relative w-full sm:w-80 mx-auto'>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 w-full'
        >
          {Object.keys(defaultValues).map(fieldName => (
            <FormField
              key={fieldName}
              control={form.control}
              name={fieldName as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-[#b3b3b3]'>{fieldName}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={`Enter your ${fieldName}`}
                      {...field}
                      className='bg-[#282828] text-white border-[#535353] focus:border-[#1DB954] focus:ring-[#1DB954] w-full'
                    />
                  </FormControl>
                  <FormDescription className='text-[#b3b3b3]'></FormDescription>
                  <FormMessage className='text-[#1DB954]' />
                </FormItem>
              )}
            />
          ))}
          <Button
            type='submit'
            className='bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-2 px-4 rounded-full w-full'
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
  );
};

export default CustomForm;
