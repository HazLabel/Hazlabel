import type { Metadata } from "next"
import LoginFormClient from "./_login-form"

export const metadata: Metadata = {
    title: "Sign In | HazLabel — AI-Powered GHS Compliance Platform",
    description: "Sign in to HazLabel to access your chemical vault, manage GHS-compliant labels, and automate Safety Data Sheet processing. Trusted by safety professionals.",
    robots: { index: false, follow: true },
}

export default function LoginPage() {
    return <LoginFormClient />
}
