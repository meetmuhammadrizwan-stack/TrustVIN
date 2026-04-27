import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { CheckCircle2, XCircle } from "lucide-react";

interface CheckoutFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
}

export default function CheckoutForm({ onSuccess, onCancel, amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required"
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setMessage("Payment succeeded!");
      setIsLoading(false);
      onSuccess();
    } else {
      setMessage("Something went wrong.");
      setIsLoading(false);
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      
      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${message.includes("succeeded") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {message.includes("succeeded") ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          className="flex-1 py-4 bg-brand-accent text-white rounded-xl font-bold hover:bg-brand-accent-hover transition-colors disabled:opacity-50"
        >
          <span id="button-text">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : `Pay $${(amount / 100).toFixed(2)}`}
          </span>
        </button>
      </div>
    </form>
  );
}
