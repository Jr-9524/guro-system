// src/stores/iepWizardStore.js
import { create } from "zustand";
import workspaceStoreService from "../services/workspaceStoreService";

const IEP_DRAFTS_KEY = "iep_drafts";

const useIEPWizardStore = create((set, get) => ({
  currentStep: 1,
  totalSteps: 6,
  isDirty: false,
  studentId: null,

  iepData: {
    step1: {
      meetingDate: "",
      startDate: "",
      endDate: "",
      teamMembers: [],
    },
    step2: {
      presentLevels: [],
    },
    step3: {
      goals: [],
    },
    step4: {
      services: [],
    },
    step5: {
      accommodations: [],
    },
    step6: {
      parentConsent: false,
      consentDate: "",
      signatures: [],
    },
  },

  setStudentId: (id) => set({ studentId: id }),

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (step) => {
    if (step >= 1 && step <= get().totalSteps) {
      set({ currentStep: step });
    }
  },

  updateStepData: (stepKey, data) => {
    set((state) => ({
      iepData: {
        ...state.iepData,
        [stepKey]: data,
      },
      isDirty: true,
    }));
  },

  resetWizard: () => {
    set({
      currentStep: 1,
      isDirty: false,
      studentId: null,
      iepData: {
        step1: { meetingDate: "", startDate: "", endDate: "", teamMembers: [] },
        step2: { presentLevels: [] },
        step3: { goals: [] },
        step4: { services: [] },
        step5: { accommodations: [] },
        step6: { parentConsent: false, consentDate: "", signatures: [] },
      },
    });
  },

  saveDraft: async () => {
    try {
      const { studentId, iepData } = get();
      const drafts = await workspaceStoreService.get(IEP_DRAFTS_KEY, []);

      const draft = {
        id: Date.now(),
        studentId,
        data: iepData,
        currentStep: get().currentStep,
        lastSaved: new Date().toISOString(),
      };

      // Remove existing draft for this student
      const filtered = drafts.filter((d) => d.studentId !== studentId);
      filtered.push(draft);

      await workspaceStoreService.set(IEP_DRAFTS_KEY, filtered);
      set({ isDirty: false });

      return true;
    } catch (error) {
      console.error("Failed to save draft:", error);
      return false;
    }
  },

  loadDraft: async (studentId) => {
    const drafts = await workspaceStoreService.get(IEP_DRAFTS_KEY, []);
    const draft = drafts.find((d) => d.studentId === studentId);

    if (draft) {
      set({
        studentId: draft.studentId,
        iepData: draft.data,
        currentStep: draft.currentStep,
        isDirty: false,
      });
      return true;
    }
    return false;
  },
}));

export default useIEPWizardStore;
