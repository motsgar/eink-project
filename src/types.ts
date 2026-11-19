import type { Result } from 'neverthrow';

import { err, ok } from 'neverthrow';
import { z } from 'zod';

export const toInt = (str: string, optSchema?: z.ZodType): Result<number, string> => {
    const schema = z.string().regex(z.regexes.integer).transform(Number).pipe(z.int());
    const res = schema.safeParse(str);
    if (!res.success) return err(res.error.message);

    if (optSchema !== undefined) {
        const optRes = optSchema.safeParse(res.data);
        if (!optRes.success) return err(optRes.error.message);
    }

    return ok(res.data);
};

export const optToInt = (
    str: string | undefined,
    defaultValue: number,
    optSchema?: z.ZodType,
): Result<number, string> => {
    if (str === undefined) return ok(defaultValue);
    return toInt(str, optSchema);
};

export const toFloat = (str: string, optSchema?: z.ZodType): Result<number, string> => {
    const schema = z.string().regex(z.regexes.number).transform(Number).pipe(z.number());
    const res = schema.safeParse(str);
    if (!res.success) return err(res.error.message);

    if (optSchema !== undefined) {
        const optRes = optSchema.safeParse(res.data);
        if (!optRes.success) return err(optRes.error.message);
    }

    return ok(res.data);
};

export const optToFloat = (
    str: string | undefined,
    defaultValue: number,
    optSchema?: z.ZodType,
): Result<number, string> => {
    if (str === undefined) return ok(defaultValue);
    return toFloat(str, optSchema);
};

export const toBool = (str: string): Result<boolean, string> => {
    const schema = z
        .string()
        .regex(z.regexes.boolean)
        .transform((s) => s.toLowerCase() === 'true');
    const res = schema.safeParse(str);
    if (!res.success) return err(res.error.message);
    return ok(res.data);
};
export const optToBool = (str: string | undefined, defaultValue: boolean): Result<boolean, string> => {
    if (str === undefined) return ok(defaultValue);
    return toBool(str);
};
