"use client"

import { LoginForm } from "@/components/login-form"
import Image from "next/image"
import DATLogo from "../../public/DAT Logo.png"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-2">
        <div className="flex items-center gap-2 self-center">
          <div className="flex size-20 items-center justify-center">
            <Image
              src={DATLogo}
              alt="Picture of the DAT Logo"
              className="object-cover"
            />
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
