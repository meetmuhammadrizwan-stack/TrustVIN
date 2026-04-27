import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="pt-32 pb-24 px-6 min-h-[80vh] bg-slate-50"
    >
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
        
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-black text-brand-accent hover:text-brand-accent-hover transition-colors uppercase tracking-widest mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-brand-accent rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-brand-accent/20">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
              Privacy Policy
            </h1>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">
              Last modified on June 20, 2013
            </p>
          </div>
        </div>

        <div className="prose prose-slate prose-lg max-w-none text-slate-600 space-y-8">
          
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">What information do we collect?</h2>
            <p>
              We collect information when you register on our page, place an order, participate in surveys, fill out forms, or subscribe to the newsletter.
            </p>
            <p>
              When placing an order or registering on our website, we may ask for relevant information, including your email address, name, mailing address, phone number, and/or credit card details. Alternatively, you can choose to visit our site anonymously.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">How do we use your information?</h2>
            <p>We may utilize the collected information in one or more of the following ways:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Creating a personalized experience:</strong> Your information helps us tailor our responses to individual needs.</li>
              <li><strong>Enhancing our website:</strong> We constantly strive to improve our website offerings based on the information and feedback we receive from you.</li>
              <li><strong>Promoting customer service:</strong> Your information enables us to respond more effectively to your support needs or customer service requests.</li>
              <li><strong>Completing transaction processing:</strong> Your private and public information will not be transferred, exchanged, sold, or given to an external company without your consent, except for providing the requested service or product.</li>
              <li><strong>Administering site features:</strong> This includes surveys, promotions, contests, and sending emails related to your orders, updates, company news, and other relevant information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">How do we protect the information you provide?</h2>
            <p>
              We employ various security measures to keep your personal information secure when you access, submit, or enter it during order placement. Our secure server uses Secure Socket Layer (SSL) technology to encrypt sensitive information transmitted to our provider's database. After a transaction, no private information is stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Are cookies used?</h2>
            <p>
              Yes, we use cookies to enhance your browsing experience. These small files are transferred to your computer's hard drive, allowing our site or service provider's system to recognize your browser and remember certain information. Cookies help us understand and save your preferences for future visits, as well as compile aggregate data for site improvement. Third-party service providers may assist us in analyzing visitor information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Is information disclosed to outside parties?</h2>
            <p>
              We do not transfer, sell, or trade personally identifiable information to external parties, excluding trusted third parties assisting in website operations or providing services. Non-personally identifiable visitor information may be shared with outside parties for purposes like advertising and marketing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Third-Party Links on Our Site</h2>
            <p>
              We may include links or products from third parties on our site, each with its own independent privacy policy. We are not liable for the content or activities of linked sites, but we prioritize protecting our site integrity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">California Online Privacy Protection Act Compliance</h2>
            <p>
              We comply with the California Online Privacy Protection Act, ensuring personal information is not distributed to external parties without explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Do Not Track Requests</h2>
            <p>We do not respond to Do Not Track requests.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Children's Online Privacy Protection Act Compliance; Minor's Right to Deletion</h2>
            <p>
              In compliance with COPPA, we do not collect information from anyone under 13 years old. Minors may request information deletion by contacting us at <strong>trustedvin@gmail.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Consult Terms and Conditions</h2>
            <p>
              Please review our Terms and Conditions for limitations, disclaimers, and liability related to using our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Providing Your Consent</h2>
            <p>
              Using our website implies consent to our privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Adjustments to our Privacy Policy</h2>
            <p>
              Any changes to the privacy policy will be posted on the page and/or updated with the modification date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Contact Information</h2>
            <p>
              For questions about the privacy policy, contact us at:
              <br />
              <strong>Email:</strong> trustedvin@gmail.com
              <br />
              <strong>Phone:</strong> +13462966970
            </p>
          </section>

        </div>
      </div>
    </motion.div>
  );
}
