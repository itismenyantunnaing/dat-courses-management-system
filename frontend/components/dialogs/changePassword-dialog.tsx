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

interface ChangePasswordProps {
    step?: string;
    flow?: "forgot" | "change";
    force?: boolean;  // Added force prop
    onStepChange?: (step: string) => void;
    onPasswordUpdate?: (data: { staffId?: string; newPassword: string; oldPassword?: string }) => void;
    onClose?: () => void;
    staffId?: string;
    loading?: boolean;
    error?: string;
    onEmailChange?: (email: string) => void;
    onOtpChange?: (otp: string) => void;
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
    onOtpChange
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
    const [currentStep, setCurrentStep] = useState(step);
    const [token, setToken] = useState<string | null>(null)
    const [otpSuccess, setOtpSuccess] = useState("")

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

    // Countdown states for OTP
    const [countdown, setCountdown] = useState(0)
    const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout>()

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
            // Using direct fetch instead of server action to maintain session
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify({ email }),
            })

            const text = await response.text()
            console.log("Send OTP response:", text)

            if (response.ok) {
                // Notify parent about email
                if (onEmailChange) {
                    onEmailChange(email)
                }
                // Move to OTP step
                handleStepChange("otp")
            } else {
                let errorMessage = "Failed to send OTP. Please check your email address."
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

    // In handleOtpSubmit function
    const handleOtpSubmit = async () => {
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify({ email, otp }),
            })

            const text = await response.text()
            console.log("Verify OTP response:", text)

            if (response.ok && (text.toLowerCase().includes("verified") || text.toLowerCase().includes("success"))) {
                // Store OTP for later use in reset
                if (onOtpChange) {
                    onOtpChange(otp)
                }
                // Move to reset step
                handleStepChange("reset")
                // DO NOT clear OTP here, it's needed for the reset-password call
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


    // Handle resend OTP (Forgot Password Flow)
    const handleResendOtp = async () => {
        setIsLoading(true)
        setError("")

        try {
            // Using direct fetch to maintain session
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include',
                body: JSON.stringify({ email }),
            })

            const text = await response.text()

            if (response.ok) {
                // Reset countdown
                setCountdown(60)
                setOtpSuccess("OTP resent successfully!")
                // Clear success message after 3 seconds
                setTimeout(() => setError(""), 3000)
            } else {
                let errorMessage = "Failed to resend OTP"
                try {
                    const json = JSON.parse(text)
                    errorMessage = json.message || errorMessage
                } catch (e) {
                    errorMessage = text || errorMessage
                }
                setError(errorMessage)
            }
        } catch (err) {
            console.error("Resend OTP error:", err)
            setError("Network error. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Handle old password submission (Change Password Flow)
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
            // Using direct fetch to maintain session for the two-step change process
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/verify-current-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ currentPassword: oldPassword }),
            })

            const text = await response.text()
            console.log("Verify current password response:", text)

            if (response.ok) {
                // Move to new password step
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

    // Handle password update (Both Flows)
    const handlePasswordUpdate = async () => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        // Check if new password is same as current password (only for change flow)
        if (flow === "change" && newPassword === oldPassword) {
            setError("New password cannot be the same as your current password")
            return
        }

        if (!passwordRegex.test(newPassword)) {
            setError("Password must contain: 8+ chars, A-Z, a-z, 0-9, and symbol (@$!%*?&)")
            return;
        }

        setIsLoading(true)
        setError("")

        try {
            if (flow === "forgot") {

                const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/verify-otp`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, otp }),
                })

                const verifyText = await verifyResponse.text()
                console.log("Re-verify response:", verifyText)

                if (!verifyResponse.ok || !(verifyText.toLowerCase().includes("verified") || verifyText.toLowerCase().includes("success"))) {
                    setError("OTP verification session expired. Please go back and verify again.")
                    setIsLoading(false)
                    return
                }

                // Reset password for forgot flow
                const resetResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/reset-password`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, newPassword }),
                })

                const resetText = await resetResponse.text()
                console.log("Password reset response:", resetText)

                if (resetResponse.ok && (resetText.toLowerCase().includes("success") || resetText.toLowerCase().includes("successful"))) {
                    if (onPasswordUpdate) {
                        onPasswordUpdate({ staffId: email, newPassword })
                    }
                    if (!force && onClose) {
                        onClose()
                    }
                    resetForm()
                    alert("Password updated successfully! Please login with your new password.")
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
                // For change password flow, use direct fetch to maintain session
                const changeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/change-password`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({ newPassword, confirmPassword }),
                })

                const changeText = await changeResponse.text()
                console.log("Password change response:", changeText)

                if (changeResponse.ok && (changeText.toLowerCase().includes("success") || changeText.toLowerCase().includes("successful") || changeText.toLowerCase().includes("changed"))) {
                    if (onPasswordUpdate) {
                        onPasswordUpdate({ staffId: email, newPassword })
                    }
                    if (!force && onClose) {
                        onClose()
                    }
                    resetForm()
                    alert("Password changed successfully! You will be logged out for security.")
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
                                <Button variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                            )}
                            <Button
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
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}
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
                                {countdown > 0
                                    ? `Resend code in ${countdown}s`
                                    : "Resend code"}
                            </Button>
                        </div>
                        <DialogFooter>
                            {!force && (
                                <Button variant="outline" onClick={() => handleStepChange("staff-id")}>
                                    Back
                                </Button>
                            )}
                            <Button
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
        switch (currentStep) {
            case "old-password":
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                Update Your Password
                            </DialogTitle>
                            <DialogDescription>
                                {force && <span className=" text-sm font-normal text-destructive">You have to change your password at the first login.</span>} <br />
                                Please enter your current password to continue.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="old-password">Current Password</Label>
                                <Input
                                    id="old-password"
                                    type="password"
                                    placeholder="Enter your current password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && oldPassword) {
                                            handleOldPasswordSubmit()
                                        }
                                    }}
                                    autoFocus
                                />
                                {error && <p className="text-sm text-destructive">{error}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            {!force && (
                                <Button variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                            )}
                            <Button
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

    // Shared new password form
    const renderNewPasswordForm = () => {
        const title = flow === "forgot" ? "Reset Password" : "Create New Password"
        const description = flow === "forgot"
            ? "Enter your new password below."
            : "Enter your new password below. Make sure it's secure and easy to remember."

        return (
            <>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {error && (
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>

                </div>
                <DialogFooter>
                    {!force && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                const previousStep = flow === "forgot" ? "otp" : "old-password"
                                handleStepChange(previousStep)
                                setError("")
                            }}
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        onClick={handlePasswordUpdate}
                        disabled={!newPassword || !confirmPassword || isLoading}
                    >
                        {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                </DialogFooter>
            </>
        )
    }

    // Use external loading/error if provided
    const displayLoading = externalLoading || isLoading
    const displayError = externalError || error

    // Main render
    return (
        <>
            {flow === "forgot" && renderForgotPasswordFlow()}
            {flow === "change" && renderChangePasswordFlow()}
        </>
    )
}