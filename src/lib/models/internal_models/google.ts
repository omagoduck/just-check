import { Model } from '../types';

export const GoogleModels: Model[] = [
    {
        name: 'Gemini 2.0 Flash',
        id: 'gemini-2.0-flash',
        provider: 'google',
        contextLength: 1048576,
        pricing: {
            input: 0.1,
            output: 0.4,
        },
        capabilities: {
            canReason: false,
            supportsToolCalling: true,
            supportsFiles: true,
        },
        inputModalities: ['text', 'image', 'audio', 'video'],
        outputModalities: ['text'],
        description: 'Fast and versatile multimodal model, optimized for speed and efficiency.'
    },
    {
        name: 'Gemini 1.5 Pro',
        id: 'gemini-1.5-pro',
        provider: 'google',
        contextLength: 2097152,
        pricing: {
            input: 1.25,
            output: 5.0,
        },
        capabilities: {
            canReason: false,
            supportsToolCalling: true,
            supportsFiles: true,
        },
        inputModalities: ['text', 'image', 'audio', 'video'],
        outputModalities: ['text'],
        description: 'Highly capable model for complex reasoning and large context windows.'
    }
];