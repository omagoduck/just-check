import { Model } from '../types';

export const GoogleModels: Model[] = [
    {
        name: 'Gemini 2.0 Flash',
        id: 'gemini-2.0-flash',
        provider: 'google',
        pricing: {
            input: 0.1,
            output: 0.4,
        },
        description: 'Fast and versatile multimodal model, optimized for speed and efficiency.'
    },
    {
        name: 'Gemini 1.5 Pro',
        id: 'gemini-1.5-pro',
        provider: 'google',
        pricing: {
            input: 1.25,
            output: 5.0,
        },
        description: 'Highly capable model for complex reasoning and large context windows.'
    },
    // Lumy Sense 1 persona model
    {
        name: 'Gemini 2.5 Flash',
        id: 'gemini-2.5-flash',
        provider: 'google',
        pricing: {
            input: 0.15, // placeholder - update with actual pricing
            output: 0.6,  // placeholder - update with actual pricing
        },
        description: 'Optimized for creative writing and empathy (Lumy Sense 1).'
    }
];