import React, { useState } from "react";
import { useDesfile } from "../context/DesfileContext";
import { RefreshCw, FileText, Printer, Plus, Save, Settings } from "lucide-react";

export default function Header({ onOpenSettings }) {
  const {
    activeTab,
    setActiveTab,
    isConnected,
    isConnecting,
    spreadsheetUrl,
    syncWithGoogleSheets,
    saveLayoutToGoogleSheets,
    setSelectedVtrForEdit
  } = useDesfile();

  const handleAddVtrClick = () => {
    // We pass "NEW" as id to trigger add mode in the modal
    setSelectedVtrForEdit({ id: "NEW", opm: "", prefix: "", type: "carro", driver: "", encarregado: "" });
  };

  return (
    <header className="no-print">
      <div className="brand-section">
        <div className="brand-logo">DISPOSITIVO 09JUL</div>
        
        <div className="status-indicator">
          <div className={`status-dot ${isConnecting ? "connecting" : isConnected ? "connected" : "offline"}`} />
          <span style={{ fontSize: "11px", fontWeight: "700" }}>
            {isConnecting ? "Conectando..." : isConnected ? "Sheets Conectado" : "Modo Offline"}
          </span>
        </div>
      </div>

      <div className="action-buttons">
        <div className="tab-selector">
          <button
            className={`tab-btn ${activeTab === "layout" ? "active" : ""}`}
            onClick={() => setActiveTab("layout")}
          >
            🗺️ Layout
          </button>
          <button
            className={`tab-btn ${activeTab === "vistorias" ? "active" : ""}`}
            onClick={() => setActiveTab("vistorias")}
          >
            📋 Vistorias
          </button>
        </div>

        {spreadsheetUrl && (
          <button className="action-btn" onClick={() => window.open(spreadsheetUrl, "_blank")}>
            <FileText size={16} /> Planilha
          </button>
        )}

        <button className="action-btn" onClick={() => window.print()}>
          <Printer size={16} /> Imprimir
        </button>

        <button className="action-btn" onClick={handleAddVtrClick}>
          <Plus size={16} /> Adicionar VTR
        </button>

        {activeTab === "layout" && (
          <button className="action-btn btn-primary" onClick={() => saveLayoutToGoogleSheets(false)}>
            <Save size={16} /> Salvar Layout
          </button>
        )}

        <button className="action-btn" onClick={syncWithGoogleSheets}>
          <RefreshCw size={16} className={isConnecting ? "animate-spin" : ""} /> Sincronizar
        </button>

        <button className="action-btn" onClick={onOpenSettings}>
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
