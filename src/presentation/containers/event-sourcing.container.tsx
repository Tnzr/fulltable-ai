import * as React from 'react';
import { EventSourcingView, type EventTab } from '../views/event-sourcing.view';
import { setNetworkData, getDataMode, storeDataMode, useSampleRecords, type DataMode } from '@/lib/network-data';
import { useNetworkData } from '@/infrastructure/archie/use-network-data';
import { useLeadEngine, type LeadSource, type LeadRunLine } from '@/infrastructure/archie/use-lead-engine';

export default function EventSourcingContainer(): React.ReactElement {
  const [tab, setTab] = React.useState<EventTab>('events');
  const [link, setLink] = React.useState('');
  const [notice, setNotice] = React.useState<string | null>(null);
  const engine = useLeadEngine();
  const network = useNetworkData();
  const [, setVersion] = React.useState(0);
  const [mode, setMode] = React.useState<DataMode>(getDataMode);
  const refresh = React.useCallback(() => {
    if (mode === 'sample') {
      useSampleRecords();
      setVersion((v) => v + 1);
      return;
    }
    void network.load('real').then((data) => {
      if (data === null) return;
      setNetworkData(data.events, data.organizers);
      setVersion((v) => v + 1);
    });
  }, [network, mode]);
  const changeMode = React.useCallback((next: DataMode) => {
    storeDataMode(next);
    setMode(next);
  }, []);
  React.useEffect(() => {
    refresh();
  }, [refresh]);
  const [sources, setSources] = React.useState<readonly LeadSource[]>([]);
  const [picked, setPicked] = React.useState<readonly string[]>([]);
  const [maxListings, setMaxListings] = React.useState(25);
  const [radius, setRadius] = React.useState(5);
  const [running, setRunning] = React.useState(false);
  const [lines, setLines] = React.useState<readonly LeadRunLine[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    void engine.loadSources().then((list) => {
      if (alive) setSources(list);
    });
    return () => {
      alive = false;
    };
  }, [engine]);

  const submit = React.useCallback(() => {
    if (link.trim().length === 0) {
      setNotice('Paste a link first.');
      return;
    }
    void engine.addLink(link.trim()).then((err) => {
      if (err !== null) {
        setNotice(err);
        return;
      }
      setNotice('Link saved to the events registry as unverified. It cannot be used for outreach until a person verifies it.');
      setLink('');
      refresh();
    });
  }, [link, engine, refresh]);

  const toggle = React.useCallback((id: string) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }, []);

  const run = React.useCallback(() => {
    const chosen = sources.filter((s) => picked.includes(s.id) && s.committed);
    if (chosen.length === 0) {
      setMessage('Tick at least one cleared source.');
      return;
    }
    setRunning(true);
    setMessage(null);
    setLines([]);
    void engine
      .run(chosen, Math.max(1, maxListings))
      .then((result) => {
        setLines(result);
        refresh();
        const total = result.reduce((n, l) => n + l.events, 0);
        setMessage('Run finished: ' + total + ' events found (limit ' + maxListings + '). The radius of ' + radius + ' miles is applied when events are matched to your restaurant.');
      })
      .catch(() => setMessage('The run failed. Nothing was changed by this click.'))
      .finally(() => setRunning(false));
  }, [engine, sources, picked, maxListings, radius, refresh]);

  return (
    <EventSourcingView data-vid="nh9yh05"
      tab={tab}
      onTab={setTab}
      linkValue={link}
      onLinkChange={setLink}
      onLinkSubmit={submit}
      linkNotice={notice}
      dataMode={mode}
      onDataMode={changeMode}
      engine={{
        sources: sources.map((s) => ({ ...s, selected: picked.includes(s.id) })),
        maxListings,
        radius,
        running,
        lines,
        message,
        onToggle: toggle,
        onMax: setMaxListings,
        onRadius: setRadius,
        onRun: run,
      }}
    />
  );
}
