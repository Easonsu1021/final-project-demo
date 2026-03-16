import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import LoadingSpinner from './components/LoadingSpinner';
import { useLanguage } from './contexts/LanguageContext';

// Lazy load heavy components for better performance
const FlowCanvas = lazy(() => import('./components/FlowCanvas'));
const Inspector = lazy(() => import('./components/Inspector'));
const Analytics = lazy(() => import('./components/Analytics'));
const Library = lazy(() => import('./components/Library'));
const Settings = lazy(() => import('./components/Settings'));
const AddCardModal = lazy(() => import('./components/AddCardModal'));
const ConfirmationDialog = lazy(() => import('./components/ConfirmationDialog'));
const PlateViewer = lazy(() => import('./components/PlateViewer'));
const AICoDesign = lazy(() => import('./components/AICoDesign/AICoDesign'));

// Loading fallback component
function LoadingFallback() {
  const { t } = useLanguage();
  return <LoadingSpinner message={t('common.loading')} />;
}

const defaultData = {
  lanes: ["SoC", "3DIC", "Package", "PCB", "Thermal"],
  items: [
    { id: 1, titleKey: "cards.logicSynthesis", vendor: "syn", lane: "SoC", status: "todo", notes: "Fusion Compiler" },
    { id: 2, titleKey: "cards.physicalSynthesis", vendor: "syn", lane: "SoC", status: "todo", notes: "Timing-aware" },
    { id: 3, titleKey: "cards.chipletPlanning", vendor: "syn", lane: "3DIC", status: "todo", notes: "UCIe/BoW/μbump" },
    { id: 4, titleKey: "cards.interposerRouting", vendor: "syn", lane: "3DIC", status: "todo", notes: "" },
    { id: 5, titleKey: "cards.dicCompiler", vendor: "syn", lane: "3DIC", status: "todo", notes: "" },
    { id: 6, titleKey: "cards.c4BumpMap", vendor: "zuk", lane: "Package", status: "todo", notes: "" },
    { id: 7, titleKey: "cards.pinAssignment", vendor: "zuk", lane: "Package", status: "todo", notes: "" },
    { id: 8, titleKey: "cards.ballMap", vendor: "zuk", lane: "Package", status: "todo", notes: "" },
    { id: 9, titleKey: "cards.packageRouting", vendor: "zuk", lane: "Package", status: "todo", notes: "" },
    { id: 10, titleKey: "cards.pcbDesign", vendor: "zuk", lane: "PCB", status: "todo", notes: "" },
    { id: 11, titleKey: "cards.packagePcbIntegration", vendor: "zuk", lane: "PCB", status: "todo", notes: "" },
    { id: 12, titleKey: "cards.socSipPcbAnalysis", vendor: "ans", lane: "PCB", status: "todo", notes: "Ansys Thermal/Stress/Warpage" },
    { id: 13, titleKey: "cards.thermalSimulation", vendor: "ans", lane: "Thermal", status: "todo", notes: "Icepak / Redhawk-SC Electrothermal" },
    { id: 14, titleKey: "cards.coolingEvaluation", vendor: "zuk", lane: "Thermal", status: "todo", notes: "Active/Passive Cooling" },
    { id: 15, titleKey: "cards.thermalStress", vendor: "ans", lane: "Thermal", status: "todo", notes: "Mechanical stress due to heat" }
  ]
};

const storageKey = "chiplet-studio-react-v2";

function App() {
  const { t } = useLanguage();
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [activeTab, setActiveTab] = useState('flow');
  const [searchTerm, setSearchTerm] = useState('');
  const [recentlyAddedCardId, setRecentlyAddedCardId] = useState(null);

  // --- Modal States ---
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState({ isOpen: false, type: null, data: null });

  useEffect(() => {
    const storedData = localStorage.getItem(storageKey);
    setCards(storedData ? JSON.parse(storedData) : defaultData.items);
  }, []);

  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(cards));
    }
  }, [cards]);

  const selectedCard = useMemo(() =>
    cards.find(card => card.id === selectedCardId),
    [cards, selectedCardId]
  );

  const handleSelectCard = useCallback((id) => {
    setSelectedCardId(id);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // --- Card Actions --- 
  const handleAddNewCard = (newCardData) => {
    const newId = Math.max(0, ...cards.map(c => c.id)) + 1;
    const newCard = { ...newCardData, id: newId };
    setCards([...cards, newCard]);
    setSelectedCardId(newId);
    setRecentlyAddedCardId(newId);
    setTimeout(() => setRecentlyAddedCardId(null), 3000); // Highlight for 3 seconds
  };

  const requestUpdateCard = (updatedCard) => {
    if (JSON.stringify(selectedCard) !== JSON.stringify(updatedCard)) {
      setConfirmationState({ isOpen: true, type: 'update', data: { old: selectedCard, new: updatedCard } });
    }
  };

  const requestDeleteCard = () => {
    setConfirmationState({ isOpen: true, type: 'delete', data: { cardToDelete: selectedCard } });
  };

  const handleConfirmAction = () => {
    const { type, data } = confirmationState;
    if (type === 'update') {
      setCards(cards.map(card => card.id === data.new.id ? data.new : card));
    } else if (type === 'delete') {
      setCards(cards.filter(card => card.id !== data.cardToDelete.id));
      if (selectedCardId === data.cardToDelete.id) {
        setSelectedCardId(null);
      }
    }
    setConfirmationState({ isOpen: false, type: null, data: null }); // Close modal
  };

  // --- Import/Export/Reset --- 
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chiplet_flow_react.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCards = JSON.parse(e.target.result);
        if (Array.isArray(importedCards)) setCards(importedCards);
        else alert(t('app.importFailed'));
      } catch (err) { alert(t('app.importError') + err.message); }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm(t('app.confirmReset'))) {
      localStorage.removeItem(storageKey);
      setCards(defaultData.items);
      setSelectedCardId(null);
    }
  };

  const filteredCards = useMemo(() =>
    cards.filter(card =>
      `${card.title} ${card.vendor} ${card.lane} ${card.notes}`.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [cards, searchTerm]
  );

  const renderMainContent = () => {
    switch (activeTab) {
      case 'flow':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <div className="grid">
              <FlowCanvas
                cards={filteredCards}
                onSelectCard={handleSelectCard}
                selectedCardId={selectedCardId}
                recentlyAddedCardId={recentlyAddedCardId}
              />
              <Inspector
                selectedCard={selectedCard}
                onRequestUpdate={requestUpdateCard}
                onRequestDelete={requestDeleteCard}
                cards={cards}
              />
            </div>
            <PlateViewer />
          </Suspense>
        );
      case 'ai-codesign':
        return <Suspense fallback={<LoadingFallback />}><AICoDesign /></Suspense>;
      case 'analytics':
        return <Suspense fallback={<LoadingFallback />}><Analytics cards={cards} /></Suspense>;
      case 'library':
        return <Suspense fallback={<LoadingFallback />}><Library /></Suspense>;
      case 'settings':
        return <Suspense fallback={<LoadingFallback />}><Settings /></Suspense>;
      default:
        return null;
    }
  };

  // AI Co-Design 頁面使用獨立全螢幕佈局
  if (activeTab === 'ai-codesign') {
    return (
      <div className="app app-fullscreen">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onExport={handleExportJSON}
          onImport={handleImportJSON}
          onReset={handleReset}
        />
        <main className="main main-fullscreen">
          {renderMainContent()}
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
        onReset={handleReset}
      />
      <main className="main">
        <Toolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onShowAddModal={() => setAddModalOpen(true)}
        />
        {renderMainContent()}
      </main>

      <Suspense fallback={null}>
        <AddCardModal
          isOpen={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onAddCard={handleAddNewCard}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ConfirmationDialog
          isOpen={confirmationState.isOpen}
          onCancel={() => setConfirmationState({ isOpen: false, type: null, data: null })}
          onConfirm={handleConfirmAction}
          confirmationInfo={confirmationState}
        />
      </Suspense>
    </div>
  );
}

export default App;
