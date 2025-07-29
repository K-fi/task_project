import { userRequired } from '@/app/data/user/is-user-authenticated'
import { OnboardingForm } from '@/components/onboarding-form'
import React from 'react'

const page = async() => {
  const {user} = await userRequired();

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