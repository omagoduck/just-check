import { Model } from '../types';

export const OpenrouterModels: Model[] = [
    {
        name: 'Mimo V2 Flash',
        id: 'xiaomi/mimo-v2-flash:free',
        provider: 'openrouter',
        pricing: {
            input: 0,
            output: 0,
        },
        description: 'A fast, free model provided by Xiaomi via OpenRouter.'
    },
    {
        name: 'GPT-4o Mini',
        id: 'openai/gpt-4o-mini',
        provider: 'openrouter',
        pricing: {
            input: 0.15,
            output: 0.6,
        },
        description: 'OpenAI\'s efficient small model with multimodal capabilities.'
    },
    // Fast persona models
    {
        name: 'Trinity Large Preview',
        id: 'arcee-ai/trinity-large-preview:free',
        provider: 'openrouter',
        pricing: {
            input: 500,
            output: 2000,
        },
        description: 'Model for Fast persona (Arcee AI).'
    },
    // Thinker persona model
    {
        name: 'Nemotron 3 Nano 30B',
        id: 'nvidia/nemotron-3-nano-30b-a3b:free',
        provider: 'openrouter',
        pricing: {
            input: 1,
            output: 5,
        },
        description: 'Model for Thinker persona (NVIDIA).'
    },
    // Pro Thinker persona model
    {
        name: 'GLM 4.5 Air',
        id: 'z-ai/glm-4.5-air:free',
        provider: 'openrouter',
        pricing: {
            input: 2,
            output: 6,
        },
        description: 'Model for Pro Thinker persona (Zhipu AI).'
    },
    // Lumy Itor 1 persona model
    {
        name: 'GPT OSS 120B',
        id: 'openai/gpt-oss-120b:free',
        provider: 'openrouter',
        pricing: {
            input: 0,
            output: 0,
        },
        description: 'Model for Lumy Itor 1 persona (OpenAI OSS).'
    }
];
