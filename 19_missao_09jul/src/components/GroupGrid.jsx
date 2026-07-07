import React from "react";
import VtrCard from "./VtrCard";
import { useDesfile, DEFAULT_LAYOUT } from "../context/DesfileContext";

export default function GroupGrid({ groupIndex, vtrs }) {
  const { layouts, viaturas, moveViaturaLayout } = useDesfile();
  const idx = Number(groupIndex);

  let groupType = "duas-colunas";
  if (idx === 2) {
    groupType = "cunha";
  } else if (idx === 1 || idx === 3 || idx === 18 || idx === 20 || idx === 21) {
    groupType = "fila-unica";
  }

  // Sort vehicles in the platoon by Y coordinate
  const sortedVtrs = [...vtrs].sort((a, b) => {
    const keyA = a.opm + "_" + a.prefix;
    const keyB = b.opm + "_" + b.prefix;
    const ya = (layouts[keyA] || DEFAULT_LAYOUT[keyA] || { y: 9999 }).y;
    const yb = (layouts[keyB] || DEFAULT_LAYOUT[keyB] || { y: 9999 }).y;
    if (ya !== yb) return ya - yb;
    return a.prefix.localeCompare(b.prefix, undefined, { numeric: true });
  });

  // Calculate base Y for this group to use for empty cells
  const vtrCoords = sortedVtrs.map(v => {
    const key = v.opm + "_" + v.prefix;
    return layouts[key] || DEFAULT_LAYOUT[key] || { x: 527, y: 150 };
  });
  const minY = vtrCoords.length > 0 ? Math.min(...vtrCoords.map(c => c.y)) : 150;

  const handleDrop = (e, targetX, targetY, targetVtr = null) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedVtr = viaturas.find(v => v.id === draggedId);
    if (draggedVtr) {
      moveViaturaLayout(draggedVtr, targetX, targetY, targetVtr);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragEnter = (e) => {
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  if (groupType === "cunha") {
    // Escolta has exactly 3 motorcycles in a cunha row
    const row = [null, null, null];
    sortedVtrs.forEach(vtr => {
      const key = vtr.opm + "_" + vtr.prefix;
      const coords = layouts[key] || DEFAULT_LAYOUT[key] || { x: 527 };
      if (coords.x <= 400) row[0] = vtr;
      else if (coords.x >= 600) row[2] = vtr;
      else row[1] = vtr;
    });

    // Fallback distribution
    let vtrIdx = 0;
    for (let i = 0; i < 3; i++) {
      if (row[i] === null && vtrIdx < sortedVtrs.length) {
        while (vtrIdx < sortedVtrs.length && row.includes(sortedVtrs[vtrIdx])) {
          vtrIdx++;
        }
        if (vtrIdx < sortedVtrs.length) {
          row[i] = sortedVtrs[vtrIdx];
          vtrIdx++;
        }
      }
    }

    const xCoords = [380, 527, 670];

    return (
      <div className="street-road-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", maxWidth: "1100px", margin: "0 auto" }}>
        {row.map((vtr, cellIdx) => {
          const targetX = xCoords[cellIdx];
          const targetY = minY;
          return (
            <div
              key={cellIdx}
              className={`road-lane ${cellIdx < 2 ? "has-divider" : ""} ${!vtr ? "empty-lane" : ""}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, targetX, targetY, vtr)}
            >
              {vtr ? <VtrCard vtr={vtr} /> : null}
            </div>
          );
        })}
      </div>
    );
  }

  if (groupType === "fila-unica") {
    return (
      <div className="street-road-grid" style={{ gridTemplateColumns: "1fr", maxWidth: "400px", margin: "0 auto" }}>
        {sortedVtrs.map((vtr, rIdx) => {
          const targetX = 527;
          const targetY = minY + rIdx * 120;
          return (
            <div
              key={vtr.id}
              className="road-lane"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, targetX, targetY, vtr)}
            >
              <VtrCard vtr={vtr} />
            </div>
          );
        })}
      </div>
    );
  }

  // Coluna de duas
  const rows = [];
  for (let i = 0; i < sortedVtrs.length; i += 2) {
    rows.push([sortedVtrs[i], sortedVtrs[i + 1] || null]);
  }

  return (
    <div className="street-road-grid" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: "800px", margin: "0 auto" }}>
      {rows.map((pair, rowIndex) => {
        const targetY = minY + rowIndex * 120;
        return (
          <React.Fragment key={rowIndex}>
            {/* Left lane */}
            <div
              className="road-lane has-divider"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 380, targetY, pair[0])}
            >
              <VtrCard vtr={pair[0]} />
            </div>
            
            {/* Right lane */}
            <div
              className={`road-lane ${!pair[1] ? "empty-lane" : ""}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 670, targetY, pair[1])}
            >
              {pair[1] ? <VtrCard vtr={pair[1]} /> : null}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
