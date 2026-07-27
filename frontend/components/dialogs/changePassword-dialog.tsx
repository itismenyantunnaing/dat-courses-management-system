/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { getAuthToken, logout } from "@/app/actions/auth"
import {
  EyeIcon,
  ViewOffIcon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

interface ChangePasswordProps {
  step?: string
  flow?: "forgot" | "change"
  force?: boolean
  onStepChange?: (step: string) => void
  onPasswordUpdate?: (data: {
    staffId?: string
    newPassword: string
    oldPassword?: string
  }) => void
  onClose?: () => void
  staffId?: string
  loading?: boolean
  error?: string
  onEmailChange?: (email: string) => void
  onOtpChange?: (otp: string) => void
}

export default function ChangePassword({
  step = "",
  flow = "forgot",
  force = false,
  onStepChange,
  onPasswordUpdate,
  onClose,
  staffId: externalStaffId = "",
  loading: externalLoading = false,
  error: externalError = "",
  onEmailChange,
  onOtpChange,
}: ChangePasswordProps) {
  // Form states
  const [staffId, setStaffId] = useState(externalStaffId)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpError, setOtpError] = useState("")
  const [currentStep, setCurrentStep] = useState(step)
  const [token, setToken] = useState<string | null>(null)
  const [otpSuccess, setOtpSuccess] = useState("")

  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  // Countdown states for OTP
  const [countdown, setCountdown] = useState(0)
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout>()
  
  // Password validation rules
  const passwordRules = {
    minLength: (password: string) => password.length >= 8,
    hasBothCases: (password: string) =>
      /[A-Z]/.test(password) && /[a-z]/.test(password),
    hasNumber: (password: string) => /[0-9]/.test(password),
    hasSpecialChar: (password: string) =>
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  // Check if password meets all requirements
  const isPasswordValid = (password: string) => {
    return (
      passwordRules.minLength(password) &&
      passwordRules.hasBothCases(password) &&
      passwordRules.hasNumber(password) &&
      passwordRules.hasSpecialChar(password)
    )
  }

  // Individual validation checks
  const getValidationStatus = (password: string) => {
    return {
      minLength: passwordRules.minLength(password),
      hasBothCases: passwordRules.hasBothCases(password),
      hasNumber: passwordRules.hasNumber(password),
      hasSpecialChar: passwordRules.hasSpecialChar(password),
    }
  }

  // Sync internal step with prop
  useEffect(() => {
    if (step) {
      setCurrentStep(step)
    }
  }, [step])

  // Get token for change password flow
  useEffect(() => {
    if (flow === "change") {
      getAuthToken().then(setToken)
    }
  }, [flow])

  // Countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown])

  // Start countdown when entering OTP step
  useEffect(() => {
    if (flow === "forgot" && currentStep === "otp") {
      setCountdown(60)
    }
  }, [flow, currentStep])

  // Force password change - skip current password verification
  useEffect(() => {
    if (force && flow === "change") {
      setCurrentStep("new-password");
    }
  }, [force, flow]);

  // Reset form
  const resetForm = () => {
    setStaffId(externalStaffId)
    setEmail("")
    setOtp("")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setCurrentStep(flow === "forgot" ? "staff-id" : "old-password")
    setError("")
    setOtpError("")
    setCountdown(0)
    setPasswordTouched(false)
    if (errorTimeout) clearTimeout(errorTimeout)
  }

  // Handle step change and notify parent
  const handleStepChange = (newStep: string) => {
    setCurrentStep(newStep)
    if (onStepChange) {
      onStepChange(newStep)
    }
  }

  // Handle close with force check
  const handleClose = () => {
    if (!force && onClose) {
      onClose()
    }
  }

  // Handle email submission (Forgot Password Flow)
  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email }),
        }
      )

      const text = await response.text()

      if (response.ok) {
        if (onEmailChange) {
          onEmailChange(email)
        }
        handleStepChange("otp")
      } else {
        let errorMessage =
          "Failed to send OTP. Please check your email address."
        try {
          const json = JSON.parse(text)
          errorMessage = json.message || errorMessage
        } catch (e) {
          errorMessage = text || errorMessage
        }
        setError(errorMessage)
      }
    } catch (err) {
      console.error("Send OTP error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP submission
  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, otp }),
        }
      )

      const text = await response.text()

      if (
        response.ok &&
        (text.toLowerCase().includes("verified") ||
          text.toLowerCase().includes("success"))
      ) {
        if (onOtpChange) {
          onOtpChange(otp)
        }
        handleStepChange("reset")
        setOtpError("")
      } else {
        let errorMessage = "Invalid OTP. Please try again."
        try {
          const json = JSON.parse(text)
          errorMessage = json.message || errorMessage
        } catch (e) {
          errorMessage = text || errorMessage
        }
        setError(errorMessage)
      }
    } catch (err) {
      console.error("Verify OTP error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email }),
        }
      )

      const text = await response.text()

      if (response.ok) {
        setCountdown(60)
        setOtpSuccess("OTP resent successfully!")
        setTimeout(() => setOtpSuccess(""), 3000)
      } else {
        let errorMessage = "Failed to resend OTP"
        try {
          const json = JSON.parse(text)
          errorMessage = json.message || errorMessage
        } catch (e) {
          errorMessage = text || errorMessage
        }
        setError(errorMessage)
        setTimeout(() => setError(""), 3000)
      }
    } catch (err) {
      console.error("Resend OTP error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle old password submission
  const handleOldPasswordSubmit = async () => {
    if (!oldPassword) {
      setError("Please enter your current password")
      return
    }

    if (flow === "change" && !token) {
      setError("Authentication session expired. Please login again.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/security/api/auth/verify-current-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ currentPassword: oldPassword }),
        }
      )

      const text = await response.text()

      if (response.ok) {
        handleStepChange("new-password")
      } else {
        let errorMessage = "Current password is incorrect. Please try again."
        try {
          const json = JSON.parse(text)
          errorMessage = json.message || errorMessage
        } catch (e) {
          errorMessage = text || errorMessage
        }
        setError(errorMessage)
      }
    } catch (err) {
      console.error("Verify password error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Only check if new password is same as current password when NOT force
    if (flow === "change" && !force && newPassword === oldPassword) {
      setError("New password cannot be the same as your current password")
      return
    }

    if (!isPasswordValid(newPassword)) {
      setError("Password does not meet the required criteria")
      setPasswordTouched(true)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      if (flow === "forgot") {
        const verifyResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/verify-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ email, otp }),
          }
        )

        const verifyText = await verifyResponse.text()

        if (
          !verifyResponse.ok ||
          !(
            verifyText.toLowerCase().includes("verified") ||
            verifyText.toLowerCase().includes("success")
          )
        ) {
          setError(
            "OTP verification session expired. Please go back and verify again."
          )
          setIsLoading(false)
          return
        }

        const resetResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ email, newPassword }),
          }
        )

        const resetText = await resetResponse.text()

        if (
          resetResponse.ok &&
          (resetText.toLowerCase().includes("success") ||
            resetText.toLowerCase().includes("successful"))
        ) {
          if (onPasswordUpdate) {
            onPasswordUpdate({ staffId: email, newPassword })
          }
          if (!force && onClose) {
            onClose()
          }
          resetForm()
          alert(
            "Password updated successfully! Please login with your new password."
          )
        } else {
          let errorMessage = "Failed to update password"
          try {
            const json = JSON.parse(resetText)
            errorMessage = json.message || errorMessage
          } catch (e) {
            errorMessage = resetText || errorMessage
          }
          setError(errorMessage)
        }
      } else {
        // For change password flow
        const changeResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/security/api/auth/change-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({ 
              newPassword, 
              confirmPassword,
              force: force // Pass force flag to API if needed
            }),
          }
        )

        const changeText = await changeResponse.text()
        
        if (
          changeResponse.ok &&
          (changeText.toLowerCase().includes("success") ||
            changeText.toLowerCase().includes("successful") ||
            changeText.toLowerCase().includes("changed"))
        ) {
          if (onPasswordUpdate) {
            onPasswordUpdate({ staffId: email, newPassword })
          }
          if (!force && onClose) {
            onClose()
          }
          resetForm()
          alert(
            "Password changed successfully! You will be logged out for security."
          )
          await logout()
        } else {
          let errorMessage = "Failed to change password"
          try {
            const json = JSON.parse(changeText)
            errorMessage = json.message || errorMessage
          } catch (e) {
            errorMessage = changeText || errorMessage
          }
          setError(errorMessage)
        }
      }
    } catch (err) {
      console.error("Password update error:", err)
      setError("Failed to update password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Shared password input with eye toggle and validation
  const renderPasswordInput = (
    id: string,
    label: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    showPassword: boolean,
    setShowPassword: (value: boolean) => void,
    placeholder: string,
    showValidation: boolean = false,
    onBlur?: () => void
  ) => {
    const validation = getValidationStatus(value)
    const isValid = isPasswordValid(value)
    const shouldShowValidation = showValidation && value.length > 0

    return (
      <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            id={id}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            className={`pr-10 ${
              shouldShowValidation && !isValid
                ? "border-red-400 focus-visible:ring-red-400"
                : shouldShowValidation && isValid
                  ? "border-green-400 focus-visible:ring-green-400"
                  : ""
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
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
        {shouldShowValidation && (
          <div className="mt-1 space-y-1 text-xs">
            <div
              className={cn(
                "flex items-center gap-1.5",
                validation.minLength ? "text-green-600" : "text-red-500"
              )}
            >
              <HugeiconsIcon
                icon={
                  validation.minLength
                    ? CheckmarkCircle01Icon
                    : CancelCircleIcon
                }
                strokeWidth={2}
                className="h-3 w-3"
              />
              <span>Minimum 8 characters</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5",
                validation.hasBothCases ? "text-green-600" : "text-red-500"
              )}
            >
              <HugeiconsIcon
                icon={
                  validation.hasBothCases
                    ? CheckmarkCircle01Icon
                    : CancelCircleIcon
                }
                strokeWidth={2}
                className="h-3 w-3"
              />
              <span>Contains both uppercase and lowercase letters</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5",
                validation.hasNumber ? "text-green-600" : "text-red-500"
              )}
            >
              <HugeiconsIcon
                icon={
                  validation.hasNumber
                    ? CheckmarkCircle01Icon
                    : CancelCircleIcon
                }
                strokeWidth={2}
                className="h-3 w-3"
              />
              <span>At least one number</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5",
                validation.hasSpecialChar ? "text-green-600" : "text-red-500"
              )}
            >
              <HugeiconsIcon
                icon={
                  validation.hasSpecialChar
                    ? CheckmarkCircle01Icon
                    : CancelCircleIcon
                }
                strokeWidth={2}
                className="h-3 w-3"
              />
              <span>
                At least one special character (!@#$%^&*(),.?":{}|&lt;&gt;)
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Shared new password form with validation
  const renderNewPasswordForm = () => {
    const title = flow === "forgot" ? "Reset Password" : "Create New Password"
    const description =
      flow === "forgot"
        ? "Enter your new password below."
        : force 
          ? "You must change your password at first login. Enter your new password below."
          : "Enter your new password below. Make sure it's secure and easy to remember."

    return (
      <>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {force && flow === "change" && (
            <DialogDescription>
              <span className="text-sm font-normal text-destructive">
                You must change your password at first login.
              </span>
            </DialogDescription>
          )}
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {renderPasswordInput(
            "new-password",
            "New Password",
            newPassword,
            (e) => {
              setNewPassword(e.target.value)
              setPasswordTouched(true)
            },
            showNewPassword,
            setShowNewPassword,
            "Enter new password",
            true,
            () => setPasswordTouched(true)
          )}
          {renderPasswordInput(
            "confirm-password",
            "Confirm New Password",
            confirmPassword,
            (e) => setConfirmPassword(e.target.value),
            showConfirmPassword,
            setShowConfirmPassword,
            "Confirm new password",
            false
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          {!force && flow !== "forgot" && (
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => {
                const previousStep = "old-password"
                handleStepChange(previousStep)
                setError("")
              }}
            >
              Back
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={handlePasswordUpdate}
            disabled={!newPassword || !confirmPassword || isLoading}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </DialogFooter>
      </>
    )
  }

  // Render forgot password flow
  const renderForgotPasswordFlow = () => {
    switch (currentStep) {
      case "staff-id":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Forgot Password</DialogTitle>
              <DialogDescription>
                Enter your email address to receive a verification code.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email) {
                      handleEmailSubmit()
                    }
                  }}
                  autoFocus
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
            <DialogFooter>
              {!force && (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleEmailSubmit}
                disabled={!email || isLoading}
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>
            </DialogFooter>
          </>
        )

      case "otp":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Verify Your Identity</DialogTitle>
              <DialogDescription>
                Enter the 6-digit verification code sent to your email.
              </DialogDescription>
            </DialogHeader>
            <div className="flex w-full flex-col items-center gap-2 py-4">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => {
                  const numericValue = value.replace(/\D/g, "")
                  setOtp(numericValue)
                  if (value !== numericValue && value.length > 0) {
                    setOtpError("Only numbers are allowed")
                    setTimeout(() => setOtpError(""), 2000)
                  } else {
                    setOtpError("")
                  }
                }}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {otpError && (
                <p className="text-sm font-medium text-destructive">
                  {otpError}
                </p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {otpSuccess && (
                <p className="text-sm text-green-400">{otpSuccess}</p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOtp}
                className="mt-2 w-fit"
                disabled={countdown > 0 || isLoading}
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
              </Button>
            </div>
            <DialogFooter>
              {!force && (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => handleStepChange("staff-id")}
                >
                  Back
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </DialogFooter>
          </>
        )

      case "reset":
        return renderNewPasswordForm()

      default:
        return null
    }
  }

  // Render change password flow
  const renderChangePasswordFlow = () => {
    // If force is true, skip old password step and go directly to new password
    if (force && flow === "change") {
      return renderNewPasswordForm();
    }

    switch (currentStep) {
      case "old-password":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Update Your Password</DialogTitle>
              <DialogDescription>
                Please enter your current password to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {renderPasswordInput(
                "old-password",
                "Current Password",
                oldPassword,
                (e) => setOldPassword(e.target.value),
                showOldPassword,
                setShowOldPassword,
                "Enter your current password",
                false
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              {!force && (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleOldPasswordSubmit}
                disabled={!oldPassword || isLoading}
              >
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
            </DialogFooter>
          </>
        )

      case "new-password":
        return renderNewPasswordForm()

      default:
        return null
    }
  }


  // Main render
  return (
    <>
      {flow === "forgot" && renderForgotPasswordFlow()}
      {flow === "change" && renderChangePasswordFlow()}
    </>
  )
}