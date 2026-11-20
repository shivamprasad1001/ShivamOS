import React, { useState } from 'react';
import { SITE_META, SYSTEM_CHROME_COPY } from '../../../data/content';
import { useWindowStore } from '../../store/windowStore';

export function ContactWindow() {
  const sentMessages = useWindowStore((s) => s.sentMessages);
  const addSentMessage = useWindowStore((s) => s.addSentMessage);
  const pushToast = useWindowStore((s) => s.pushToast);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    pushToast(SYSTEM_CHROME_COPY.toasts.copiedToClipboard);
  };

  const handleCopyEmail = () => {
    copyToClipboard(SITE_META.email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMsg = message.trim();

    if (!cleanName || !cleanEmail || !cleanMsg) {
      setError('Please complete your name, email address, and message before sending.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    addSentMessage({ name: cleanName, email: cleanEmail, message: cleanMsg });
    pushToast(SYSTEM_CHROME_COPY.toasts.noteQueued);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 text-xs">
      {/* Direct Channels */}
      <div className="border-2 border-[#1A1A1A] bg-[#E8E0C8] divide-y-2 divide-[#1A1A1A]">
        {SITE_META.email && (
          <div className="p-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold text-[#4A463B]">Direct Email</div>
              <a
                href={`mailto:${SITE_META.email}`}
                className="font-bold text-[#1A1A1A] underline hover:text-[#E4572E]"
              >
                {SITE_META.email}
              </a>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="os-btn px-3 py-1 text-xs font-bold whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy Email'}
            </button>
          </div>
        )}

        <div className="p-3 flex flex-wrap items-center justify-between gap-3 bg-[#F4EFE0]">
          <div>
            <span className="font-bold">Location: </span>
            <span>{SITE_META.location}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SITE_META.websiteUrl && (
              <>
                <a
                  href={SITE_META.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-[#2A9D8F]"
                >
                  {SITE_META.websiteLabel} ↗
                </a>
                <span aria-hidden="true">·</span>
              </>
            )}
            <a
              href={SITE_META.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:text-[#2A9D8F]"
            >
              GitHub ↗
            </a>
            <span aria-hidden="true">·</span>
            <a
              href={SITE_META.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline hover:text-[#2A9D8F]"
            >
              LinkedIn ↗
            </a>
            <button
              type="button"
              data-testid="copy-github-btn"
              onClick={() => copyToClipboard(SITE_META.githubUrl)}
              className="os-btn px-2 py-0.5 text-[11px] font-bold whitespace-nowrap"
            >
              Copy GitHub
            </button>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#E8E0C8] text-[#1A1A1A] flex flex-wrap justify-between gap-2">
          <div>
            <span className="font-bold">Availability: </span>
            <span>{SITE_META.availability}</span>
          </div>
          <div>
            <span className="font-bold">Languages: </span>
            <span>{SITE_META.languages}</span>
          </div>
        </div>
      </div>

      {/* Retro Mail Composer */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3 border-2 border-[#1A1A1A] p-4 bg-[#F4EFE0]">
        <h3
          className="text-xs font-bold m-0 border-b-2 border-[#1A1A1A] pb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Compose Note to {SITE_META.ownerName}
        </h3>

        {error && (
          <div
            role="alert"
            className="border-2 border-[#1A1A1A] bg-[#E4572E] text-[#F4EFE0] px-3 py-2 font-semibold"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="contact-name" className="block font-bold">
              Your Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Mehta"
              className="w-full border-2 border-[#1A1A1A] bg-[#E8E0C8] px-2.5 py-1.5 text-xs text-[#1A1A1A]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="contact-email" className="block font-bold">
              Email Address
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full border-2 border-[#1A1A1A] bg-[#E8E0C8] px-2.5 py-1.5 text-xs text-[#1A1A1A]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="contact-message" className="block font-bold">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Role details, project question, or ML problem you want to discuss..."
            className="w-full border-2 border-[#1A1A1A] bg-[#E8E0C8] px-2.5 py-1.5 text-xs text-[#1A1A1A] resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-[#4A463B]">
            Logs locally in Outbox; use direct email above for immediate inbox delivery.
          </span>
          <button
            type="submit"
            className="os-btn os-btn-primary px-4 py-1.5 text-xs font-bold whitespace-nowrap"
          >
            Send Note
          </button>
        </div>
      </form>

      {/* Sent Outbox */}
      {sentMessages.length > 0 && (
        <section className="border-2 border-[#1A1A1A] bg-[#E8E0C8] p-3 space-y-2">
          <h4 className="text-xs font-bold m-0 text-[#2A9D8F]">
            Outbox ({sentMessages.length} queued)
          </h4>
          <div className="space-y-2">
            {sentMessages.map((entry) => (
              <div
                key={entry.id}
                className="border-2 border-[#1A1A1A] bg-[#F4EFE0] p-2.5 space-y-1"
              >
                <div className="flex justify-between gap-2 font-bold">
                  <span>
                    {entry.name} &lt;{entry.email}&gt;
                  </span>
                  <span className="tabular-nums text-[#4A463B]">{entry.sentAt}</span>
                </div>
                <p className="m-0 text-[#1A1A1A]">{entry.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
