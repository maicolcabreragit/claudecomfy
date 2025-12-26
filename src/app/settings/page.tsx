"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Check, 
  X, 
  Loader2, 
  Eye, 
  EyeOff,
  Sparkles,
  Palette,
  Sliders,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// Types
type AIProvider = "ANTHROPIC" | "OPENROUTER";
type Theme = "DARK" | "LIGHT" | "SYSTEM";
type Language = "ES" | "EN";

interface Model {
  id: string;
  name: string;
}

interface UserSettings {
  aiProvider: AIProvider;
  preferredModel: string;
  hasOpenrouterKey: boolean;
  hasAnthropicKey: boolean;
  temperature: number;
  maxTokens: number;
  theme: Theme;
  language: Language;
}

// Collapsible Section Component
function SettingsSection({ 
  title, 
  icon: Icon, 
  children,
  defaultOpen = true 
}: { 
  title: string; 
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-surface-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center gap-3 bg-surface-elevated hover:bg-surface-hover transition-colors"
      >
        <Icon className="h-4 w-4 text-accent-purple" />
        <span className="font-medium text-sm">{title}</span>
        <span className="ml-auto text-zinc-500">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className="px-4 py-4 space-y-4 bg-surface-base">
          {children}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  // Form state
  const [provider, setProvider] = useState<AIProvider>("ANTHROPIC");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("claude-opus-4-5-20251101");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [theme, setTheme] = useState<Theme>("DARK");
  const [language, setLanguage] = useState<Language>("ES");
  
  // Connection test state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [connectionMessage, setConnectionMessage] = useState("");

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data: UserSettings = await res.json();
        setSettings(data);
        setProvider(data.aiProvider);
        setSelectedModel(data.preferredModel);
        setTemperature(data.temperature);
        setMaxTokens(data.maxTokens);
        setTheme(data.theme);
        setLanguage(data.language);
        
        // Set connection status based on existing keys
        if (data.aiProvider === "OPENROUTER" && data.hasOpenrouterKey) {
          setConnectionStatus("success");
        } else if (data.aiProvider === "ANTHROPIC" && data.hasAnthropicKey) {
          setConnectionStatus("success");
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    const keyToTest = provider === "OPENROUTER" ? openrouterKey : anthropicKey;
    
    // If no new key entered, but we have one saved, show success
    if (!keyToTest && settings) {
      if ((provider === "OPENROUTER" && settings.hasOpenrouterKey) ||
          (provider === "ANTHROPIC" && settings.hasAnthropicKey)) {
        setConnectionStatus("success");
        setConnectionMessage("API key ya configurada");
        return;
      }
    }
    
    if (!keyToTest) {
      setConnectionStatus("error");
      setConnectionMessage("Introduce una API key");
      return;
    }

    setTestingConnection(true);
    setConnectionStatus("idle");

    try {
      const res = await fetch("/api/settings/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: keyToTest }),
      });

      const data = await res.json();

      if (data.success) {
        setConnectionStatus("success");
        setConnectionMessage(data.message);
        setAvailableModels(data.models || []);
        
        // Auto-select first model if none selected
        if (data.models?.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].id);
        }
      } else {
        setConnectionStatus("error");
        setConnectionMessage(data.error || "Error de conexión");
      }
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage("Error de red");
    } finally {
      setTestingConnection(false);
    }
  }

  async function saveSettings() {
    setSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        aiProvider: provider,
        preferredModel: selectedModel,
        temperature,
        maxTokens,
        theme,
        language,
      };

      // Only send key if new one entered
      if (openrouterKey) {
        updateData.openrouterApiKey = openrouterKey;
      }
      if (anthropicKey) {
        updateData.anthropicApiKey = anthropicKey;
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        // Clear key fields after save
        setOpenrouterKey("");
        setAnthropicKey("");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-purple" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
          <Settings className="h-6 w-6 text-accent-purple" />
          <h1 className="text-xl font-semibold">Ajustes</h1>
        </div>

        {/* AI Provider Section */}
        <SettingsSection title="Proveedor de IA" icon={Sparkles}>
          {/* Provider Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setProvider("ANTHROPIC");
                setConnectionStatus("idle");
              }}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                provider === "ANTHROPIC"
                  ? "border-accent-purple bg-accent-purple/10 text-accent-purple"
                  : "border-surface-border hover:border-zinc-600"
              }`}
            >
              Anthropic
            </button>
            <button
              onClick={() => {
                setProvider("OPENROUTER");
                setConnectionStatus("idle");
              }}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                provider === "OPENROUTER"
                  ? "border-accent-purple bg-accent-purple/10 text-accent-purple"
                  : "border-surface-border hover:border-zinc-600"
              }`}
            >
              OpenRouter
            </button>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">
              {provider === "OPENROUTER" ? "OpenRouter API Key" : "Anthropic API Key"}
              {((provider === "OPENROUTER" && settings?.hasOpenrouterKey) ||
                (provider === "ANTHROPIC" && settings?.hasAnthropicKey)) && (
                <span className="ml-2 text-green-500 text-xs">✓ Configurada</span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={provider === "OPENROUTER" ? (showOpenrouterKey ? "text" : "password") : (showAnthropicKey ? "text" : "password")}
                  value={provider === "OPENROUTER" ? openrouterKey : anthropicKey}
                  onChange={(e) => provider === "OPENROUTER" 
                    ? setOpenrouterKey(e.target.value) 
                    : setAnthropicKey(e.target.value)
                  }
                  placeholder={provider === "OPENROUTER" ? "sk-or-..." : "sk-ant-..."}
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-surface-elevated border border-surface-border focus:border-accent-purple focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => provider === "OPENROUTER" 
                    ? setShowOpenrouterKey(!showOpenrouterKey)
                    : setShowAnthropicKey(!showAnthropicKey)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {(provider === "OPENROUTER" ? showOpenrouterKey : showAnthropicKey) 
                    ? <EyeOff className="h-4 w-4" /> 
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>
              <Button
                onClick={testConnection}
                disabled={testingConnection}
                variant="outline"
                className="shrink-0"
              >
                {testingConnection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Probar"
                )}
              </Button>
            </div>
            
            {/* Connection Status */}
            {connectionStatus !== "idle" && (
              <div className={`flex items-center gap-2 text-sm ${
                connectionStatus === "success" ? "text-green-500" : "text-red-500"
              }`}>
                {connectionStatus === "success" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {connectionMessage}
              </div>
            )}
          </div>

          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Modelo</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-surface-border focus:border-accent-purple focus:outline-none transition-colors"
            >
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="claude-opus-4-5-20251101">Claude Opus 4.5</option>
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                </>
              )}
            </select>
          </div>
        </SettingsSection>

        {/* Parameters Section */}
        <SettingsSection title="Parámetros" icon={Sliders}>
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-zinc-400">Temperature</label>
              <span className="text-zinc-300">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-accent-purple"
            />
            <p className="text-xs text-zinc-500">
              Menor = más determinista, Mayor = más creativo
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label className="text-zinc-400">Max Tokens</label>
              <span className="text-zinc-300">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-accent-purple"
            />
            <p className="text-xs text-zinc-500">
              Límite de tokens en cada respuesta
            </p>
          </div>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Apariencia" icon={Palette}>
          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Tema</label>
            <div className="flex gap-2">
              {(["DARK", "LIGHT", "SYSTEM"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    theme === t
                      ? "border-accent-purple bg-accent-purple/10 text-accent-purple"
                      : "border-surface-border hover:border-zinc-600"
                  }`}
                >
                  {t === "DARK" ? "🌙 Oscuro" : t === "LIGHT" ? "☀️ Claro" : "💻 Sistema"}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Idioma</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage("ES")}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  language === "ES"
                    ? "border-accent-purple bg-accent-purple/10 text-accent-purple"
                    : "border-surface-border hover:border-zinc-600"
                }`}
              >
                <Globe className="h-4 w-4 inline mr-2" />
                Español
              </button>
              <button
                onClick={() => setLanguage("EN")}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  language === "EN"
                    ? "border-accent-purple bg-accent-purple/10 text-accent-purple"
                    : "border-surface-border hover:border-zinc-600"
                }`}
              >
                <Globe className="h-4 w-4 inline mr-2" />
                English
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={saveSettings}
            disabled={saving}
            variant="primary"
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
