import LegalLayout from "../legal-layout"
import { ShieldCheck } from "lucide-react"

export default function PrivacyPolicy() {
    return (
        <LegalLayout title="Privacy Policy" icon={ShieldCheck}>
            <div className="space-y-8 text-slate-600 leading-relaxed">
                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">1. Data Collection</h3>
                    <p>
                        HazLabel collects information you provide directly to us when you create an account, upload documents (SDS), and communicate with us. This includes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Identity Data: Name, email address, organization.</li>
                        <li>Professional Data: Chemical names, hazard profiles, safety documentation.</li>
                        <li>Usage Data: Log data, IP addresses, browser types.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">2. Use of Data</h3>
                    <p>
                        We use the collected data for:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Providing and maintaining our Service.</li>
                        <li>Processing uploaded SDS files via AI models (LLMs).</li>
                        <li>Developing and improving our extraction logic.</li>
                        <li>Communicating updates and providing support.</li>
                    </ul>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">3. Data Security</h3>
                    <p>
                        We implement enterprise-grade security measures to protect your data. All documents are stored in encrypted environments and processed securely. However, no method of transmission over the Internet or electronic storage is 100% secure.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">4. Third-Party Services</h3>
                    <p>
                        We utilize verified third-party providers for critical infrastructure:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li><strong>Supabase:</strong> For authentication and secure database management.</li>
                        <li><strong>Inngest:</strong> For background processing of safety documents.</li>
                        <li><strong>AI Providers:</strong> For data extraction and validation.</li>
                    </ul>
                    <p className="mt-4">
                        We do not sell your personal or professional chemical data to third parties for marketing purposes.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">5. Document Retention</h3>
                    <p>
                        Documents you upload (SDS) are retained as long as your account is active to provide you with inventory access. You can request the deletion of your account and associated data at any time via settings.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">6. Cookies</h3>
                    <p>
                        We use cookies to maintain your session and improve user experience. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">7. Changes to This Policy</h3>
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                    </p>
                </section>

                <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">8. Contact Us</h3>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at support@hazlabel.co.
                    </p>
                </section>
            </div>
        </LegalLayout>
    )
}
