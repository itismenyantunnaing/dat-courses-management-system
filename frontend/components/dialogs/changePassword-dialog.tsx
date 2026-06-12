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

interface ChangePasswordProps {
    step?: string;
    flow?: "forgot" | "change";
    onStepChange?: (step: string) => void;
    onPasswordUpdate?: (data: { staffId?: string; newPassword: string; oldPassword?: string }) => void;
    onClose?: () => void;
    staffId?: string; 
}

export default function ChangePassword({
    step = "",
    flow = "forgot",
    onStepChange,
    onPasswordUpdate,
    onClose,
    staffId: externalStaffId = ""
}: ChangePasswordProps) {
    // Form states
    const [staffId, setStaffId] = useState(externalStaffId)
    const [otp, setOtp] = useState("")
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [otpError, setOtpError] = useState("")
    const [currentStep, setCurrentStep] = useState(step);

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

    // Handle staff ID submission (Forgot Password Flow)
    const handleStaffIdSubmit = async () => {
        if (!staffId) {
            setError("Please enter your staff ID")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            // API call to send OTP
            console.log("Sending OTP to staff ID:", staffId)
            // await sendOtp(staffId)

            // Move to OTP step
            handleStepChange("otp")
        } catch (err) {
            setError("Failed to send OTP. Please try again." + err)
        } finally {
            setIsLoading(false)
        }
    }

    // Handle OTP verification (Forgot Password Flow)
    const handleOtpSubmit = async () => {
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            // API call to verify OTP
            console.log("Verifying OTP:", otp)
            // await verifyOtp(staffId, otp)

            // Move to new password step
            handleStepChange("new-password")
            setOtp("")
            setOtpError("")
        } catch (err) {
            setError("Invalid OTP. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Handle resend OTP (Forgot Password Flow)
    const handleResendOtp = async () => {
        setIsLoading(true)
        setError("")

        try {
            console.log("Resending OTP to staff ID:", staffId)
            // await resendOtp(staffId)

            // Reset countdown
            setCountdown(60)
        } catch (err) {
            setError("Failed to resend OTP. Please try again.")
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

        setIsLoading(true)
        setError("")

        try {
            // API call to verify old password
            console.log("Verifying old password")
            // await verifyOldPassword(oldPassword)

            // Move to new password step
            handleStepChange("new-password")
            setOldPassword("")
        } catch (err) {
            setError("Current password is incorrect. Please try again.")
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

        if (!passwordRegex.test(newPassword)) {
            setError(
                "Password must be at least 8 characters long, and contain an uppercase letter, a lowercase letter, a number, and a special character."
            );
            return; 
        }


        setIsLoading(true)
        setError("")

        try {
            // Prepare data based on flow
            const updateData = flow === "forgot"
                ? { staffId, newPassword }
                : { newPassword, oldPassword }

            console.log(`Updating password via ${flow} flow:`, updateData)

            // API call to update password
            // if (flow === "forgot") {
            //     await resetPassword(staffId, newPassword)
            // } else {
            //     await changePassword(oldPassword, newPassword)
            // }

            // Notify parent with the updated password data
            if (onPasswordUpdate) {
                onPasswordUpdate(updateData)
            }

            // Close dialog and reset
            if (onClose) {
                onClose()
            }
            resetForm()
        } catch (err) {
            setError("Failed to update password. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Render forgot password flow (default)
    const renderForgotPasswordFlow = () => {
        switch (currentStep) {
            case "staff-id":
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Forgot Password</DialogTitle>
                            <DialogDescription>
                                Enter your staff ID to receive a verification code.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="staff-id">Staff ID</Label>
                                <Input
                                    id="staff-id"
                                    type="text"
                                    placeholder="Enter your staff ID"
                                    value={staffId}
                                    onChange={(e) => setStaffId(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && staffId) {
                                            handleStaffIdSubmit()
                                        }
                                    }}
                                    autoFocus
                                />
                                {error && <p className="text-sm text-destructive">{error}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStaffIdSubmit}
                                disabled={!staffId || isLoading}
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
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleResendOtp}
                                className="mt-2 w-fit"
                                disabled={countdown > 0 || isLoading}
                            >
                                {countdown > 0
                                    ? `you can resend code in ${countdown}s`
                                    : "Resend code"}
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => handleStepChange("staff-id")}>
                                Back
                            </Button>
                            <Button
                                onClick={handleOtpSubmit}
                                disabled={otp.length !== 6 || isLoading}
                            >
                                {isLoading ? "Verifying..." : "Verify"}
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

    // Render change password flow
    const renderChangePasswordFlow = () => {
        switch (currentStep) {
            case "old-password":
                return (
                    <>
                        <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
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
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
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

    // Shared new password form (used by both flows)
    const renderNewPasswordForm = () => {
        return (
            <>
                <DialogHeader>
                    <DialogTitle>
                        {flow === "forgot" ? "Reset Password" : "Change Password"}
                    </DialogTitle>
                    <DialogDescription>
                        Enter your new password below. Make sure it&apos;s secure and easy to remember.
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
                    <Button
                        variant="outline"
                        onClick={() => {
                            const previousStep = flow === "forgot" ? "otp" : "old-password"
                            handleStepChange(previousStep)
                        }}
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handlePasswordUpdate}
                        disabled={
                            !newPassword ||
                            isLoading
                        }
                    >
                        {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                </DialogFooter>
            </>
        )
    }

    // Main render
    return (
        <>
            {flow === "forgot" && renderForgotPasswordFlow()}
            {flow === "change" && renderChangePasswordFlow()}
        </>
    )
}