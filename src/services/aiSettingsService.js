const getApi = () => window.electronAPI?.aiSettings;

const aiSettingsService = {
  async get() {
    const api = getApi();
    if (!api?.get) throw new Error("AI settings are available in the GURO desktop app.");
    return api.get();
  },
  async save(settings) {
    const api = getApi();
    if (!api?.save) throw new Error("AI settings are available in the GURO desktop app.");
    return api.save(settings);
  },
  async remove() {
    const api = getApi();
    if (!api?.remove) throw new Error("AI settings are available in the GURO desktop app.");
    return api.remove();
  },
  async test(settings) {
    const api = getApi();
    if (!api?.test) throw new Error("AI settings are available in the GURO desktop app.");
    return api.test(settings);
  },
  async isConfigured() {
    return Boolean(await getApi()?.isConfigured?.());
  },
};

export default aiSettingsService;
