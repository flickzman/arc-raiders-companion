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
  PlusCircle,
  FileText,
  ChevronDown,
  ChevronUp,
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
  const { language, addActiveQuests, geminiApiKey, setGeminiApiKey, customQuests, addCustomQuest } =
    usePlayerStore();

  const [engineMode, setEngineMode] = useState<'ai' | 'tesseract'>('ai');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);

  // Estados de escaneo
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);

  // Resultados acumulados
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [selectedQuestIds, setSelectedQuestIds] = useState<string[]>([]);
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey);
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!geminiApiKey);
  const [manualTitle, setManualTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar imagen inicial si viene de Ctrl+V
  useEffect(() => {
    if (initialImageBlob && isOpen) {
      handleImageLoaded(initialImageBlob);
    }
  }, [initialImageBlob, isOpen]);

  // Actualizar apiKey temporal si cambia en store
  useEffect(() => {
    setTempApiKey(geminiApiKey);
    if (geminiApiKey) {
      setShowKeyInput(false);
    }
  }, [geminiApiKey]);

  // Limpiar estado al cerrar
  const handleClose = () => {
    setImagePreview(null);
    setCurrentBlob(null);
    setMatches([]);
    setErrorMessage(null);
    setRawOcrText(null);
    setIsScanning(false);
    onClose();
  };

  const handleImageLoaded = (blob: Blob) => {
    setCurrentBlob(blob);
    const url = URL.createObjectURL(blob);
    setImagePreview(url);
    setErrorMessage(null);
    setRawOcrText(null);

    // Si tiene configurada API key de Gemini, arranca Visión por IA por defecto
    // Si no, o si seleccionó Tesseract, arranca el motor correspondiente
    if (geminiApiKey && engineMode === 'ai') {
      runGeminiScan(blob, geminiApiKey);
    } else if (engineMode === 'tesseract') {
      runTesseractScan(blob);
    }
  };

  const mergeNewMatches = (newMatches: MatchResult[]) => {
    setMatches((prev) => {
      const existingIds = new Set(prev.map((m) => m.quest.id));
      const filtered = newMatches.filter((m) => !existingIds.has(m.quest.id));
      const combined = [...prev, ...filtered];
      // Auto-seleccionar todas las detectadas
      setSelectedQuestIds(combined.map((m) => m.quest.id));
      return combined;
    });
  };

  const runTesseractScan = async (blob: Blob) => {
    setIsScanning(true);
    setErrorMessage(null);
    setScanProgress(10);
    setScanStatusText(language === 'es' ? 'Optimizando captura para fuentes oscuras...' : 'Optimizing capture for dark game UI...');

    try {
      const result = await scanImageWithTesseract(
        blob,
        (progress, status) => {
          setScanProgress(progress);
          setScanStatusText(status);
        },
        customQuests
      );

      setRawOcrText(result.rawText);
      mergeNewMatches(result.matches);

      if (result.matches.length === 0) {
        setErrorMessage(
          language === 'es'
            ? 'No se detectaron misiones con suficiente coincidencia en el texto local. Puedes probar con Visión por IA (Gemini) o añadir el título manualmente.'
            : 'No quests clearly matched locally. Try AI Vision (Gemini) or add missing titles manually below.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error durante el reconocimiento OCR');
    } finally {
      setIsScanning(false);
    }
  };

  const runGeminiScan = async (blobToScan?: Blob, keyToUse?: string) => {
    const targetBlob = blobToScan || currentBlob;
    const key = keyToUse || tempApiKey || geminiApiKey;

    if (!targetBlob) return;

    if (!key.trim()) {
      setShowKeyInput(true);
      setErrorMessage(
        language === 'es'
          ? 'Introduce tu API Key de Gemini para activar la Visión por IA (es gratuita en Google AI Studio).'
          : 'Please provide a Gemini API Key to use AI Vision (free on Google AI Studio).'
      );
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setScanStatusText(language === 'es' ? 'Analizando captura con Gemini Vision...' : 'Analyzing screen capture with Gemini Vision...');

    try {
      const results = await scanImageWithGeminiVision(targetBlob, key);
      mergeNewMatches(results);

      if (results.length === 0) {
        setErrorMessage(
          language === 'es'
            ? 'Gemini no identificó misiones de Arc Raiders en esta imagen.'
            : 'Gemini did not find Arc Raiders quests in this image.'
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-100">
              {language === 'es' ? 'Ingesta Visual de Misiones (Logbook OCR)' : 'Quest Visual Ingestion (Logbook OCR)'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Switcher Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950/80 text-xs font-mono">
          <span className="text-neutral-400 font-bold uppercase text-[11px]">
            {language === 'es' ? 'Motor de Análisis:' : 'Analysis Engine:'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEngineMode('ai');
                if (currentBlob && geminiApiKey) runGeminiScan(currentBlob, geminiApiKey);
              }}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 ${
                engineMode === 'ai'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Visión IA (Gemini 99%)</span>
            </button>

            <button
              onClick={() => {
                setEngineMode('tesseract');
                if (currentBlob) runTesseractScan(currentBlob);
              }}
              className={`px-3 py-1 rounded-lg font-bold uppercase transition-all flex items-center gap-1.5 ${
                engineMode === 'tesseract'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>OCR Local (Offline)</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Gemini API Key Configuration Section (Collapsible or Shown when needed) */}
          {(showKeyInput || engineMode === 'ai') && (
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-300 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Gemini API Key {geminiApiKey ? '(Configurada ✓)' : '(Requerida para IA)'}</span>
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
                    setShowKeyInput(false);
                    setTimeout(() => setIsKeySaved(false), 2000);
                    if (currentBlob) {
                      runGeminiScan(currentBlob, tempApiKey);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono transition-colors"
                >
                  {isKeySaved ? '✓ Guardada' : (language === 'es' ? 'Guardar y Usar' : 'Save & Use')}
                </button>
              </div>
            </div>
          )}

          {/* Dropzone / Upload area */}
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
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageLoaded(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <ClipboardPaste className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-neutral-200 uppercase">
                  {language === 'es' ? 'Pulsa Ctrl+V o haz clic para cargar captura de pantalla' : 'Press Ctrl+V or click to load screenshot'}
                </p>
                <p className="text-[11px] font-mono text-neutral-500 mt-1">
                  {language === 'es'
                    ? 'Captura con Win+Shift+S la lista de misiones minimizadas en Arc Raiders'
                    : 'Use Win+Shift+S on your Arc Raiders minimized quests logbook'}
                </p>
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
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black border border-neutral-700 text-[10px] font-mono text-amber-400 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>{language === 'es' ? '+ Añadir 2ª captura' : '+ Add 2nd screenshot'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setCurrentBlob(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-black/80 border border-neutral-700 text-[10px] font-mono text-neutral-300 hover:text-white"
                  >
                    {language === 'es' ? 'Quitar' : 'Remove'}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageLoaded(e.target.files[0]);
                    }
                  }}
                />
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

              {/* Action buttons when image loaded but scan didn't run */}
              {!isScanning && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => (engineMode === 'ai' ? runGeminiScan() : runTesseractScan(currentBlob!))}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs font-mono uppercase flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                  >
                    {engineMode === 'ai' ? <Sparkles className="w-4 h-4" /> : <ClipboardPaste className="w-4 h-4" />}
                    <span>{language === 'es' ? 'Volver a escanear captura' : 'Re-scan capture'}</span>
                  </button>
                </div>
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

          {/* Raw OCR Text Toggle (Useful for debugging/transparency) */}
          {rawOcrText && (
            <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/60">
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="w-full px-3 py-2 flex items-center justify-between text-[11px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'Ver texto extraído por OCR' : 'View extracted OCR raw text'}</span>
                </span>
                {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRawText && (
                <pre className="p-3 text-[10px] font-mono text-neutral-300 whitespace-pre-wrap bg-neutral-950 border-t border-neutral-800 max-h-36 overflow-y-auto">
                  {rawOcrText}
                </pre>
              )}
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

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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

          {/* Manual Add by Title fallback in Capture Modal */}
          <div className="pt-3 border-t border-neutral-800 space-y-2">
            <span className="text-[11px] font-mono text-neutral-400">
              {language === 'es'
                ? '¿Falta alguna misión? Añádela directamente por título:'
                : 'Missing any quest? Add it directly by title:'}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualTitle.trim()) {
                    const newQ = addCustomQuest(manualTitle.trim());
                    setMatches((prev) => [
                      { quest: newQ, confidence: 100, matchedText: manualTitle.trim() },
                      ...prev,
                    ]);
                    setSelectedQuestIds((prev) => [...prev, newQ.id]);
                    setManualTitle('');
                  }
                }}
                placeholder={
                  language === 'es'
                    ? 'Escribe el título de la misión...'
                    : 'Type quest title...'
                }
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 font-mono focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={!manualTitle.trim()}
                onClick={() => {
                  if (manualTitle.trim()) {
                    const newQ = addCustomQuest(manualTitle.trim());
                    setMatches((prev) => [
                      { quest: newQ, confidence: 100, matchedText: manualTitle.trim() },
                      ...prev,
                    ]);
                    setSelectedQuestIds((prev) => [...prev, newQ.id]);
                    setManualTitle('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs font-mono uppercase transition-all shadow-sm"
              >
                + {language === 'es' ? 'Añadir' : 'Add'}
              </button>
            </div>
          </div>
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
