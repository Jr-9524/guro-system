import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Database,
  Download,
  FileText,
  FolderOpen,
  MonitorCog,
  Upload,
  Users,
  CheckCircle2,
  Notebook,
  Palette,
  History,
} from "lucide-react";
import Button from "../components/common/Button";
import Stat from "../components/common/Stat";
import Modal from "../components/common/Modal";
import PageHeader from "../components/common/PageHeader";
import iepService from "../services/iepService";
import studentService from "../services/studentService";
import {
  createWorkspaceBackup,
  downloadWorkspaceBackup,
  getBackupSummary,
  parseWorkspaceBackup,
  restoreWorkspaceBackup,
} from "../services/workspaceBackupService";
import auditService from "../services/auditService";
import workspaceStoreService from "../services/workspaceStoreService";
import useThemeStore from "../stores/themeStore";
import useAuthStore from "../stores/authStore";
import { hasPermission, isAdmin, PERMISSIONS } from "../utils/permissions";
import { themeDefinitions, themeOptions } from "../styles/themes";

const PREFERENCES_KEY = "app-preferences";

const defaultPreferences = {
  autoSaveIepDrafts: true,
  calendarReviewReminders: true,
  compactReportTables: false,
};

const loadPreferences = async () => ({
  ...defaultPreferences,
  ...(await workspaceStoreService.get(PREFERENCES_KEY, {})),
});

const Settings = () => {
  const { currentTheme, setTheme } = useThemeStore();
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [ieps, setIeps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreBackup, setRestoreBackup] = useState(null);
  const [restoreError, setRestoreError] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDatabaseBackupRunning, setIsDatabaseBackupRunning] =
    useState(false);
  const [isDatabaseRestoreRunning, setIsDatabaseRestoreRunning] =
    useState(false);
  const [databaseRestoreComplete, setDatabaseRestoreComplete] =
    useState(false);

  useEffect(() => {
    let isCurrent = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [studentRecords, iepRecords, savedPreferences] =
          await Promise.all([
            studentService.getAll(),
            iepService.getAll(),
            loadPreferences(),
          ]);
        if (!isCurrent) return;
        setStudents(studentRecords);
        setIeps(iepRecords);
        setPreferences(savedPreferences);
      } catch (error) {
        toast.error(error.message || "Failed to load settings summary");
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isCurrent = false;
    };
  }, []);

  const storageStats = useMemo(() => {
    const activeIeps = ieps.filter((iep) => iep.status === "complete").length;
    const draftIeps = ieps.filter((iep) => iep.status === "draft").length;
    const studentsWithIeps = new Set(ieps.map((iep) => iep.studentId)).size;

    return {
      activeIeps,
      draftIeps,
      studentsWithIeps,
      coverage: students.length
        ? Math.round((studentsWithIeps / students.length) * 100)
        : 0,
    };
  }, [ieps, students]);

  const updatePreference = async (key, value) => {
    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);
    await workspaceStoreService.set(PREFERENCES_KEY, nextPreferences);
    toast.success("Preference saved");
  };

  const resetPreferences = async () => {
    setPreferences(defaultPreferences);
    await workspaceStoreService.set(PREFERENCES_KEY, defaultPreferences);
    toast.success("Preferences reset");
  };

  const createDatabaseBackup = async () => {
    if (!window.electronAPI?.backup?.createBackup) {
      toast.error("Database backup is available in the GURO desktop app");
      return;
    }

    setIsDatabaseBackupRunning(true);
    try {
      const result = await window.electronAPI.backup.createBackup();
      if (result.canceled) return;
      if (!result.success) throw new Error(result.message);
      toast.success("Full database backup created successfully");
    } catch (error) {
      toast.error(error.message || "Could not create the database backup");
    } finally {
      setIsDatabaseBackupRunning(false);
    }
  };

  const restoreDatabaseBackup = async () => {
    const confirmed = window.confirm(
      "Restoring a backup will replace the current local data. Please create a backup first before continuing.",
    );
    if (!confirmed) return;

    if (!window.electronAPI?.backup?.restoreBackup) {
      toast.error("Database restore is available in the GURO desktop app");
      return;
    }

    setIsDatabaseRestoreRunning(true);
    try {
      const result = await window.electronAPI.backup.restoreBackup();
      if (result.canceled) return;
      if (!result.success) throw new Error(result.message);
      setDatabaseRestoreComplete(true);
      toast.success(
        result.message ||
          "Restore completed. Please restart GURO System to reload the restored data.",
        { duration: 10000 },
      );
    } catch (error) {
      toast.error(error.message || "Could not restore the database backup", {
        duration: 8000,
      });
    } finally {
      setIsDatabaseRestoreRunning(false);
    }
  };

  const openDatabaseBackupFolder = async () => {
    try {
      const result = await window.electronAPI?.backup?.openBackupFolder();
      if (!result?.success) {
        throw new Error(result?.message || "Could not open the backup folder");
      }
    } catch (error) {
      toast.error(error.message || "Could not open the backup folder");
    }
  };

  const exportBackup = async () => {
    try {
      const backup = await createWorkspaceBackup({
        theme: currentTheme,
        preferences,
      });
      downloadWorkspaceBackup(backup);
      auditService.log({
        type: "data",
        title: "Workspace backup downloaded",
        description: `${backup.data.students.length} students, ${backup.data.ieps.length} IEPs, ${backup.data.progressSessions.length} progress logs`,
        entity: "backup",
        href: "/settings",
      });
      toast.success("Workspace backup downloaded");
    } catch (error) {
      toast.error(error.message || "Could not create backup");
    }
  };

  const handleRestoreFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setRestoreError("");
      setRestoreBackup(parseWorkspaceBackup(await file.text()));
    } catch (error) {
      setRestoreBackup(null);
      setRestoreError(error.message);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreBackup) return;

    setIsRestoring(true);
    try {
      const result = await restoreWorkspaceBackup(restoreBackup, { setTheme });
      setPreferences({
        ...defaultPreferences,
        ...restoreBackup.settings.preferences,
      });
      const [studentRecords, iepRecords] = await Promise.all([
        studentService.getAll(),
        iepService.getAll(),
      ]);
      setStudents(studentRecords);
      setIeps(iepRecords);
      setIsRestoreModalOpen(false);
      setRestoreBackup(null);
      auditService.log({
        type: "data",
        title: "Workspace backup restored",
        description: `${result.studentsImported} students imported, ${result.studentsSkipped} skipped, ${result.iepsImported} IEPs restored`,
        entity: "backup",
        href: "/activity",
      });
      toast.success(
        `Restored ${result.studentsImported} students and ${result.iepsImported} IEPs.`,
      );
    } catch (error) {
      toast.error(error.message || "Could not restore backup");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-full w-full space-y-5">
      <PageHeader
        title="Settings"
        description="Manage appearance, workspace preferences, and permitted data tools."
      />

      <div className="grid gap-4 xl:grid">
        <div className="space-y-4">
          <SettingsPanel
            icon={Palette}
            title="Appearance"
            description="Choose how GURO looks on this device."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {themeOptions.map((theme) => (
                <ThemeOption
                  key={theme.id}
                  theme={theme}
                  selected={currentTheme === theme.id}
                  onSelect={() => setTheme(theme.id)}
                />
              ))}
            </div>
          </SettingsPanel>

          <SettingsPanel
            icon={MonitorCog}
            title="Workspace Preferences"
            description="These preferences are saved locally on this device."
          >
            <div className="divide-y divide-gray-300 rounded-md border border-gray-300">
              <PreferenceToggle
                title="Auto-save IEP draft workflow"
                description="Keep draft-oriented controls enabled while writing IEPs."
                checked={preferences.autoSaveIepDrafts}
                onChange={(value) =>
                  updatePreference("autoSaveIepDrafts", value)
                }
              />
              <PreferenceToggle
                title="Calendar review reminders"
                description="Show 30-day IEP review preparation items on the calendar."
                checked={preferences.calendarReviewReminders}
                onChange={(value) =>
                  updatePreference("calendarReviewReminders", value)
                }
              />
              <PreferenceToggle
                title="Compact report tables"
                description="Prefer denser report layouts for printing and scanning."
                checked={preferences.compactReportTables}
                onChange={(value) =>
                  updatePreference("compactReportTables", value)
                }
              />
            </div>
            <div className="mt-4">
              <button
                className="btn border border-gray-300 px-5 bg-gray-100 transition-colors hover:bg-gray-200"
                onClick={resetPreferences}
              >
                Reset Preferences
              </button>
            </div>
          </SettingsPanel>

          {hasPermission(user, PERMISSIONS.AUDIT_READ) && (
            <SettingsPanel
              icon={History}
              title="Administration"
            description="Secondary workspace tools for review and troubleshooting."
          >
            <Link
              to="/activity"
              className="flex items-center justify-between rounded-xl border border-base-300 p-4 text-sm font-semibold transition-colors hover:bg-base-200 hover:text-base-content"
            >
              <span>Open Activity Log</span>
              <span aria-hidden="true">View</span>
            </Link>
            </SettingsPanel>
          )}

          {isAdmin(user) && (
            <SettingsPanel
              icon={Database}
              title="Data Management"
            description="Protect, restore, and transfer the local GURO data on this device."
          >
            <div className="grid gap-3 md:grid-cols-4">
              <Stat label="Students" value={students.length} icon={Users} />
              <Stat label="IEPs" value={ieps.length} icon={FileText} />
              <Stat
                label="Active IEPs"
                value={storageStats.activeIeps}
                icon={CheckCircle2}
              />
              <Stat
                label="Drafts"
                value={storageStats.draftIeps}
                icon={Notebook}
              />
            </div>

            <div className="mt-5 rounded-xl border border-base-300 bg-base-200/40 p-4">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <h3 className="font-semibold">Full Database Backup</h3>
                  <p className="mt-1 text-sm text-base-content/65">
                    Backups help prevent data loss. Store backup files in a safe
                    location such as a USB drive or cloud folder.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  icon={Download}
                  loading={isDatabaseBackupRunning}
                  disabled={isDatabaseRestoreRunning || databaseRestoreComplete}
                  onClick={createDatabaseBackup}
                >
                  Create Backup
                </Button>
                <Button
                  icon={Upload}
                  variant="secondary"
                  loading={isDatabaseRestoreRunning}
                  disabled={isDatabaseBackupRunning || databaseRestoreComplete}
                  onClick={restoreDatabaseBackup}
                >
                  Restore Backup
                </Button>
                <Button
                  icon={FolderOpen}
                  variant="ghost"
                  disabled={
                    isDatabaseBackupRunning || isDatabaseRestoreRunning
                  }
                  onClick={openDatabaseBackupFolder}
                >
                  Open Backup Folder
                </Button>
              </div>

              {databaseRestoreComplete && (
                <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-semibold">
                  Restore completed. Please restart GURO System to reload the
                  restored data.
                </div>
              )}

              <div className="mt-4 flex gap-2 rounded-lg border border-warning/25 bg-warning/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-base-content" />
                <p>
                  <span className="font-semibold">
                    Restore will replace the current local database.
                  </span>{" "}
                  GURO automatically creates a safety backup first, then asks
                  you to restart the app. Full database backups are intended
                  for this GURO installation because encrypted records use its
                  protected device key.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-base-content/70 md:grid-cols-2">
              <div>
                <p className="font-medium text-base-content">Portable workspace transfer</p>
                <p className="mt-1">
                  Students, IEPs, progress logs, goal templates, reminders,
                  selected theme, and preferences.
                </p>
              </div>
              <div>
                <p className="font-medium text-base-content">Storage</p>
                <p className="mt-1">
                  Restore merges records into the current workspace and skips
                  duplicate student LRNs.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={exportBackup}
                icon={Download}
                disabled={isLoading}
              >
                Download Portable Backup
              </Button>
              <Button
                onClick={() => setIsRestoreModalOpen(true)}
                icon={Upload}
                disabled={isLoading}
              >
                Merge Portable Backup
              </Button>
              <Link to="/reports" className="btn">
                <FileText className="h-5 w-5" /> View Reports
              </Link>
            </div>
            </SettingsPanel>
          )}
        </div>
      </div>

      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="Restore Workspace Backup"
        size="2xl"
      >
        <RestoreBackupTool
          backup={restoreBackup}
          error={restoreError}
          isRestoring={isRestoring}
          onFileChange={handleRestoreFile}
          onCancel={() => setIsRestoreModalOpen(false)}
          onRestore={handleRestoreBackup}
        />
      </Modal>
    </div>
  );
};

const SettingsPanel = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-sm border border-gray-300 bg-base-100 p-5">
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-base-content/60">{description}</p>
        )}
      </div>
    </div>
    {children}
  </section>
);

const PreferenceToggle = ({ title, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 p-4">
    <span>
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-sm text-base-content/60">
        {description}
      </span>
    </span>
    <input
      type="checkbox"
      className="toggle bg-gray-200
        checked:bg-success
        border-gray-300
        checked:border-success"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
  </label>
);

const ThemeOption = ({ theme, selected, onSelect }) => {
  const colors = themeDefinitions[theme.id];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/10 ring-2 ring-primary/15"
          : "border-base-300 bg-base-100 hover:border-primary/40 hover:bg-base-200"
      }`}
    >
      <span
        className="grid h-11 w-11 shrink-0 grid-cols-2 overflow-hidden rounded-xl border border-base-300 shadow-sm"
        aria-hidden="true"
      >
        <span style={{ backgroundColor: colors.primary }} />
        <span style={{ backgroundColor: colors.secondary }} />
        <span style={{ backgroundColor: colors["base-100"] }} />
        <span style={{ backgroundColor: colors.accent }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{theme.label}</span>
        <span className="mt-0.5 block text-xs capitalize text-base-content/55">
          {theme.mode} theme
        </span>
      </span>
      {selected && (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-base-content" />
      )}
    </button>
  );
};

const RestoreBackupTool = ({
  backup,
  error,
  isRestoring,
  onFileChange,
  onCancel,
  onRestore,
}) => {
  const summary = backup ? getBackupSummary(backup) : null;

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-6 text-center transition-colors hover:bg-base-200">
        <Upload className="h-8 w-8 opacity-60" />
        <span className="font-medium">Choose GURO backup file</span>
        <span className="text-sm text-base-content/60">
          Select a JSON backup downloaded from this Settings page.
        </span>
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onFileChange}
        />
      </label>

      {error && (
        <div className="alert alert-error">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {summary && (
        <>
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-base-content" />
              <div>
                <p className="font-semibold">Restore will merge data</p>
                <p className="mt-1 text-base-content/70">
                  Existing student LRNs are skipped. IEPs with matching IDs are
                  updated. Local goal templates, reminders, theme, and
                  preferences are replaced by the backup.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MiniStat label="Students" value={summary.students} />
            <MiniStat label="IEPs" value={summary.ieps} />
            <MiniStat label="Progress Logs" value={summary.progressSessions} />
            <MiniStat label="Goal Templates" value={summary.customGoals} />
            <MiniStat
              label="Dismissed Reminders"
              value={summary.dismissedReminders}
            />
            <MiniStat label="Activity Items" value={summary.activity} />
            <MiniStat label="Version" value={summary.version || "Unknown"} />
          </div>

          <div className="rounded-lg border border-gray-300 p-4 text-sm text-base-content/70">
            <p>
              <span className="font-semibold text-base-content">Exported:</span>{" "}
              {summary.exportedAt
                ? new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(summary.exportedAt))
                : "Not recorded"}
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onRestore}
          loading={isRestoring}
          disabled={!backup}
          icon={Upload}
        >
          Restore Backup
        </Button>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }) => (
  <div className="rounded-lg bg-base-200 p-3">
    <p className="text-xs text-base-content/60">{label}</p>
    <p className="mt-1 text-lg font-bold">{value}</p>
  </div>
);

export default Settings;
