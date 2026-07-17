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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import ChangePassword from "./dialogs/changePassword-dialog"
import { login, sendOtp, verifyOtp, resetPassword } from "@/app/actions/auth"
import { EyeIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [credentials, setCredentials] = useState({ staff_Id: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState("staff-id")
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState("")

  // Reset form
  const resetForm = () => {
    setForgotPasswordStep("staff-id")
    setForgotPasswordEmail("")
    setForgotPasswordOtp("")
    setForgotPasswordError("")
  }

  // Handle Login
  const handleLoginForm = async () => {
    if (!credentials.staff_Id || !credentials.password) {
      setError("Please enter both Staff ID and Password")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await login({
        staff_Id: credentials.staff_Id,
        password: credentials.password,
      })

      if (result.success) {
        window.location.href = "/dashboard"
      } else {
        setError(result.message || "Login failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Handle Forgot Password completion
  const handleForgotPasswordUpdate = async (data: {
    staffId?: string
    email?: string
    otp?: string
    newPassword: string
    oldPassword?: string
  }) => {
    console.log("Forgot password completed successfully for:", data.staffId)
    setForgotPasswordOpen(false)
    resetForm()
  }

  const handleForgotPasswordClose = () => {
    console.log("Close forgot password dialog")
    resetForm()
    setForgotPasswordOpen(false)
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
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
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleLoginForm()
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="staff-id-login">Staff ID</FieldLabel>
                  <Input
                    id="staff-id-login"
                    type="text"
                    value={credentials.staff_Id}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        staff_Id: e.target.value,
                      })
                    }
                    placeholder="Enter your staff id"
                    required
                    disabled={loading}
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          password: e.target.value,
                        })
                      }
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      disabled={loading}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <HugeiconsIcon
                          icon={ViewOffIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={EyeIcon}
                          strokeWidth={2}
                          className="h-4 w-4"
                        />
                      )}
                    </button>
                  </div>
                </Field>
                {error && (
                  <div className="text-center text-sm text-red-500">
                    {error}
                  </div>
                )}
                <Field orientation="horizontal">
                  <div className="flex gap-2">
                    <Checkbox id="remember-me" defaultChecked />
                    <FieldLabel htmlFor="remember-me" className="font-normal">
                      Remember me
                    </FieldLabel>
                  </div>
                </Field>
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
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
            onPasswordUpdate={handleForgotPasswordUpdate}
            onClose={handleForgotPasswordClose}
            loading={forgotPasswordLoading}
            error={forgotPasswordError}
            onEmailChange={setForgotPasswordEmail}
            onOtpChange={setForgotPasswordOtp}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
