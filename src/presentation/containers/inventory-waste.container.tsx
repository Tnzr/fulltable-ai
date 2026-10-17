import * as React from 'react';
import {
  InventoryWasteView,
  type InvMeasure,
  type InvOccurrence,
  type InvRecommendation,
  type InvWasteEntry,
} from '../views/inventory-waste.view';

const OCCURRENCES: readonly InvOccurrence[] = [
  { id: 'o1', title: 'Sailing club regatta dinner', date: 'Nov 17', guests: 120 },
  { id: 'o2', title: 'Brickell tech meetup', date: 'Nov 19', guests: 60 },
  { id: 'o3', title: 'Business council breakfast', date: 'Jan 14', guests: 80 },
];

interface Recipe {
  readonly id: string;
  readonly item: string;
  readonly share: number;
  readonly usable: number;
  readonly unitCost: number;
}

const RECIPES: readonly Recipe[] = [
  { id: 'chicken', item: 'Roast chicken', share: 0.34, usable: 12, unitCost: 4.5 },
  { id: 'fish', item: 'Grilled snapper', share: 0.28, usable: 10, unitCost: 7.25 },
  { id: 'veg', item: 'Vegetable paella', share: 0.22, usable: 15, unitCost: 3.1 },
  { id: 'dessert', item: 'Key lime tart', share: 0.6, usable: 20, unitCost: 1.9 },
];

const BUFFER = 1.1;

const WASTE_SEED: readonly InvWasteEntry[] = [
  { id: 'w1', item: 'Roast chicken', portions: 6, reason: 'Over-prepped', cost: '$27.00' },
  { id: 'w2', item: 'Key lime tart', portions: 4, reason: 'Spoiled', cost: '$7.60' },
];

function money(n: number): string {
  return '$' + n.toFixed(2);
}

export default function InventoryWasteContainer(): React.ReactElement {
  const [selectedId, setSelectedId] = React.useState(OCCURRENCES[0].id);
  const [guestOverride, setGuestOverride] = React.useState<Readonly<Record<string, number>>>({});
  const [approved, setApproved] = React.useState<ReadonlySet<string>>(new Set());
  const [waste, setWaste] = React.useState<readonly InvWasteEntry[]>(WASTE_SEED);
  const [wasteItem, setWasteItem] = React.useState(RECIPES[0].item);
  const [wastePortions, setWastePortions] = React.useState('1');
  const [wasteReason, setWasteReason] = React.useState('Over-prepped');
  const [notice, setNotice] = React.useState<string | null>(null);

  const occurrence = OCCURRENCES.find((o) => o.id === selectedId) ?? OCCURRENCES[0];
  const guests = guestOverride[occurrence.id] ?? occurrence.guests;

  const recommendations: readonly InvRecommendation[] = RECIPES.map((r) => {
    const portions = Math.ceil(guests * r.share);
    const prep = Math.ceil(portions * BUFFER);
    const key = occurrence.id + ':' + r.id;
    return {
      id: key,
      item: r.item,
      portions,
      prep,
      usable: r.usable,
      buy: Math.max(0, prep - r.usable),
      approved: approved.has(key + ':' + String(guests)),
    };
  });

  const onApprove = React.useCallback((id: string) => {
    setApproved((s) => new Set(s).add(id + ':' + String(guests)));
    setNotice('Quantity approved for the chef. Sample only: no order is placed and nothing is saved.');
  }, [guests]);

  const onGuests = React.useCallback((value: string) => {
    const n = Number(value);
    setGuestOverride((g) => ({ ...g, [occurrence.id]: Number.isFinite(n) && n >= 0 ? Math.round(n) : 0 }));
  }, [occurrence.id]);

  const onLogWaste = React.useCallback(() => {
    const portions = Math.round(Number(wastePortions));
    if (!Number.isFinite(portions) || portions <= 0) {
      setNotice('Enter how many portions were wasted.');
      return;
    }
    const recipe = RECIPES.find((r) => r.item === wasteItem) ?? RECIPES[0];
    setWaste((w) => [{ id: 'w' + String(w.length + 1), item: recipe.item, portions, reason: wasteReason, cost: money(portions * recipe.unitCost) }, ...w]);
    setNotice('Waste logged. Sample only: nothing is saved yet.');
  }, [wastePortions, wasteItem, wasteReason]);

  const wasteCost = waste.reduce((sum, w) => sum + Number(w.cost.replace('$', '')), 0);
  const measures: readonly InvMeasure[] = [
    { id: 'cost', label: 'Waste cost logged', value: money(wasteCost) },
    { id: 'portions', label: 'Portions wasted', value: String(waste.reduce((s, w) => s + w.portions, 0)) },
    { id: 'guest', label: 'Food cost per guest (sample)', value: '$8.40' },
  ];

  return (
    <InventoryWasteView
      occurrences={OCCURRENCES}
      selectedId={occurrence.id}
      onSelect={setSelectedId}
      guests={guests}
      onGuests={onGuests}
      recommendations={recommendations}
      onApprove={onApprove}
      items={RECIPES.map((r) => r.item)}
      wasteItem={wasteItem}
      wastePortions={wastePortions}
      wasteReason={wasteReason}
      onWasteItem={setWasteItem}
      onWastePortions={setWastePortions}
      onWasteReason={setWasteReason}
      onLogWaste={onLogWaste}
      waste={waste}
      measures={measures}
      notice={notice}
    />
  );
}
