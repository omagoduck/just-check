import { Model } from "../types";
import { GoogleModels } from "./google";
import { OpenrouterModels } from "./openrouter";

export * from './google';
export * from './openrouter';
export const allInternalModels: Model[] = [...GoogleModels, ...OpenrouterModels];