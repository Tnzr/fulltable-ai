import * as React from 'react';
import { EventSourcingView, type EventTab } from '../views/event-sourcing.view';

export default function EventSourcingContainer(): React.ReactElement {
  const [tab, setTab] = React.useState<EventTab>('events');
  const [link, setLink] = React.useState('');
  const [notice, setNotice] = React.useState<string | null>(null);

  const submit = React.useCallback(() => {
    if (link.trim().length === 0) {
      setNotice('Paste a link first.');
      return;
    }
    setNotice('Link received as a sample. It is marked unverified and cannot be used for outreach until a person verifies it.');
    setLink('');
  }, [link]);

  return (
    <EventSourcingView data-vid="nh9yh05"
      tab={tab}
      onTab={setTab}
      linkValue={link}
      onLinkChange={setLink}
      onLinkSubmit={submit}
      linkNotice={notice}
    />
  );
}
