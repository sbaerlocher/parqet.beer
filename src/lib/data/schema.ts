// SPDX-License-Identifier: MIT
import { z } from 'zod';

export const beverageSchema = z.object({
  name: z.string().min(1),
  size: z.string().min(1),
  price: z.number().positive().finite(),
  currency: z.enum(['EUR', 'CHF']),
  country: z.string().length(2),
});

export const beverageListSchema = z
  .array(beverageSchema)
  .min(1)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, i) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, 'name'],
          message: `Duplicate beverage name: ${item.name}`,
        });
      }
      seen.add(key);
    });
  });

export type Beverage = z.infer<typeof beverageSchema>;
