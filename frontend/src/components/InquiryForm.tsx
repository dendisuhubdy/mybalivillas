'use client';

import { useState } from 'react';
import { submitInquiry } from '@/lib/api';

interface InquiryFormProps {
  propertyId: string;
  propertyTitle: string;
  agentName?: string;
}

export default function InquiryForm({
  propertyId,
  propertyTitle,
  agentName,
}: InquiryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Hi, I am interested in "${propertyTitle}". Please provide more details.`,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');

    try {
      await submitInquiry(propertyId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });
      setStatus('success');
      setStatusMessage(
        'Your inquiry has been sent successfully! The agent will contact you shortly.'
      );
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      setStatus('error');
      setStatusMessage(
        'Failed to send inquiry. Please try again or contact us directly.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-900">
        Inquire About This Property
      </h3>
      {agentName && (
        <p className="mt-1 text-sm text-gray-500">
          Contact {agentName} for more information
        </p>
      )}

      {/* Status Messages */}
      {status === 'success' && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm text-green-700">{statusMessage}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-700">{statusMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="inquiry-name" className="label-field">
            Full Name *
          </label>
          <input
            id="inquiry-name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="inquiry-email" className="label-field">
            Email Address *
          </label>
          <input
            id="inquiry-email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="inquiry-phone" className="label-field">
            Phone Number
          </label>
          <input
            id="inquiry-phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+62 812 3456 7890"
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="inquiry-message" className="label-field">
            Message *
          </label>
          <textarea
            id="inquiry-message"
            name="message"
            required
            rows={4}
            value={formData.message}
            onChange={handleChange}
            placeholder="Your message..."
            className="input-field resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
              Send Inquiry
            </span>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          By submitting, you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>

      {/* Quick Contact */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
          Or contact directly
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          <a
            href="tel:+6281234567890"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Call Agent
          </a>
        </div>
      </div>
    </div>
  );
}
