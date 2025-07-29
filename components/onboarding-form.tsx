"use client"
import { userSchema } from '@/lib/schema';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {zodResolver} from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { createUser } from '@/app/actions/user';

interface Props{
    name: string;
    email: string;
    image?: string;
}

export type UserDataType = z.infer<typeof userSchema>;

export const OnboardingForm = ({name, email, image}: Props) => {
    const [pending, setPending] = useState(false);

    const form = useForm<UserDataType>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: name || "",
            email: email,
            image: image || "",
            role: undefined,
        },
    })
    const onSubmit = async(data: UserDataType) => {
        try{
            setPending(true);
            await createUser(data);
        }catch(error){
            console.log(error)
            toast.error("Something went wrong, please try again later.");
        }
    }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                     <CardTitle>Welcome to DailyTM</CardTitle>
                    <CardDescription>
                        Amazing task manager app.
                     </CardDescription>
                </CardHeader>

                <CardContent>
                     <Form {...form}>
                          <form onSubmit = {form.handleSubmit(onSubmit)} className = "space-y-5">
                            <FormField
                             control={form.control}
                             name="name"
                             render={({field}) => ( 
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder='Enter your name' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                             )}
                             />

                             <FormField
                             control={form.control}
                             name="role"
                             render={({field}) => ( 
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder='Select a role' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="INTERN">Intern</SelectItem>
                                            <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                             )}
                             />

                             <Button type="submit">Submit</Button>
                          </form>
                     </Form>
                 </CardContent>
             </Card> 
    </div>
  );
};

