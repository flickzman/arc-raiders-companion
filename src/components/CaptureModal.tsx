import React, { useState, useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { getLocalized } from '../data/db';
import { scanImageWithTesseract } from '../services/ocr/tesseractScanner';
import { scanImageWithGeminiVision } from '../services/ocr/geminiVision';
import { type MatchResult } from '../services/ocr/fuzzyMatcher';
import {
  X,
  Camera,
  ClipboardPaste,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageBlob?: Blob | null;
}

export const CaptureModal: React.FC<CaptureModalProps> = ({
  isOpen,
  onClose,
  initialImageBlob,
}) => {
  const { language, addActiveQuests, geminiApiKey, setGeminiApiKey } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'pc' | 'mobile'>('pc');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);

  // Estados de escaneo
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resultados
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([]);
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey);
  const [isKeySaved, setIsKeySaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar imagen inicial si viene de Ctrl+V
  useEffect(() => {
    if (initialImageBlob && isOpen) {
      handleImageLoaded(initialImageBlob);
    }
  }, [initialImageBlob, isOpen]);

  // Limpiar estado al cerrar
  const handleClose = () => {
    setImagePreview(null);
    setCurrentBlob(null);
    setMatches([]);
    setErrorMessage(null);
    setIsScanning(false);
    onClose();
  };

  const handleImageLoaded = (blob: Blob) => {
    setCurrentBlob(blob);
    const url = URL.createObjectURL(blob);
    setImagePreview(url);
    setMatches([]);
    setErrorMessage(null);

    // Si estamos en la pestaña PC, arrancar OCR local automáticamente
    if (activeTab === 'pc') {
      runTesseractScan(blob);
    }
  };

  const runTesseractScan = async (blob: Blob) => {
    setIsScanning(true);
    setErrorMessage(null);
    setScanProgress(5);
    setScanStatusText(language === 'es' ? 'Preparando imagen...' : 'Preparing image...');

    try {
      const result = await scanImageWithTesseract(blob, (progress, status) => {
        setScanProgress(progress);
        setScanStatusText(status);
      });

      setMatches(result.matches);
      setSelectedQuestIds(result.matches.map((m) => m.quest.id));

      if (result.matches.length === 0) {
        setErrorMessage(
          language === 'es'
            ? 'No se detectaron títulos de misiones con suficiente claridad. Prueba a recortar la zona de misiones o usa la pestaña de Visión por IA.'
            : 'No quest titles clearly detected. Try cropping the quests area or use the AI Vision tab.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error durante el reconocimiento OCR');
    } finally {
      setIsScanning(false);
    }
  };

  const runGeminiScan = async () => {
    if (!currentBlob) return;
    setIsScanning(true);
    setErrorMessage(null);
    setScanStatusText(language === 'es' ? 'Analizando con Gemini Flash Vision...' : 'Analyzing with Gemini Flash Vision...');

    try {
      const results = await scanImageWithGeminiVision(currentBlob, tempApiKey || geminiApiKey);
      setMatches(results);
      setSelectedQuestIds(results.map((m) => m.quest.id));

      if (results.length === 0) {
        setErrorMessage(
          language === 'es'
            ? 'Gemini no reconoció misiones en la imagen proporcionada.'
            : 'Gemini did not recognize quests in the provided image.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con la API de Gemini');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyQuests = () => {
    if (selectedQuestIds.length > 0) {
      addActiveQuests(selectedQuestIds);
    }
    handleClose();
  };

  const toggleSelectQuest = (id: string) => {
    setSelectedQuestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-100">
              {language === 'es' ? 'Ingesta Visual de Misiones (OCR & IA)' : 'Visual Quest Ingestion (OCR & AI)'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-2 gap-2">
          <button
            onClick={() => setActiveTab('pc')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 transition-all ${
              activeTab === 'pc'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            <span>{language === 'es' ? 'Captura PC (Ctrl+V / Tesseract)' : 'PC Snipping (Ctrl+V)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 transition-all ${
              activeTab === 'mobile'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'es' ? 'Foto Móvil (Gemini Vision IA)' : 'Phone Photo (Gemini AI)'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Dropzone / Upload area when no image is loaded */}
          {!imagePreview && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleImageLoaded(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 hover:border-amber-500/80 rounded-xl p-8 text-center cursor-pointer transition-colors bg-neutral-950/40 hover:bg-neutral-950/80 space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture={activeTab === 'mobile' ? 'environment' : undefined}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageLoaded(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                {activeTab === 'pc' ? <ClipboardPaste className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-neutral-200 uppercase">
                  {activeTab === 'pc'
                    ? (language === 'es' ? 'Pulsa Ctrl+V o arrastra una captura de pantalla' : 'Press Ctrl+V or drop a screenshot')
                    : (language === 'es' ? 'Toca para abrir la cámara o seleccionar foto' : 'Tap to open camera or pick photo')}
                </p>
                <p className="text-[11px] font-mono text-neutral-500 mt-1">
                  {activeTab === 'pc'
                    ? (language === 'es' ? 'Tip: Haz Win+Shift+S al panel de misiones en ARC Raiders' : 'Tip: Use Win+Shift+S on ARC Raiders quest screen')
                    : (language === 'es' ? 'Apunta a la pantalla de tu monitor con el móvil' : 'Snap a picture of your monitor with your phone')}
                </p>
              </div>
            </div>
          )}

          {/* Gemini API Key Configuration (In Mobile / AI Tab) */}
          {activeTab === 'mobile' && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Gemini API Key</span>
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-mono text-amber-400 hover:underline"
                >
                  {language === 'es' ? 'Obtener clave gratuita ↗' : 'Get free API key ↗'}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setGeminiApiKey(tempApiKey);
                    setIsKeySaved(true);
                    setTimeout(() => setIsKeySaved(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200 transition-colors"
                >
                  {isKeySaved ? '✓' : (language === 'es' ? 'Guardar' : 'Save')}
                </button>
              </div>
            </div>
          )}

          {/* Image Preview & Scanner Progress */}
          {imagePreview && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-neutral-800 max-h-48 bg-neutral-950 flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Screenshot preview"
                  className="max-h-48 w-auto object-contain"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setCurrentBlob(null);
                    setMatches([]);
                  }}
                  className="absolute top-2 right-2 px-2 py-1 rounded bg-black/80 border border-neutral-700 text-[10px] font-mono text-neutral-300 hover:text-white"
                >
                  {language === 'es' ? 'Cambiar imagen' : 'Change image'}
                </button>
              </div>

              {/* Progress Bar when Scanning */}
              {isScanning && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="flex items-center gap-2 text-amber-400 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{scanStatusText}</span>
                    </span>
                    <span className="text-neutral-400">{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Mobile AI Scan Trigger Button */}
              {activeTab === 'mobile' && !isScanning && matches.length === 0 && (
                <button
                  onClick={runGeminiScan}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{language === 'es' ? 'Analizar Foto con Visión IA' : 'Analyze Photo with AI Vision'}</span>
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs font-mono text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Detected Matches List */}
          {matches.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {language === 'es' ? 'Misiones Detectadas' : 'Detected Quests'} ({matches.length})
                  </span>
                </span>
                <button
                  onClick={() =>
                    setSelectedQuestIds(
                      selectedQuestIds.length === matches.length
                        ? []
                        : matches.map((m) => m.quest.id)
                    )
                  }
                  className="text-[10px] font-mono text-neutral-400 hover:text-neutral-200"
                >
                  {selectedQuestIds.length === matches.length
                    ? (language === 'es' ? 'Deseleccionar todas' : 'Deselect all')
                    : (language === 'es' ? 'Seleccionar todas' : 'Select all')}
                </button>
              </div>

              <div className="space-y-2">
                {matches.map(({ quest, confidence }) => {
                  const isChecked = selectedQuestIds.includes(quest.id);

                  return (
                    <div
                      key={quest.id}
                      onClick={() => toggleSelectQuest(quest.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-neutral-950 border-amber-500/80 ring-1 ring-amber-500/30'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                            isChecked ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 bg-neutral-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-100">
                            {getLocalized(quest.title, language)}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            [{quest.vendor}] • {quest.objectives.length} {language === 'es' ? 'objetivos' : 'objectives'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          confidence >= 80
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {confidence}% {language === 'es' ? 'coincidencia' : 'match'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <span className="text-[11px] font-mono text-neutral-400">
            {selectedQuestIds.length} {language === 'es' ? 'seleccionadas' : 'selected'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 text-xs font-mono text-neutral-300 transition-colors"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>

            <button
              disabled={selectedQuestIds.length === 0}
              onClick={handleApplyQuests}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs font-mono uppercase transition-all shadow-md shadow-amber-500/20"
            >
              {language === 'es' ? '✓ Activar Misiones' : '✓ Activate Quests'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
