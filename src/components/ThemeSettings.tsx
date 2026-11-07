import { Palette, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import {
  DEFAULT_PRIMARY_COLOR,
  PRIMARY_PRESETS,
  applyPrimaryColor,
  loadPrimaryColor,
  resetPrimaryColor,
  savePrimaryColor,
} from '../utils/theme';

export const ThemeSettings = () => {
  const [color, setColor] = useState(() => loadPrimaryColor() ?? DEFAULT_PRIMARY_COLOR);

  const changeColor = (hex: string) => {
    setColor(hex);
    applyPrimaryColor(hex);
    savePrimaryColor(hex);
  };

  const restoreDefault = () => {
    setColor(DEFAULT_PRIMARY_COLOR);
    resetPrimaryColor();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Palette className="w-4 h-4" /> Colore principale
        </span>
        <button
          type="button"
          onClick={restoreDefault}
          className="cursor-pointer flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <RotateCcw className="w-3 h-3" /> Ripristina
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {PRIMARY_PRESETS.map((preset) => {
          const selected = preset.hex.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              title={preset.label}
              aria-label={`Colore ${preset.label}`}
              aria-pressed={selected}
              onClick={() => changeColor(preset.hex)}
              style={{ backgroundColor: preset.hex }}
              className={`cursor-pointer w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                selected ? 'border-slate-900 dark:border-white' : 'border-transparent'
              }`}
            />
          );
        })}
        <label className="cursor-pointer flex items-center gap-2 pl-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <input
            type="color"
            value={color}
            onChange={(e) => changeColor(e.target.value)}
            aria-label="Colore personalizzato"
            className="w-8 h-8 p-0 border-0 bg-transparent rounded-full cursor-pointer"
          />
          Personalizzato
        </label>
      </div>
    </div>
  );
};
