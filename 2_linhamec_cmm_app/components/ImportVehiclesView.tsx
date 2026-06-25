import React, { useState, useRef } from 'react';
import { Vehicle } from '../types';
import { ArrowLeft, Database, Upload, Loader2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportVehiclesViewProps {
  onBack: () => void;
  onImport: (vehicles: Vehicle[]) => void;
  currentVehicles: Vehicle[];
}

export const ImportVehiclesView: React.FC<ImportVehiclesViewProps> = ({
  onBack,
  onImport,
  currentVehicles,
}) => {
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Vehicle[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(firstSheet);

        const vehicles: Vehicle[] = rows
          .map((row, index) => {
            const plate = (
              row.PLACA ||
              row.placa ||
              row.Placa ||
              row.plate ||
              ''
            )
              .toString()
              .toUpperCase()
              .trim();
            const brand = (
              row.MARCA ||
              row.marca ||
              row.Marca ||
              row.brand ||
              ''
            )
              .toString()
              .toUpperCase()
              .trim();
            const model = (
              row.MODELO ||
              row.modelo ||
              row.Modelo ||
              row.model ||
              ''
            )
              .toString()
              .toUpperCase()
              .trim();
            const year = (row.ANO || row.ano || row.Ano || row.year || '')
              .toString()
              .trim();
            const opm = (row.OPM || row.opm || row.UNIDADE || row.unidade || '')
              .toString()
              .toUpperCase()
              .trim();

            if (!plate || plate.length < 7)
              throw new Error(`Linha ${index + 2}: Placa inválida`);

            return { plate, brand, model, year, opm };
          })
          .filter((v) => v.plate);

        setPreview(vehicles);
        setImporting(false);
      } catch (err: any) {
        setError(err.message || 'Erro ao processar arquivo.');
        setImporting(false);
        setPreview([]);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-4 bg-white text-black font-black uppercase text-xs flex items-center gap-2 rounded-sm shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h2 className="text-2xl font-black text-white uppercase">
          Importar Frota
        </h2>
      </div>
      <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-sm space-y-6">
        <div className="flex items-start gap-6">
          <Database className="w-12 h-12 text-amber-500 flex-shrink-0" />
          <div className="flex-1 space-y-4">
            <h3 className="text-lg font-black text-white uppercase">
              Banco de Dados da Frota
            </h3>
            <p className="text-sm text-zinc-400">
              Importe um arquivo Excel (.xlsx ou .xls) contendo os dados da
              frota.
            </p>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full py-6 bg-white text-black font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 rounded-sm shadow-xl disabled:opacity-50"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" /> Selecionar Arquivo Excel
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="bg-rose-950 border border-rose-800 p-4 rounded-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-200">{error}</p>
          </div>
        )}
      </div>
      {preview.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white uppercase">
              Preview - {preview.length} veículos
            </h3>
            <button
              onClick={async () => {
                setImporting(true);
                await onImport(preview);
                setImporting(false);
              }}
              disabled={importing}
              className="px-8 py-4 bg-emerald-600 text-white font-black uppercase text-xs rounded-sm shadow-xl disabled:opacity-50"
            >
              {importing ? 'Importando...' : `Confirmar (${preview.length})`}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto border border-zinc-800 rounded-sm">
            <table className="w-full text-xs">
              <thead className="bg-zinc-900 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-black text-white uppercase">
                    #
                  </th>
                  <th className="text-left p-3 font-black text-white uppercase">
                    Placa
                  </th>
                  <th className="text-left p-3 font-black text-white uppercase">
                    Marca
                  </th>
                  <th className="text-left p-3 font-black text-white uppercase">
                    Modelo
                  </th>
                  <th className="text-left p-3 font-black text-white uppercase">
                    Ano
                  </th>
                  <th className="text-left p-3 font-black text-white uppercase">
                    OPM
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.map((v, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-800 hover:bg-zinc-900"
                  >
                    <td className="p-3 text-zinc-500">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-white">
                      {v.plate}
                    </td>
                    <td className="p-3 text-zinc-300">{v.brand}</td>
                    <td className="p-3 text-zinc-300">{v.model}</td>
                    <td className="p-3 text-zinc-300">{v.year}</td>
                    <td className="p-3 text-zinc-300">{v.opm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {currentVehicles.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-sm">
          <p className="text-sm text-zinc-400">
            <span className="font-bold text-white">
              {currentVehicles.length} veículos
            </span>{' '}
            já cadastrados
          </p>
        </div>
      )}
    </div>
  );
};
