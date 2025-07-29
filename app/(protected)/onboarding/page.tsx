import { userRequired } from '@/app/data/user/is-user-authenticated'
import { OnboardingForm } from '@/components/onboarding-form'
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import React from 'react'

const page = async() => {
  const {user} = await userRequired();
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  // Fetch user from database
  const existingUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      onboardingCompleted: true,
    }
  });

  // If already onboarded, redirect to dashboard
  if (existingUser?.onboardingCompleted) {
    redirect('/dashboard');
  }
  const name = `${user?.given_name ||""} ${user?.family_name ||""}`;
  return (<div className="">
    <OnboardingForm 
    name ={name} 
    email={user?.email as string} 
    image={user?.picture || ""}
    />
  </div>
  );
}

export default page