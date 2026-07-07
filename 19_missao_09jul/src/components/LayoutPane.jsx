import React from "react";
import { useDesfile, getDesfileGroup } from "../context/DesfileContext";
import GroupGrid from "./GroupGrid";

export default function LayoutPane() {
  const { viaturas } = useDesfile();

  // Group vehicles by their desfile group index
  const groups = {};
  viaturas.forEach(vtr => {
    if (!vtr) return;
    const groupInfo = getDesfileGroup(vtr);
    if (groupInfo.index === 99) return; // skip other items

    if (!groups[groupInfo.index]) {
      groups[groupInfo.index] = {
        name: groupInfo.name,
        vtrs: []
      };
    }
    groups[groupInfo.index].vtrs.push(vtr);
  });

  // Sort groups by official index
  const sortedGroupIndices = Object.keys(groups).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="street-container">
      {/* Palanque de Honra */}
      <div className="street-palanque">
        <div>
          <h3>PALANQUE DE HONRA OPERACIONAL</h3>
          <p>Desfile de Viaturas e Motocicletas do Gpt Mtz da PMESP - 9 de Julho</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", opacity: 0.8 }}>
            Tribuna das Autoridades
          </span>
        </div>
      </div>

      {/* Street View of Platoons */}
      <div className="street-road-view">
        {sortedGroupIndices.map(indexKey => {
          const group = groups[indexKey];
          return (
            <div key={indexKey} className="street-group">
              <div className="street-group-header">{group.name}</div>
              <GroupGrid groupIndex={indexKey} vtrs={group.vtrs} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
