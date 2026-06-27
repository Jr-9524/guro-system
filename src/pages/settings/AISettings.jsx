import { useEffect, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, KeyRound, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import AccessDenied from "../AccessDenied";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader";
import SelectInput from "../../components/forms/SelectInput";
import aiSettingsService from "../../services/aiSettingsService";
import useAuthStore from "../../stores/authStore";
import { isAdmin } from "../../utils/permissions";

const presets = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  custom: { baseUrl: "", model: "" },
};

const providerOptions = [
  { value: "groq", label: "Groq" },
  { value: "openai", label: "OpenAI" },
  { value: "custom", label: "Custom OpenAI-compatible" },
];

const initialForm = {
  provider: "groq",
  ...presets.groq,
  apiKey: "",
  temperature: 0.3,
};

const AISettings = () => {
  const { user } = useAuthStore();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    if (!isAdmin(user)) {
      return () => { isCurrent = false; };
    }
    aiSettingsService
      .get()
      .then((result) => {
        if (!isCurrent) return;
        if (!result?.success) throw new Error(result?.error || "Could not load AI settings.");
        const settings = result.settings;
        setStatus(settings);
        setForm({
          provider: settings.provider,
          baseUrl: settings.baseUrl,
          model: settings.model,
          temperature: settings.temperature,
          apiKey: "",
        });
      })
      .catch((error) => isCurrent && toast.error(error.message))
      .finally(() => isCurrent && setIsLoading(false));
    return () => { isCurrent = false; };
  }, [user]);

  if (!isAdmin(user)) return <AccessDenied />;

  const updateField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const changeProvider = (provider) =>
    setForm((current) => ({
      ...current,
      provider,
      ...presets[provider],
    }));

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const result = await aiSettingsService.test(form);
      if (!result?.success) throw new Error(result?.message || "Connection failed. Check API key, base URL, and model.");
      toast.success("AI provider connection succeeded.");
    } catch (error) {
      toast.error(error.message || "Connection failed. Check API key, base URL, and model.");
    } finally {
      setIsTesting(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const result = await aiSettingsService.save(form);
      if (!result?.success) throw new Error(result?.error || "Could not save AI settings.");
      setStatus(result.settings);
      setForm((current) => ({ ...current, apiKey: "" }));
      toast.success("AI provider settings saved.");
    } catch (error) {
      toast.error(error.message || "Could not save AI settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeSettings = async () => {
    if (!window.confirm("Remove the saved AI provider and API key from this device?")) return;
    try {
      const result = await aiSettingsService.remove();
      if (!result?.success) throw new Error(result?.error || "Could not remove AI settings.");
      setStatus({ configured: false, maskedApiKey: "", updatedAt: null });
      setForm(initialForm);
      toast.success("AI provider settings removed.");
    } catch (error) {
      toast.error(error.message || "Could not remove AI settings.");
    }
  };

  if (isLoading) {
    return <div className="flex min-h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="AI Provider Settings"
        description="Configure the AI provider used for drafting support. Teachers can use AI tools after setup."
        actions={
          <Link to="/settings" className="btn btn-ghost btn-sm gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Settings
          </Link>
        }
      />

      <section className="rounded-xl border border-base-300 bg-base-100 p-5">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-base-300 pb-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><Bot className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold">Provider configuration</h2>
              <p className="mt-1 text-sm text-base-content/60">The API key stays in the Electron backend and is not shown again after saving.</p>
            </div>
          </div>
          <span className={"badge " + (status?.configured ? "badge-success" : "badge-ghost")}>
            {status?.configured ? "Configured" : "Not configured"}
          </span>
        </div>

        <form className="space-y-5" onSubmit={saveSettings}>
          <SelectInput
            label="Provider"
            value={form.provider}
            options={providerOptions}
            onChange={changeProvider}
            required
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Base URL"
              type="url"
              value={form.baseUrl}
              onChange={(event) => updateField("baseUrl", event.target.value)}
              required
            />
            <Input
              label="Model"
              value={form.model}
              onChange={(event) => updateField("model", event.target.value)}
              required
            />
          </div>
          <Input
            label="API Key"
            type="password"
            value={form.apiKey}
            onChange={(event) => updateField("apiKey", event.target.value)}
            placeholder={status?.configured ? "Leave blank to keep the saved key" : "Enter provider API key"}
            autoComplete="new-password"
            helperText={status?.maskedApiKey ? "Configured: " + status.maskedApiKey : "Required when saving for the first time."}
          />
          <Input
            label="Temperature"
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={form.temperature}
            onChange={(event) => updateField("temperature", event.target.value)}
            helperText="Lower values are more consistent; higher values are more varied."
            required
          />

          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
            <p className="font-semibold">Keep this credential private</p>
            <p className="mt-1 text-base-content/70">Do not share your API key. Only administrators should update this setting.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-base-300 pt-4">
            <Button type="button" variant="secondary" icon={KeyRound} loading={isTesting} onClick={testConnection}>
              Test Connection
            </Button>
            <Button type="submit" icon={CheckCircle2} loading={isSaving}>
              Save AI Settings
            </Button>
            {status?.configured && (
              <Button type="button" variant="danger" icon={Trash2} onClick={removeSettings}>
                Remove API Key
              </Button>
            )}
          </div>
        </form>

        {status?.updatedAt && (
          <p className="mt-4 text-xs text-base-content/55">Last updated {new Date(status.updatedAt).toLocaleString()}</p>
        )}
      </section>
    </div>
  );
};

export default AISettings;
