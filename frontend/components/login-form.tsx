/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import ChangePassword from "./dialogs/changePassword-dialog"

export function LoginForm({className,...props}: React.ComponentProps<"div">) {
  const [credentials, setCredentials] = useState({ staff_Id: "", password: "" });
  
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState("staff-id")

  // Reset form
  const resetForm = () => {
    setForgotPasswordStep("staff-id")
  }

  // Forgot Password Callbacks for ChangePassword component
  const handleForgotPasswordStepChange = (step: string) => {
    console.log("Forgot password step:", step)
    setForgotPasswordStep(step)
  }

  const handleForgotPasswordUpdate = async (data: { staffId?: string; newPassword: string; oldPassword?: string }) => {
    console.log("Reset password for:", data.staffId)
    try {
      // API call to reset password
      // await resetPassword(data.staffId, data.newPassword)
      console.log("Password reset successfully")
      resetForm()
      setForgotPasswordOpen(false)
    } catch (err) {
      console.error("Failed to reset password:", err)
    }
  }

  const handleForgotPasswordClose = () => {
    console.log("Close forgot password dialog")
    resetForm()
    setForgotPasswordOpen(false)
  }

  const handleLoginForm = () => {
    const staff_Id = credentials.staff_Id;
    const password = credentials.password;



  }

  return (
    <>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Please enter your credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="staff-id-login">Staff ID</FieldLabel>
                  <Input
                    id="staff-id-login"
                    type="text"
                    value={credentials.staff_Id}
                    onChange={(e) => setCredentials({...credentials, staff_Id: e.target.value})}
                    placeholder="Enter your staff id"
                    required
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                      onClick={(e) => {
                        e.preventDefault()
                        setForgotPasswordOpen(true)
                      }}
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"  
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    required
                   />
                </Field>
                <Field orientation="horizontal">
                  <div className="flex gap-2">
                    <Checkbox id="remember-me" defaultChecked />
                    <FieldLabel htmlFor="remember-me" className="font-normal">
                      Remember me
                    </FieldLabel>
                  </div>
                </Field>
                <Field>
                  <Button type="button" onClick={handleLoginForm}>Login</Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog - ChangePassword handles all steps */}
      <Dialog
        open={forgotPasswordOpen}
        onOpenChange={(open) => {
          if (!open) resetForm()
          setForgotPasswordOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <ChangePassword
            flow="forgot"
            step={forgotPasswordStep}
            onStepChange={handleForgotPasswordStepChange}
            onPasswordUpdate={handleForgotPasswordUpdate}
            onClose={handleForgotPasswordClose}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}