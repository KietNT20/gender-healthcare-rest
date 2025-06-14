/**
 * Sanitize filename by removing Vietnamese diacritics and special characters
 * @param filename - Original filename
 * @returns Clean filename safe for file systems and AWS S3
 */
export function sanitizeFilename(filename: string): string {
    if (!filename) return 'untitled';

    // Split filename and extension
    const lastDotIndex = filename.lastIndexOf('.');
    let name = filename;
    let extension = '';

    if (lastDotIndex > 0) {
        name = filename.substring(0, lastDotIndex);
        extension = filename.substring(lastDotIndex);
    }

    // Remove Vietnamese diacritics
    let sanitized = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Remove multiple underscores
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

    // Ensure not empty
    if (!sanitized) sanitized = 'untitled';

    return sanitized + extension;
}
