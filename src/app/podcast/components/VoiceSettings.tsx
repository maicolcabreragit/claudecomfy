"use client";

import { cn } from "@/lib/utils";
import type { VoiceSettings } from "./types";

interface VoiceSettingsControlProps {
  value: VoiceSettings;
  onChange: (value: VoiceSettings) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * VoiceSettingsControl - Sliders to adjust TTS parameters
 */
export function VoiceSettingsControl({
  value,
  onChange,
  className,
  disabled = false,
}: VoiceSettingsControlProps) {
  const handleChange = (key: keyof VoiceSettings, newValue: number) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Stability slider */}
      <SliderSetting
        label="Estabilidad"
        description="Mayor = más consistente, Menor = más expresivo"
        value={value.stability}
        onChange={(v) => handleChange("stability", v)}
        min={0}
        max={1}
        step={0.05}
        disabled={disabled}
        lowLabel="Expresivo"
        highLabel="Estable"
      />

      {/* Similarity slider */}
      <SliderSetting
        label="Similitud"
        description="Qué tan fiel es a la voz original"
        value={value.similarity_boost}
        onChange={(v) => handleChange("similarity_boost", v)}
        min={0}
        max={1}
        step={0.05}
        disabled={disabled}
        lowLabel="Menos similar"
        highLabel="Más similar"
      />

      {/* Style slider (optional) */}
      {value.style !== undefined && (
        <SliderSetting
          label="Estilo"
          description="Exageración del estilo de la voz"
          value={value.style}
          onChange={(v) => handleChange("style", v)}
          min={0}
          max={1}
          step={0.05}
          disabled={disabled}
          lowLabel="Natural"
          highLabel="Exagerado"
        />
      )}

      {/* Speaker boost toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground">
            Claridad de voz
          </div>
          <div className="text-xs text-zinc-500">
            Mejora la nitidez del audio
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...value, use_speaker_boost: !value.use_speaker_boost })}
          disabled={disabled}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors",
            value.use_speaker_boost
              ? "bg-accent-purple"
              : "bg-surface-border",
            "disabled:opacity-50"
          )}
        >
          <div className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
            value.use_speaker_boost ? "left-6" : "left-1"
          )} />
        </button>
      </div>

      {/* Preset buttons */}
      <div className="pt-2 border-t border-surface-border">
        <div className="text-xs text-zinc-500 mb-2">Presets rápidos:</div>
        <div className="flex gap-2">
          <PresetButton
            label="Podcast"
            onClick={() => onChange({
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0,
              use_speaker_boost: true,
            })}
            isActive={
              value.stability === 0.5 && 
              value.similarity_boost === 0.75
            }
            disabled={disabled}
          />
          <PresetButton
            label="Dinámico"
            onClick={() => onChange({
              stability: 0.3,
              similarity_boost: 0.8,
              style: 0.2,
              use_speaker_boost: true,
            })}
            isActive={
              value.stability === 0.3 && 
              value.similarity_boost === 0.8
            }
            disabled={disabled}
          />
          <PresetButton
            label="Narración"
            onClick={() => onChange({
              stability: 0.7,
              similarity_boost: 0.6,
              style: 0,
              use_speaker_boost: true,
            })}
            isActive={
              value.stability === 0.7 && 
              value.similarity_boost === 0.6
            }
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

interface SliderSettingProps {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  lowLabel?: string;
  highLabel?: string;
}

function SliderSetting({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  lowLabel,
  highLabel,
}: SliderSettingProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="ml-2 text-xs text-zinc-500">{Math.round(value * 100)}%</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className={cn(
          "w-full h-2 rounded-full appearance-none cursor-pointer",
          "bg-surface-border",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
          "[&::-webkit-slider-thumb]:bg-accent-purple [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:cursor-pointer",
          "[&::-webkit-slider-thumb]:shadow-md",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        style={{
          background: `linear-gradient(to right, rgb(139, 92, 246) ${percentage}%, rgb(63, 63, 70) ${percentage}%)`,
        }}
      />
      {(lowLabel || highLabel) && (
        <div className="flex justify-between mt-1 text-xs text-zinc-600">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
      <div className="text-xs text-zinc-500 mt-1">{description}</div>
    </div>
  );
}

interface PresetButtonProps {
  label: string;
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
}

function PresetButton({ label, onClick, isActive, disabled }: PresetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3 py-1 text-xs rounded-full transition-colors",
        isActive
          ? "bg-accent-purple text-white"
          : "bg-surface-elevated text-zinc-400 hover:text-foreground hover:bg-surface-overlay",
        "disabled:opacity-50"
      )}
    >
      {label}
    </button>
  );
}
