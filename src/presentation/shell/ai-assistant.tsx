import * as React from 'react';

interface Message {
  readonly id: number;
  readonly from: 'user' | 'assistant';
  readonly text: string;
}

interface Props {
  readonly signedIn: boolean;
}

function reply(question: string, signedIn: boolean): string {
  const q = question.toLowerCase();
  if (/approve|send|book|confirm/.test(q)) {
    return 'I never approve, send or book anything. People approve offers, messages and booking commitments in Approvals.';
  }
  if (/calculator|diagnostic|gain|revenue|roi|profit/.test(q)) {
    return 'The Growth Diagnostic at /growth-diagnostic compares your weekly bottom line with and without the service. Every formula and assumption is visible and editable, and results are illustrative estimates.';
  }
  if (/contact|demo|talk|price|pricing|subscribe/.test(q)) {
    return 'The best next step is Contact us at /contact-us. A person reviews every request before replying.';
  }
  if (/event|organizer|organiser/.test(q)) {
    return signedIn
      ? 'Event Sourcing keeps the registry of upcoming events and organizers, and the Network Map shows the same records. Attendance is not proof of dining demand.'
      : 'FullTable AI keeps a registry of upcoming local events and organizers and matches them to your quiet hours. Attendance is never treated as proof of dining demand.';
  }
  if (/map|nearby/.test(q)) {
    return signedIn
      ? 'Open Network Map for nearby verified groups and events. What you see depends on your subscription tier.'
      : 'Signed-in restaurants get a map of nearby verified groups and events, with layers that depend on the subscription tier.';
  }
  if (/staff|schedule|inventory|waste|portion/.test(q)) {
    return signedIn
      ? 'Staff Scheduling and Inventory & Waste turn expected guests into staffing and purchasing recommendations that a manager or chef approves.'
      : 'FullTable AI also helps match staffing to demand and reduce food waste. The Growth Diagnostic shows how those add up.';
  }
  return signedIn
    ? 'I can explain screens and insights you are allowed to see. Try asking about events, the map, staffing or waste. A language model is not connected yet, so my answers are limited.'
    : 'FullTable AI turns slow periods into recurring group bookings. Ask about the calculator, events or how to get in touch. A language model is not connected yet, so my answers are limited.';
}

export function AiAssistant({ signedIn }: Props): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [messages, setMessages] = React.useState<readonly Message[]>([
    {
      id: 0,
      from: 'assistant',
      text: signedIn
        ? 'Hi. I can help you find information and understand insights you have access to. I never approve or send anything.'
        : 'Hi. Ask me about FullTable AI, the revenue calculator or how to reach us.',
    },
  ]);

  const send = React.useCallback(() => {
    const text = draft.trim();
    if (text.length === 0) return;
    setMessages((m) => [
      ...m,
      { id: m.length, from: 'user', text },
      { id: m.length + 1, from: 'assistant', text: reply(text, signedIn) },
    ]);
    setDraft('');
  }, [draft, signedIn]);

  return (
    <div data-vid="g0uznrn" className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <section data-vid="i1mnde2" aria-label="AI Assistant" className="flex h-96 w-80 max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-border bg-background shadow-lg">
          <header data-vid="eaj3y7j" className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 data-vid="s2qnmwr" className="type-row-title text-foreground">AI Assistant</h2>
            <button data-vid="ixw6aho" type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="min-h-11 min-w-11 type-body text-text-muted">
              Close
            </button>
          </header>
          <ul data-vid="9hq3ief" className="flex flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
            {messages.map((m) => (
              <li data-vid="bq6ftcz"
                key={m.id}
                className={'max-w-[85%] rounded-md px-3 py-2 type-body ' + (m.from === 'user' ? 'self-end bg-primary text-primary-foreground' : 'self-start bg-muted text-foreground')}
              >
                {m.text}
              </li>
            ))}
          </ul>
          <form data-vid="egkdbhs"
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input data-vid="nz98if7"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Message"
              placeholder="Ask a question"
              className="min-h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-3 type-body text-foreground"
            />
            <button data-vid="wpqazsr" type="submit" className="min-h-11 rounded-md bg-primary px-3 type-body text-primary-foreground">Send</button>
          </form>
        </section>
      )}
      <button data-vid="t6u3c1p"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="min-h-11 rounded-full bg-primary px-5 type-body text-primary-foreground shadow-lg"
      >
        {open ? 'Hide assistant' : 'Ask the assistant'}
      </button>
    </div>
  );
}
