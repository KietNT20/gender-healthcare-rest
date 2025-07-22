import { Transform } from 'class-transformer';

/**
 * Decorator to transform an empty string to null or undefined.
 */
export function TransformEmptyStringToUndefined() {
    return Transform(({ value }: { value: string }) =>
        value === '' ? undefined : value,
    );
}

export function TransformEmptyStringToNull() {
    return Transform(({ value }: { value: string }) =>
        value === '' ? null : value,
    );
}
