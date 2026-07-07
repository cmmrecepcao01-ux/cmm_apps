import React from "react";
import { useDesfile, getOpmColor, getOpmGlow } from "../context/DesfileContext";

export default function VtrCard({ vtr }) {
  const { setSelectedVtrForEdit } = useDesfile();
  if (!vtr) return null;

  const isApproved = vtr.status === "Aprovado";
  const opmCol = getOpmColor(vtr.opm);
  const opmGlow = getOpmGlow(opmCol);

  const style = isApproved
    ? {
        "--vtr-color": opmCol,
        "--vtr-glow": opmGlow
      }
    : {};

  const icon = vtr.type === "moto" ? "🏍️" : "🚔";
  const driverText = vtr.driver ? `M: ${vtr.driver}` : "M: -";
  const encText = vtr.encarregado ? `E: ${vtr.encarregado}` : "E: -";

  const handleDragStart = (e) => {
    e.dataTransfer.setData("text/plain", vtr.id);
  };

  return (
    <div
      className={`street-vtr-card ${isApproved ? "approved" : "fail"}`}
      style={style}
      onClick={() => setSelectedVtrForEdit(vtr)}
      draggable="true"
      onDragStart={handleDragStart}
    >
      <div className="street-vtr-card-header">
        <span className="street-vtr-card-prefix">{vtr.prefix}</span>
        <span className="street-vtr-card-icon">{icon}</span>
      </div>
      <div className="street-vtr-card-opm">{vtr.opm}</div>
      <div className="street-vtr-card-crew" title={driverText}>
        {driverText}
      </div>
      <div className="street-vtr-card-crew" title={encText}>
        {encText}
      </div>
    </div>
  );
}
