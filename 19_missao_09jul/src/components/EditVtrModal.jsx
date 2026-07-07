import React, { useState, useEffect } from "react";
import { useDesfile } from "../context/DesfileContext";

export default function EditVtrModal() {
  const {
    viaturas,
    selectedVtrForEdit,
    setSelectedVtrForEdit,
    addViatura,
    editViatura
  } = useDesfile();

  if (!selectedVtrForEdit) return null;

  const isNew = selectedVtrForEdit.id === "NEW";

  const [opm, setOpm] = useState(selectedVtrForEdit.opm || "");
  const [isCustomOpm, setIsCustomOpm] = useState(false);
  const [customOpm, setCustomOpm] = useState("");
  
  const [prefix, setPrefix] = useState(selectedVtrForEdit.prefix || "");
  const [type, setType] = useState(selectedVtrForEdit.type || "carro");
  const [driver, setDriver] = useState(selectedVtrForEdit.driver || "");
  const [encarregado, setEncarregado] = useState(selectedVtrForEdit.encarregado || "");

  // Unique list of OPMs for dropdown
  const opmsList = Array.from(new Set(viaturas.map(v => v.opm))).sort();

  useEffect(() => {
    setOpm(selectedVtrForEdit.opm || "");
    setPrefix(selectedVtrForEdit.prefix || "");
    setType(selectedVtrForEdit.type || "carro");
    setDriver(selectedVtrForEdit.driver || "");
    setEncarregado(selectedVtrForEdit.encarregado || "");
    setIsCustomOpm(false);
    setCustomOpm("");
  }, [selectedVtrForEdit]);

  const handleOpmChange = (e) => {
    const val = e.target.value;
    if (val === "NEW_OPM") {
      setIsCustomOpm(true);
      setOpm("");
    } else {
      setIsCustomOpm(false);
      setOpm(val);
    }
  };

  const handleSave = () => {
    const finalOpm = isCustomOpm ? customOpm.trim() : opm;
    if (!finalOpm || !prefix.trim()) {
      alert("Por favor, preencha a OPM e o Prefixo.");
      return;
    }

    if (isNew) {
      const success = addViatura(
        finalOpm,
        prefix.trim(),
        type,
        driver.trim(),
        encarregado.trim()
      );
      if (success) setSelectedVtrForEdit(null);
    } else {
      editViatura(
        selectedVtrForEdit.id,
        type,
        driver.trim(),
        encarregado.trim()
      );
      setSelectedVtrForEdit(null);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: "flex" }}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">
            {isNew ? "Cadastrar Nova VTR" : `Editar Dados - ${selectedVtrForEdit.prefix}`}
          </div>
          <button className="modal-close-btn" onClick={() => setSelectedVtrForEdit(null)}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* OPM Selection */}
          <div className="form-group">
            <label className="form-label">OPM (Unidade)</label>
            {isNew ? (
              <>
                <select
                  className="form-input"
                  style={{ backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}
                  onChange={handleOpmChange}
                  value={isCustomOpm ? "NEW_OPM" : opm}
                >
                  <option value="">Selecione...</option>
                  {opmsList.map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                  <option value="NEW_OPM">Nova OPM...</option>
                </select>

                {isCustomOpm && (
                  <input
                    type="text"
                    placeholder="Digite o nome da OPM..."
                    className="form-input"
                    value={customOpm}
                    onChange={(e) => setCustomOpm(e.target.value)}
                    style={{ marginTop: "8px" }}
                  />
                )}
              </>
            ) : (
              <input type="text" className="form-input" value={opm} disabled />
            )}
          </div>

          {/* Prefix */}
          <div className="form-group">
            <label className="form-label">Prefixo da Viaturas</label>
            <input
              type="text"
              className="form-input"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              disabled={!isNew}
              placeholder="Ex: M-12345 ou VTR 1"
            />
          </div>

          {/* Type selection */}
          <div className="form-group">
            <label className="form-label">Tipo do Veículo</label>
            <select
              className="form-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ backgroundColor: "var(--bg-main)", color: "var(--text-main)" }}
            >
              <option value="carro">🚔 Viaturas (4 rodas)</option>
              <option value="moto">🏍️ Moto (2 rodas)</option>
            </select>
          </div>

          {/* Driver */}
          <div className="form-group">
            <label className="form-label">Motorista (M:)</label>
            <input
              type="text"
              className="form-input"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="Nome do Policial Motorista"
            />
          </div>

          {/* Encarregado */}
          <div className="form-group">
            <label className="form-label">Encarregado (E:)</label>
            <input
              type="text"
              className="form-input"
              value={encarregado}
              onChange={(e) => setEncarregado(e.target.value)}
              placeholder="Nome do Policial Encarregado"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn" onClick={() => setSelectedVtrForEdit(null)}>
            Cancelar
          </button>
          <button className="action-btn btn-primary" onClick={handleSave}>
            💾 Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}
