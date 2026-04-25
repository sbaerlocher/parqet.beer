// SPDX-License-Identifier: MIT
import { z } from 'zod';

// Country/currency convention:
// `country` is the producer's origin (e.g. "CH" for Appenzeller, "GB" for
// Glenfiddich). `currency` reflects the retail market used for `price`:
// - CH-origin → CHF (Swiss retail)
// - everything else → EUR (German retail as reference market)
// For beer/coffee/smoothie these usually coincide (origin = retail market).
// For whisky they diverge because Scotch/Irish/Japanese bottles are imported
// but priced from Whisky.de etc. — see whisky.json.

const localizedNote = z.object({
  de: z.string().trim().min(1),
  en: z.string().trim().min(1),
});

export const beverageSchema = z.object({
  name: z.string().min(1),
  size: z.string().min(1),
  price: z.number().positive().finite(),
  currency: z.enum(['EUR', 'CHF']),
  country: z.string().length(2),
  note: localizedNote.optional(),
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
export type LocalizedNote = z.infer<typeof localizedNote>;
