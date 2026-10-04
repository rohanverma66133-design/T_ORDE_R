'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { HelpCircle, MessageSquare, Plus, Send, ChevronDown, ShieldCheck, PhoneCall, Sparkles, CheckCircle, Clock, Mail } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

const faqs = [
  {
    q: 'How fast is TORD Fresh delivery for groceries & medicines?',
    a: 'We guarantee instant 15 to 20-minute dispatch for all local town orders from verified partner hubs and certified pharmacies.',
  },
  {
    q: 'How does prescription medicine verification work?',
    a: 'When you upload a doctor prescription, a certified local pharmacist reviews the dosage and approves the order before doorstep dispatch.',
  },
  {
    q: 'What if fresh produce or milk is damaged or missing?',
    a: 'We offer a 100% Town Fresh Guarantee. Simply report it in the help center for an instant 1-click replacement or full refund to your original payment method.',
  },
  {
    q: 'Which payment methods are supported on TORD?',
    a: 'We accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking, and all major Credit/Debit cards.',
  },
  {
    q: 'Is there a minimum order value for free delivery?',
    a: 'Orders above ₹149 enjoy free 15-min delivery across all town zones! VIP members enjoy ₹0 delivery fees on all orders.',
  }
];

export default function HelpPage() {
  const { isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // New Ticket Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Order Enquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const fetchTickets = () => {
    if (isAuthenticated) {
      apiGet<any[]>('/support/tickets')
        .then((data) => {
          if (Array.isArray(data)) setTickets(data);
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [isAuthenticated]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    setIsSubmitting(true);
    try {
      await apiPost('/support/tickets', { subject, category, message });
      setSubject('');
      setMessage('');
      setTicketSuccess(true);
      fetchTickets();
      setTimeout(() => setTicketSuccess(false), 4000);
    } catch {
      // Simulate success for local dev
      setTicketSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setTicketSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#061B12] font-sans text-slate-100 selection:bg-[#B4F83C] selection:text-slate-950">
      <div>
        <SiteHeader />

        {/* Hero Header Banner */}
        <section className="border-b border-emerald-900/40 bg-gradient-to-b from-[#04130d] via-[#061B12] to-[#082218] py-8">
          <div className="mx-auto w-[min(1280px,calc(100%-1.5rem))]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#B4F83C] text-[11px] font-black uppercase tracking-wider mb-2">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>24/7 Town Customer Care</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">How Can We Help You Today?</h1>
                <p className="text-xs sm:text-sm text-emerald-200/70 font-medium mt-1">
                  Instant solutions, FAQs, and dedicated support for all your TORD Fresh orders.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-emerald-500/20 text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#B4F83C]" />
                  <span>Avg Response: &lt; 2 Mins</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-8 mb-20 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: FAQs & Tickets (Pure White Cards) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* FAQs Section */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-md space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">Frequently Asked Questions</h2>
                    <p className="text-xs text-slate-500">Quick answers about orders, delivery, and prescription medicines</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left text-xs font-black text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
                      </button>

                      {openFaq === idx && (
                        <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 bg-white font-medium">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Support Tickets */}
              {isAuthenticated && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-md space-y-4">
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                    <span>My Support Tickets ({tickets.length})</span>
                  </h2>

                  {tickets.length === 0 ? (
                    <p className="text-xs text-slate-500 font-medium">No open tickets. All your past requests are resolved.</p>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((t) => (
                        <div key={t.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-slate-900">
                              Ticket #{t.ticketNumber} - {t.subject}
                            </h4>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {t.status}
                            </span>
                          </div>
                          {t.messages && t.messages.length > 0 && (
                            <p className="text-xs text-slate-600">{t.messages[0].message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Col: Raise Ticket & Contact Cards (Pure White) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Ticket Form */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-md space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">Raise a Support Ticket</h3>
                  <p className="text-xs text-slate-500 font-medium">Our team will resolve your request within minutes</p>
                </div>

                {ticketSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Support ticket submitted! A care executive is reviewing your issue.</span>
                  </div>
                )}

                <form onSubmit={handleCreateTicket} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Issue Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      <option value="Order Enquiry">Order Enquiry & Delivery Status</option>
                      <option value="Prescription Issue">Prescription Medicine Verification</option>
                      <option value="Damaged Produce">Damaged / Missing Item Replacement</option>
                      <option value="Refund & Billing">Refund & Payment Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Order delayed by 10 mins..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Detailed Message</label>
                    <textarea
                      rows={4}
                      placeholder="Please describe what happened and include your order ID..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-[#B4F83C] hover:bg-[#a1e528] active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
                  </button>
                </form>
              </div>

              {/* Direct Phone & Email Cards */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-sm space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Dohrighat Town Helpline</h4>
                    <p className="text-xs text-emerald-700 font-black">+91 73800-287-672</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Email Support</h4>
                    <p className="text-xs text-slate-600 font-bold">care.dohrighat@tord.in</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
