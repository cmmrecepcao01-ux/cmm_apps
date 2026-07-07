import React from "react";
import { useDesfile } from "../context/DesfileContext";

export default function VistoriaTable() {
  const {
    viaturas,
    selectedOpmForVistoria,
    toggleChecklistItem
  } = useDesfile();

  if (!selectedOpmForVistoria) {
    return (
      <div id="no-opm-selected" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
        Selecione uma OPM no índice à esquerda.
      </div>
    );
  }

  const vtrs = viaturas.filter(v => v.opm === selectedOpmForVistoria && v.hasResponse === true);

  if (vtrs.length === 0) {
    return (
      <div id="no-opm-selected" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
        Nenhuma vistoria recebida para a OPM {selectedOpmForVistoria}.
      </div>
    );
  }

  const renderBadge = (vtr, field) => {
    const isOk = vtr.checklist[field] === "Sim";
    return (
      <td style={{ textAlign: "center" }}>
        <span
          className={`checklist-badge ${isOk ? "yes" : "no"}`}
          onClick={() => toggleChecklistItem(vtr.id, field)}
        >
          {isOk ? "OK" : "FALHA"}
        </span>
      </td>
    );
  };

  return (
    <div className="opm-vtrs-details">
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "16px",
        fontWeight: "600",
        color: "var(--color-primary)",
        marginBottom: "16px"
      }}>
        Vistorias do {selectedOpmForVistoria}
      </div>

      <table className="vistoria-table">
        <thead>
          <tr>
            <th>Prefixo</th>
            <th>Motorista</th>
            <th>Encarregado</th>
            <th style={{ textAlign: "center" }}>Pintura/Funilaria</th>
            <th style={{ textAlign: "center" }}>Novo Grafismo</th>
            <th style={{ textAlign: "center" }}>Grafismo Geral</th>
            <th style={{ textAlign: "center" }}>Giroflex/Sirene</th>
            <th style={{ textAlign: "center" }}>Calotas</th>
            <th style={{ textAlign: "center" }}>Luzes/Freios</th>
            <th style={{ textAlign: "center" }}>Mecânica</th>
            <th style={{ textAlign: "center" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {vtrs.map(vtr => {
            const isApproved = vtr.status === "Aprovado";
            return (
              <tr key={vtr.id}>
                <td>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-primary)" }}>
                    {vtr.prefix}
                  </span>
                </td>
                <td>{vtr.driver || "-"}</td>
                <td>{vtr.encarregado || "-"}</td>
                {renderBadge(vtr, "pintura")}
                {renderBadge(vtr, "novo_grafismo")}
                {renderBadge(vtr, "grafismo_geral")}
                {renderBadge(vtr, "sinais_sonoros")}
                {renderBadge(vtr, "calota_padrao")}
                {renderBadge(vtr, "luzes_farois")}
                {renderBadge(vtr, "mecanica_geral")}
                <td style={{ textAlign: "center" }}>
                  <span className={`vtr-status-tag ${isApproved ? "ok" : "fail"}`}>
                    {isApproved ? "APROVADO" : "PENDENTE"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
