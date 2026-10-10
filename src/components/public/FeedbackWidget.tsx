"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquarePlus, X } from "lucide-react";
import { submitFeedback } from "@/lib/api-client";

interface FeedbackWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackWidget({ isOpen, onClose }: FeedbackWidgetProps) {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !agreedToTerms) return;
    setSubmitting(true);
    setError("");
    try {
      await submitFeedback(message, name);
      setSubmitted(true);
      setMessage("");
      setName("");
      setAgreedToTerms(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setError("");
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={handleClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-tmt-navy flex items-center gap-2">
              <MessageSquarePlus size={22} className="text-tmt-orange" />
              Send Feedback
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
              <p className="font-semibold text-tmt-navy mb-1">Thank you!</p>
              <p className="text-sm text-gray-500">
                Your feedback has been sent anonymously to our editorial team.
              </p>
              <button
                onClick={handleClose}
                className="mt-5 px-5 py-2 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500">
                Feedback is submitted anonymously — we won&apos;t know who sent it unless
                you choose to share your name.
              </p>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-tmt-navy mb-1.5">
                  Your Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind…"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-tmt-navy mb-1.5">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors"
                />
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-tmt-orange focus:ring-tmt-orange"
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="underline text-tmt-orange hover:text-tmt-orange-light"
                  >
                    Terms and Conditions
                  </Link>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || !agreedToTerms}
                className="w-full py-3 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light disabled:opacity-50 text-white font-semibold transition-colors"
              >
                {submitting ? "Sending…" : "Send Feedback"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
