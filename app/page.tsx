import { Button } from "@/components/ui/button";
import {RegisterLink, LoginLink} from "@kinde-oss/kinde-auth-nextjs/components";
import Image from "next/image";

export default function Home() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold text-center">Task Manager</h1>
      <div className="flex gap-4 mt-6">
        <Button>
          <RegisterLink>
            Get Started
          </RegisterLink>
        </Button>

        <Button asChild variant={"outline"}>
          <LoginLink>Sign in</LoginLink>
        </Button>
      </div>

    </div>
  );
}
