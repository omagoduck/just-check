import { Model } from '../types';

export const GoogleModels: Model[] = [
    {
        name: 'Gemini 3.0 Flash',
        id: 'gemini-3.0-flash',
        provider: 'google',
        pricing: {
            input: 0.1,
            output: 0.4,
        },
        description: 'Fast and versatile multimodal model, optimized for speed and efficiency.'
    },
    {
        name: 'Gemini 3.0 Pro',
        id: 'gemini-3.0-pro',
        provider: 'google',
        pricing: {
            input: 1.25,
            output: 5.0,
        },
        description: 'Highly capable model for complex reasoning and large context windows.'
    },
];
