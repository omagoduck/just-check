import { z } from 'zod';
import { executeManageMemory } from './executor/memory-executor';

export interface ManageMemoryUpdateInput {
  oldMemory: string;
  updatedMemory: string;
}

export interface ManageMemoryInput {
  action: 'add' | 'update' | 'remove' | 'view';
  memories?: string[];
  updates?: ManageMemoryUpdateInput[];
}

export interface ManageMemoryOutput {
  memories?: string;
}

const manageMemoryInputSchema = z
  .object({
    action: z.enum(['add', 'update', 'remove', 'view']),
    memories: z
      .array(z.string())
      .optional()
      .describe('Memory texts. For add or remove. Can contain one or many items.'),
    updates: z
      .array(
        z.object({
          oldMemory: z.string().describe('Exact existing memory text to update.'),
          updatedMemory: z.string().describe('Updated memory text.'),
        })
      )
      .optional()
      .describe('For update action. Use exact string matching with { oldMemory, updatedMemory }.'),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'add') {
      if (!Array.isArray(value.memories) || value.memories.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memories'],
          message: 'Provide memories[] for add action',
        });
      }
    }

    if (value.action === 'remove') {
      if (!Array.isArray(value.memories) || value.memories.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memories'],
          message: 'Provide memories[] for remove action',
        });
      }
    }

    if (value.action === 'update') {
      if (!Array.isArray(value.updates) || value.updates.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['updates'],
          message: 'Provide updates[] for update action',
        });
      } else {
        value.updates.forEach((update, index) => {
          const hasOldMemory = typeof update.oldMemory === 'string' && update.oldMemory.trim().length > 0;
          if (!hasOldMemory) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['updates', index, 'oldMemory'],
              message: 'Each update must include oldMemory',
            });
          }
        });
      }
    }

    if (value.action === 'view') {
      if (value.memories !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['memories'],
          message: 'Do not provide memories[] for view action',
        });
      }

      if (value.updates !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['updates'],
          message: 'Do not provide updates[] for view action',
        });
      }
    }
  });

export const manageMemoryTool = {
  description:
    'Manage persistent user memory. Use view to fetch the latest memory list as a markdown bullet list in `memories`, add with memories[], remove by exact text with memories[], and update with updates[] using { oldMemory, updatedMemory }. Arrays support one or many items.',
  inputSchema: manageMemoryInputSchema as z.ZodType<ManageMemoryInput>,
  execute: executeManageMemory,
};
