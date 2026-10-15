import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Shield, GitPullRequest, CheckCircle2 } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { language } = usePlayerStore();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase">
          <Shield className="w-3.5 h-3.5" />
          <span>GNU AGPLv3 Open Source</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-neutral-100">
          ARC Raiders Tactical Companion
        </h1>

        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
          {language === 'es'
            ? 'Una aplicación complementaria de código abierto y libre distribución construida por y para la comunidad de ARC Raiders. Diseñada para eliminar la sobrecarga de gestionar 15+ misiones simultáneas y optimizar rutas de raid en el menor número de incursiones posible.'
            : 'An open-source, community-driven companion app for ARC Raiders. Built to eliminate the cognitive overload of tracking 15+ simultaneous quests and optimize raid routes to achieve maximum completions per drop.'}
        </p>

        <div className="pt-2 flex flex-wrap gap-3 text-xs font-mono text-neutral-400">
          <span className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{language === 'es' ? 'Local-First (Sin Servidores)' : 'Local-First (Zero Server Costs)'}</span>
          </span>
          <span className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{language === 'es' ? 'Privacidad 100% en Navegador' : '100% In-Browser Privacy'}</span>
          </span>
          <span className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{language === 'es' ? 'Validación de Datos con Zod' : 'Zod Schema Validated'}</span>
          </span>
        </div>
      </div>

      {/* Community Contribution Guide */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <GitPullRequest className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-100">
            {language === 'es' ? 'Cómo Colaborar con Nuevas Misiones y Mapas' : 'How to Contribute Quests & Maps'}
          </h2>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          {language === 'es'
            ? 'Toda la base de datos de misiones, mapas, POIs y objetos está guardada en archivos JSON abiertos en '
            : 'All mission, map, POI and item data is stored in open JSON files inside '}
          <code className="text-amber-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">src/data/</code>.
        </p>

        <div className="space-y-2 text-xs text-neutral-400 font-mono">
          <div className="flex items-start gap-2">
            <span className="text-amber-400">1.</span>
            <span>
              {language === 'es'
                ? 'Edita o añade misiones en src/data/quests.json.'
                : 'Edit or add quests in src/data/quests.json.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400">2.</span>
            <span>
              {language === 'es'
                ? 'Ejecuta npm test para validar que Zod no detecte IDs o referencias rotas.'
                : 'Run npm test to ensure Zod verifies zero broken IDs or orphaned references.'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400">3.</span>
            <span>
              {language === 'es'
                ? 'Abre una Pull Request en GitHub para que tus aportaciones lleguen a todos los jugadores.'
                : 'Open a Pull Request on GitHub to share your additions with all raiders.'}
            </span>
          </div>
        </div>
      </div>

      {/* License Card */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 text-xs text-neutral-400 space-y-2 font-mono">
        <div className="flex items-center justify-between text-neutral-200 font-bold">
          <span>GNU AFFERO GENERAL PUBLIC LICENSE (AGPLv3)</span>
          <span className="text-amber-400">Flickzman</span>
        </div>
        <p className="text-[11px] text-neutral-500 leading-relaxed">
          {language === 'es'
            ? 'Este programa es software libre: puedes redistribuirlo y/o modificarlo bajo los términos de la Licencia Pública General Affero de GNU tal como fue publicada por la Free Software Foundation, versión 3. Protege las libertades de los usuarios incluso cuando se ejecuta a través de una red o servidor web.'
            : 'This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3. Protects user freedoms even when executed across a web server.'}
        </p>
      </div>
    </div>
  );
};
