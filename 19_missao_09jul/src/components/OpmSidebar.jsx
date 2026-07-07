import React from "react";
import { useDesfile, OPM_INDEX_LIST } from "../context/DesfileContext";

export default function OpmSidebar() {
  const {
    viaturas,
    selectedOpmForVistoria,
    setSelectedOpmForVistoria
  } = useDesfile();

  // Collect active OPMs from viaturas to ensure custom OPMs show up too
  const currentOpms = Array.from(new Set(viaturas.map(v => v.opm)));
  const allOpms = [...OPM_INDEX_LIST];
  currentOpms.forEach(opm => {
    if (opm && !allOpms.includes(opm)) {
      allOpms.push(opm);
    }
  });

  return (
    <div className="opm-index-sidebar">
      {allOpms.map(opm => {
        // Count vistors that have a response submitted
        const count = viaturas.filter(v => v.opm === opm && v.hasResponse === true).length;
        
        // Hide custom OPMs if they don't have any filled responses
        if (count === 0 && !OPM_INDEX_LIST.includes(opm)) return null;

        const isActive = selectedOpmForVistoria === opm;

        return (
          <button
            key={opm}
            className={`opm-index-btn ${isActive ? "active" : ""}`}
            onClick={() => setSelectedOpmForVistoria(opm)}
          >
            <span>{opm}</span>
            <span className="opm-badge">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
