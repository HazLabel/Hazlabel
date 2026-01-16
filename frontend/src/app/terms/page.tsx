import LegalLayout from "../legal-layout"
import { Scale } from "lucide-react"

export default function TermsOfService() {
    return (
        <LegalLayout title="Terms of Service" icon={Scale}>
            <div className="space-y-8 text-slate-600 leading-relaxed">
                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h3>
                    <p>
                        By accessing or using HazLabel ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">2. Description of Service</h3>
                    <p>
                        HazLabel provides an AI-powered platform for Safety Data Sheet (SDS) data extraction and GHS-compliant label generation. The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">3. User Accounts</h3>
                    <p>
                        You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree to provide accurate and complete information when creating an account.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">4. Usage Responsibilities & AI Accuracy</h3>
                    <p>
                        HazLabel uses automated systems to process safety information. You acknowledge that:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>The Service may contain errors, inaccuracies, or "hallucinations."</li>
                        <li>You are solely responsible for verifying the accuracy of all generated labels.</li>
                        <li>HazLabel is not a substitute for professional legal or safety advice.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">5. Intellectual Property</h3>
                    <p>
                        The Service and its original content, features, and functionality are and will remain the exclusive property of HazLabel and its licensors.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">6. Termination</h3>
                    <p>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">7. Indemnification</h3>
                    <p>
                        You agree to defend, indemnify, and hold harmless HazLabel and its licensee and licensors, and their employees, contractors, agents, officers, and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses resulting from or arising out of your use of the Service or breach of these Terms.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">8. Limitation of Liability</h3>
                    <p>
                        In no event shall HazLabel, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">9. Changes</h3>
                    <p>
                        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                    </p>
                </section>
            </div>
        </LegalLayout>
    )
}
