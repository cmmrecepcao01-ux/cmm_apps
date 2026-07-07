import React, { useState } from "react";
import { DesfileProvider, useDesfile } from "./context/DesfileContext";
import Header from "./components/Header";
import LayoutPane from "./components/LayoutPane";
import VistoriaPane from "./components/VistoriaPane";
import EditVtrModal from "./components/EditVtrModal";
import SettingsModal from "./components/SettingsModal";

function DashboardContent() {
  const { activeTab } = useDesfile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="app-container">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <div className="app-workspace">
        <div className={`view-pane ${activeTab === "layout" ? "active" : ""}`} id="pane-layout">
          <LayoutPane />
        </div>

        <div className={`view-pane ${activeTab === "vistorias" ? "active" : ""}`} id="pane-vistoria">
          <VistoriaPane />
        </div>
      </div>

      <EditVtrModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <DesfileProvider>
      <DashboardContent />
    </DesfileProvider>
  );
}
