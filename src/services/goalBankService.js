import workspaceStoreService from "./workspaceStoreService";
import { CUSTOM_GOALS_KEY } from "../data/goalBankTemplates";

export const loadCustomGoals = () =>
  workspaceStoreService.get(CUSTOM_GOALS_KEY, []);

export const saveCustomGoals = (goals) =>
  workspaceStoreService.set(CUSTOM_GOALS_KEY, goals);
