import React, { useState, useEffect } from "react";
import { useDesfile } from "../context/DesfileContext";

export default function SettingsModal({ isOpen, onClose }) {
  const { webAppUrl, spreadsheetUrl, saveSettings } = useDesfile();

  if (!isOpen) return null;

  const [inputUrl, setInputUrl] = useState(webAppUrl);
  const [inputSpreadsheetUrl, setInputSpreadsheetUrl] = useState(spreadsheetUrl);

  useEffect(() => {
    setInputUrl(webAppUrl);
    setInputSpreadsheetUrl(spreadsheetUrl);
  }, [webAppUrl, spreadsheetUrl]);

  const handleSave = () => {
    saveSettings(inputUrl.trim(), inputSpreadsheetUrl.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ display: "flex" }}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">Configurações de Sincronização</div>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Link da Implantação (Google Web App URL)</label>
            <input
              type="text"
              className="form-input"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Planilha do Google Sheets (Visualização)</label>
            <input
              type="text"
              className="form-input"
              value={inputSpreadsheetUrl}
              onChange={(e) => setInputSpreadsheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="action-btn btn-primary" onClick={handleSave}>
            💾 Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
