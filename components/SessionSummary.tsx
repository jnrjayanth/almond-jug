'use client';

import {
  ALMOND_ML,
  ALMOND_SOURCES,
  MODEL_NOTE,
  ML_PER_GALLON,
  SOURCES,
  WATER_ML_PER_TOKEN,
  almondsFromMl,
  formatMl,
  MODEL_ID,
  type WaterRange,
} from '@/lib/water';

import dynamic from 'next/dynamic';

const Almond3D = dynamic(() => import('./Almond3D'), {
  ssr: false,
  loading: () => <div className="h-64" />,
});
type Totals = {
  queries: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export default function SessionSummary({
  totals,
  water,
  onReset,
  onBack,
}: {
  totals: Totals;
  water: WaterRange;
  onReset: () => void;
  onBack: () => void;
}) {
  const almondFraction = almondsFromMl(water.central, 'industry');
  const gallonFraction = water.central / ML_PER_GALLON;
  const perThousand = water.central * 1000;

  return (
    <div className="mx-auto w-full max-w-2xl overflow-y-auto py-10">
      <h2 className="text-2xl font-semibold tracking-tight">Session summary</h2>
      <p className="mt-1 text-sm text-gray-500">
        {totals.queries} {totals.queries === 1 ? 'query' : 'queries'} ·{' '}
        {totals.totalTokens.toLocaleString()} tokens
      </p>

      {/* Headline */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
             <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
        <Almond3D fillPercent={almondFraction * 100} />
        <div className="mt-4 text-center">
          <div className="text-5xl font-semibold tabular-nums">
            {(almondFraction * 100).toFixed(2)}%
          </div>
          <p className="mt-2 text-gray-600">of one California almond</p>
          <p className="mt-3 text-sm text-gray-500">
            {formatMl(water.central)} of water ·{' '}
            {(gallonFraction * 100).toFixed(2)}% of a one-gallon jug
          </p>
        </div>
      </div>
        <p className="mt-2 text-sm text-gray-500">
          estimated water, {(gallonFraction * 100).toFixed(2)}% of a one-gallon jug
        </p>
      </div>

      {/* Almond equivalent */}
      <section className="mt-8">
        <h3 className="font-medium">In California almonds</h3>
        <p className="mt-2 text-gray-700">
           This session used about{' '}
          <strong className="tabular-nums">
            {(almondFraction * 100).toFixed(2)}%
          </strong>{' '}
          of one almond.
        </p>
        <dl className="mt-4 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <dt>Almond Board of California (1.1 gal)</dt>
            <dd className="tabular-nums">
              {(almondsFromMl(water.central, 'industry') * 100).toFixed(2)}%
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Pacific Institute (1.65 gal)</dt>
            <dd className="tabular-nums">
              {(almondsFromMl(water.central, 'irrigation') * 100).toFixed(2)}%
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Fulton et al. full footprint (12 L)</dt>
            <dd className="tabular-nums">
              {(almondsFromMl(water.central, 'fullFootprint') * 100).toFixed(2)}%
            </dd>
          </div>
        </dl>
      </section>

      {/* Scale */}
      <section className="mt-8">
        <h3 className="font-medium">At scale</h3>
        <p className="mt-2 text-gray-700">
          One session is small. A thousand people having this same session would
          use about <strong>{formatMl(perThousand)}</strong>, or roughly{' '}
          <strong className="tabular-nums">
            {almondsFromMl(perThousand, 'industry').toFixed(0)}
          </strong>{' '}
          almonds&apos; worth of water.
        </p>
      </section>

      {/* Methodology */}
      <section className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-600">
        <h3 className="font-medium text-gray-900">How this was calculated</h3>
        <p className="mt-2">
          Token counts come from the model provider&apos;s own usage data for each
          reply. Water is modeled from those tokens, not measured. Published
          per-query estimates differ by orders of magnitude, mostly because of
          what they count: on-site data-centre cooling alone, or the water used
          generating the electricity too.
        </p>
        
        <p className="mt-3">
          Model: <code className="rounded bg-gray-100 px-1.5 py-0.5">{MODEL_ID}</code>
        </p>

        <p className="mt-4">
          The headline figure uses{' '}
          <strong className="text-gray-900">
            {(WATER_ML_PER_TOKEN.provider * 400).toFixed(0)} mL per 400 tokens
          </strong>
          , from Mistral AI&apos;s own lifecycle assessment, published with Carbone
          4 and ADEME and peer-reviewed by Resilio and Hubblo. It covers direct
          and indirect water and excludes the user&apos;s own device.
        </p>

        <h4 className="mt-5 font-medium text-gray-900">Range shown</h4>
        <ul className="mt-2 space-y-2">
          {(Object.keys(SOURCES) as Array<keyof typeof SOURCES>).map((k) => (
            <li key={k} className="flex flex-wrap justify-between gap-2">
              <span>{SOURCES[k]}</span>
              <span className="tabular-nums">
                {(WATER_ML_PER_TOKEN[k] * 400).toFixed(2)} mL / 400 tokens
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3">
          This session falls between {formatMl(water.low)} and{' '}
          {formatMl(water.high)} across those three scopes.
        </p>

        <h4 className="mt-5 font-medium text-gray-900">Almond figures</h4>
        <ul className="mt-2 space-y-2">
          {(Object.keys(ALMOND_SOURCES) as Array<keyof typeof ALMOND_SOURCES>).map(
            (k) => (
              <li key={k} className="flex flex-wrap justify-between gap-2">
                <span>{ALMOND_SOURCES[k]}</span>
                <span className="tabular-nums">
                  {(ALMOND_ML[k] / 1000).toFixed(1)} L
                </span>
              </li>
            )
          )}
        </ul>

        <h4 className="mt-5 font-medium text-gray-900">Limitations</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>{MODEL_NOTE}</li>
          <li>
            Mistral&apos;s figure describes a 400-token response. It is applied
            here across input and output tokens together.
          </li>
          <li>
            Mistral notes the assessment is an early estimate: there are no
            agreed standards for model lifecycle analysis and no reliable
            lifecycle data for GPUs.
          </li>
          <li>
            The data centre serving these requests is unknown, so local cooling
            method, climate and water stress are not accounted for.
          </li>
          <li>Nothing here is measured. Treat it as an order of magnitude.</li>
        </ul>

        <p className="mt-5 text-xs text-gray-500">
          No conversations are stored. Everything resets when you leave.
        </p>
      </section>

      <div className="mt-10 flex gap-3 pb-10">
        <button
          onClick={onReset}
          className="rounded-full bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Start a new session
        </button>
        <button
          onClick={onBack}
          className="rounded-full border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50"
        >
          Back to chat
        </button>
      </div>
    </div>
  );
}