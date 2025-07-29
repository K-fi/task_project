"use server"

import { UserDataType } from "@/components/onboarding-form";
import { userRequired } from "../data/user/is-user-authenticated";
import { userSchema } from "@/lib/schema";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const createUser = async(data: UserDataType)=>{
    const {user} = await userRequired();
    if (!user) {
     throw new Error("User not authenticated");
    }
    const validatedData = userSchema.parse(data)

    const userData = await prisma.user.create({
        data: {
            id: user.id,
            email: user.email as string,
            name: validatedData.name,
            role: validatedData.role,
            onboardingCompleted:true,
            image: user.picture || "",
        },
        select:{
            id:true, 
            name:true, 
            email:true
        }
    });

    redirect("/dashboard");
};