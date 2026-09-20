import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../auth/authSlice';
import { Icon } from '../layout/icons';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

// Rule-based, not a real model call — same honesty as the mocked Resume
// Parser elsewhere in this app. Figures mirror the illustrative mock data in
// LeaveManagement.tsx / Payroll.tsx; there's no shared store to read them
// from live, so they're restated here.
const LEAVE_BALANCE = { vacation: 15, sick: 8, personal: 4 };
const NEXT_PAYSLIP = { period: 'June 2025', payDate: '5 July 2025' };
const HOLIDAYS = [
  { name: "New Year's Day", date: '1 January' },
  { name: 'Eid al-Fitr (approx.)', date: 'varies — lunar calendar' },
  { name: 'UAE National Day', date: '2 December' },
];

function respond(question: string, firstName: string): string {
  const q = question.toLowerCase();
  if (q.includes('leave') || q.includes('vacation') || q.includes('balance')) {
    return `You have ${LEAVE_BALANCE.vacation} vacation, ${LEAVE_BALANCE.sick} sick and ${LEAVE_BALANCE.personal} personal day(s) available, ${firstName}. Apply from Time & Attendance → Leave.`;
  }
  if (q.includes('payslip') || q.includes('salary') || q.includes('pay')) {
    return `Your next payslip is for ${NEXT_PAYSLIP.period}, payable on ${NEXT_PAYSLIP.payDate}. Past payslips are under Pay & Compensation → Payroll.`;
  }
  if (q.includes('holiday')) {
    return `Upcoming holidays: ${HOLIDAYS.map((h) => `${h.name} (${h.date})`).join(', ')}.`;
  }
  if (q.includes('policy') || q.includes('document') || q.includes('letter')) {
    return 'HR policies and letter templates live under People → Documents.';
  }
  if (q.includes('org') || q.includes('report') || q.includes('manager')) {
    return "Check People → Org Chart to see who reports to whom.";
  }
  return "I can help with leave balance, payslips, holidays and policy documents — try asking about one of those.";
}

export default function AIAssistant() {
  const user = useAppSelector(selectCurrentUser);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greeting', role: 'assistant', text: "Hi, I'm your HR Assistant. Ask me about leave balance, payslips, holidays or policies." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    const reply: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', text: respond(text, user?.name.split(' ')[0] ?? 'there') };
    setMessages((prev) => [...prev, userMsg, reply]);
    setDraft('');
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-ink-900 py-2.5 pl-3.5 pr-4 text-[13px] font-medium text-ivory-50 shadow-premium-lg transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          <Icon name="sparkles" className="h-4 w-4 text-gold-400" />
          Ask HR AI
          <span className="rounded-full bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">Beta</span>
        </button>
      )}

      {open && (
        <>
          <div
            className="no-print fixed inset-0 z-40 bg-ink-950/30 backdrop-blur-[1px] md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="no-print fixed inset-x-0 bottom-0 z-50 flex h-[min(560px,100vh)] flex-col border border-ivory-300 bg-white shadow-premium-lg sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96 sm:rounded-xl">
            <div className="flex items-center justify-between rounded-t-xl bg-ink-900 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Icon name="sparkles" className="h-4 w-4 text-gold-400" />
                <span className="text-[13.5px] font-medium text-ivory-50">HR Assistant</span>
                <span className="rounded-full bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">Beta</span>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-ivory-50/60 hover:bg-ink-800 hover:text-ivory-50" aria-label="Close">
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="custom-scrollbar flex-1 space-y-3 overflow-y-auto bg-ivory-50 px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.role === 'user' ? 'bg-ink-900 text-ivory-50' : 'border border-ivory-300 bg-white text-ink-900'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-ivory-200 p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about leave, payslips, holidays…"
                className="h-9 flex-1 rounded-lg border border-ivory-400 bg-white px-3 text-[13px] text-ink-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-100"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-ivory-50 transition-colors hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                aria-label="Send"
              >
                <Icon name="paperAirplane" className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
