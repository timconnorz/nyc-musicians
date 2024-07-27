"use client"
import React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import jsConfetti from "@/lib/confetti"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea";
import { isWebUri } from "valid-url" 

const formSchema = z.object({
    headline: z.string().min(1).max(50, { message: "Must be less than 50 characters" })
      .refine(value => !isWebUri(value), { message: "Links are not allowed" }),
    body: z.string().min(1).max(500, { message: "Must be less than 500 characters" })
      .refine(value => !isWebUri(value), { message: "Links are not allowed" }),
    email: z.string().email('Invalid email address'),
  })

export default function SubmissionForm() {
    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            headline: "",
            email: "",
            body: "",
        },
    })

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
          const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(values),
          });
          
          if (response.ok) {
            console.log('Submission successful');
            form.reset(); // Reset the form 
            // You can add user feedback here, like showing a success message
          } else {
            console.error('Submission failed');
            // Handle errors, show error message to user
          }
        } catch (error) {
          console.error('Error submitting form:', error);
          // Handle network errors
        } finally {
            jsConfetti?.addConfetti({
                emojis: ['🌈', '⚡️', '💥', '✨', '💫', '🌸'],
             })
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="" {...field} />
                            </FormControl>
                            <FormDescription>
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="headline"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Headline</FormLabel>
                            <FormControl>
                                <Input placeholder="" {...field} />
                            </FormControl>
                            <FormDescription>
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Body</FormLabel>
                            <FormControl>
                                <Textarea placeholder="" {...field} />
                            </FormControl>
                            <FormDescription>
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}
