import React from "react";
import { useDesfile } from "../context/DesfileContext";
import OpmSidebar from "./OpmSidebar";
import VistoriaTable from "./VistoriaTable";

export default function VistoriaPane() {
  const { viaturas } = useDesfile();

  const vtrsWithResponse = viaturas.filter(v => v.hasResponse === true);
  const okCount = vtrsWithResponse.filter(v => v.status === "Aprovado").length;
  const pendingCount = vtrsWithResponse.length - okCount;

  return (
    <div className="vistoria-view">
      {/* Stats Cards */}
      <div className="stats-bar no-print">
        <div className="stat-card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <span className="stat-val" id="stat-total">{vtrsWithResponse.length}</span>
          <span className="stat-label">Total Escalado</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid var(--color-success)" }}>
          <span className="stat-val" id="stat-ok" style={{ color: "var(--color-success)" }}>{okCount}</span>
          <span className="stat-label">Aprovadas (OK)</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid var(--color-error)" }}>
          <span className="stat-val" id="stat-pending" style={{ color: "var(--color-error)" }}>{pendingCount}</span>
          <span className="stat-label">Pendentes (Erros)</span>
        </div>
      </div>

      {/* Split-Screen Container */}
      <div className="vistoria-split-container">
        <OpmSidebar />
        <VistoriaTable />
      </div>
    </div>
  );
}
