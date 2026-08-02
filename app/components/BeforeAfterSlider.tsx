"use client";

import { useState } from "react";

type ComparisonPair = {
  before: string;
  after: string;
};

function ComparisonSlider({ pair, index }: { pair: ComparisonPair; index: number }) {
  const [position, setPosition] = useState(50);

  return (
    <figure className="restorationComparison">
      <div className="restorationCompare">
        <img src={pair.before} alt={`Damaged photograph before restoration, example ${index + 1}`} />
        <div className="restorationAfter" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
          <img src={pair.after} alt={`Photograph after restoration, example ${index + 1}`} />
        </div>
        <span className="comparisonLabel beforeLabel">Before</span>
        <span className="comparisonLabel afterLabel">After</span>
        <span className="comparisonDivider" style={{ left: `${position}%` }} aria-hidden="true">
          <span>↔</span>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label={`Compare the before and restored versions of photograph ${index + 1}`}
          aria-valuetext={`${position}% before, ${100 - position}% restored`}
        />
      </div>
      <figcaption>Drag left or right to compare</figcaption>
    </figure>
  );
}

export function RestorationComparisons({ pairs }: { pairs: ComparisonPair[] }) {
  return (
    <section className="restorationSection" aria-labelledby="restoration-comparisons-title">
      <div className="restorationHeading">
        <p className="kicker">Restoration comparisons</p>
        <h2 id="restoration-comparisons-title">BEFORE / <span>AFTER.</span></h2>
      </div>
      <div className="restorationGrid">
        {pairs.map((pair, index) => <ComparisonSlider pair={pair} index={index} key={pair.before} />)}
      </div>
    </section>
  );
}
