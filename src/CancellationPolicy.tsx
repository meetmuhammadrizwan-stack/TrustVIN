import React from "react";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface CancellationPolicyProps {
  onBack: () => void;
}

export default function CancellationPolicy({ onBack }: CancellationPolicyProps) {
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
          className="flex items-center gap-2 text-sm font-black text-brand-accent hover:text-brand-accent-hover transition-colors uppercase tracking-widest mb-10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-10">
          <img
            src="/allvinreport.jpeg"
            alt="AllVinReport Logo"
            className="h-16 w-auto object-contain shadow-xl shadow-brand-accent/20"
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
              Cancellation Policy
            </h1>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2">
              Last Updated: November 14, 2026
            </p>
          </div>
        </div>

        <div className="prose prose-slate prose-lg max-w-none text-slate-600 space-y-8">
          <p className="text-base md:text-lg leading-relaxed">
            At ALL VIN REPORT, we strive to process and deliver vehicle history reports as quickly as possible. Because our products are digital services that involve immediate processing, third-party data retrieval, report generation, and electronic delivery, cancellation requests are subject to the conditions outlined below.
          </p>

          <p className="text-base md:text-lg leading-relaxed font-semibold text-slate-800">
            By placing an order on our website, you acknowledge and agree to this Cancellation Policy.
          </p>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              1. Cancellation Before Order Processing
            </h2>
            <p>
              Customers may request cancellation of an order before the report generation process has started.
            </p>
            <p className="mt-3">
              To request cancellation, customers must contact our customer support team and provide their order details, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Full Name</li>
              <li>Email Address Used During Purchase</li>
              <li>Order ID (if available)</li>
              <li>Vehicle Identification Number (VIN)</li>
              <li>Reason for Cancellation</li>
            </ul>
            <p className="mt-4">
              Cancellation requests will be reviewed based on the current processing status of the order.
            </p>
            <p className="mt-2">
              Approval of a cancellation request is not automatic and is subject to verification that the order has not entered processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              2. Orders Already in Processing
            </h2>
            <p>
              Once an order has entered the report generation or processing stage, it can no longer be cancelled.
            </p>
            <p className="mt-3">
              Our report generation process may involve retrieving, compiling, and processing vehicle information from independent databases and third-party data providers. These operations may begin shortly after payment confirmation.
            </p>
            <p className="mt-3">
              Therefore, submitting a cancellation request after processing has started does not guarantee that the order can be stopped.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              3. Completed and Delivered Orders
            </h2>
            <p>
              Once a vehicle history report has been generated and made available to the customer through email, a secure download link, or the customer's account, the order is considered fulfilled.
            </p>
            <p className="mt-3">
              After fulfillment:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>The order cannot be cancelled.</li>
              <li>The digital report cannot be recalled or withdrawn.</li>
              <li>A request to cancel an already fulfilled order will not be accepted.</li>
              <li>Any refund request will be evaluated separately under our Refund Policy.</li>
            </ul>
            <p className="mt-4">
              A report is considered delivered once access has been successfully provided, regardless of whether the customer subsequently opens, views, or downloads the report.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              4. Incorrect Order Information
            </h2>
            <p>
              Customers are responsible for reviewing their order information before completing payment, particularly the Vehicle Identification Number (VIN) and email address.
            </p>
            <p className="mt-3">
              If incorrect information is submitted, customers should contact our support team immediately.
            </p>
            <p className="mt-3">
              If the order has not entered processing, we may be able to correct the information or approve cancellation.
            </p>
            <p className="mt-3">
              However, once processing has started or the report has been generated, cancellation or modification may no longer be possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              5. Orders We Are Unable to Fulfill
            </h2>
            <p>
              In certain circumstances, ALL VIN REPORT may be unable to process an order due to technical problems, data provider availability, payment verification issues, or other operational limitations.
            </p>
            <p className="mt-3">
              If we determine that an order cannot be fulfilled, we reserve the right to cancel the order and issue an applicable refund in accordance with our Refund Policy.
            </p>
            <p className="mt-3">
              Customers will be notified using the email address provided at checkout.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              6. Cancellation and Refunds Are Separate
            </h2>
            <p>
              Cancellation and refunds are two separate processes.
            </p>
            <p className="mt-3">
              Cancellation determines whether an order can be stopped before fulfillment.
            </p>
            <p className="mt-3">
              Refund eligibility determines whether a customer qualifies to receive money back under our Refund Policy.
            </p>
            <p className="mt-3">
              A cancellation request does not automatically constitute a refund approval. Similarly, the submission of a refund request does not automatically cancel an order that has already been processed or delivered.
            </p>
            <p className="mt-3">
              For complete information regarding refund eligibility, deadlines, and applicable conditions, please review our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              7. How to Submit a Cancellation Request
            </h2>
            <p>
              To submit a cancellation request, please contact our customer support team through the contact information provided on our website.
            </p>
            <p className="mt-3">
              Please include your order ID, registered email address, VIN, and reason for requesting cancellation.
            </p>
            <p className="mt-3">
              Our support team will review your request and respond based on the current status of your order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              8. Policy Updates
            </h2>
            <p>
              ALL VIN REPORT reserves the right to update or modify this Cancellation Policy when necessary. Any changes will be published on this page, and the updated policy will apply as permitted by applicable law.
            </p>
            <p className="mt-3">
              We encourage customers to review this policy before placing an order.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              9. Contact Information
            </h2>
            <p>
              For questions regarding order cancellations, please contact our customer support team through the contact details available on our website:
            </p>
            <p className="mt-4">
              <strong>Website:</strong>{" "}
              <a
                href="https://www.allvinreport.com/"
                className="text-brand-accent hover:underline font-bold"
              >
                https://www.allvinreport.com/
              </a>
              <br />
              <strong>Address:</strong> 14402 W Bellfort Street Sugar Land, Texas 77498, USA
              <br />
              <strong>Phone:</strong> +1 346 296697
              <br />
              <strong>Email:</strong> allvinreport@gmail.com
            </p>
          </section>

          <p className="pt-6 border-t border-slate-100 text-sm font-semibold text-slate-500">
            By completing a purchase, you acknowledge that you have read and understood this Cancellation Policy.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

