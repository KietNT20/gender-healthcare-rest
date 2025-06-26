import { MessageType } from 'src/enums';

export class ChatUtils {
    /**
     * Format message content based on type and metadata
     */
    static formatMessageContent(
        content: string,
        type: MessageType,
        metadata?: any,
    ): string {
        switch (type) {
            case MessageType.FILE:
                try {
                    const fileData = JSON.parse(content);
                    return fileData.text || 'File attachment';
                } catch {
                    return content;
                }
            case MessageType.IMAGE:
                // Check if it's actually a document based on metadata
                if (metadata?.isDocument) {
                    try {
                        const fileData = JSON.parse(content);
                        return fileData.text || 'File attachment';
                    } catch {
                        return content;
                    }
                } else {
                    try {
                        const imageData = JSON.parse(content);
                        return imageData.text || 'Image attachment';
                    } catch {
                        return content;
                    }
                }
            default:
                return content;
        }
    }

    /**
     * Extract file information from message content
     */
    static extractFileInfo(content: string, type: MessageType): any | null {
        if (type !== MessageType.FILE && type !== MessageType.IMAGE) {
            return null;
        }

        try {
            const fileData = JSON.parse(content);
            return fileData.file || null;
        } catch {
            return null;
        }
    }

    /**
     * Generate room name for WebSocket
     */
    static generateRoomName(questionId: string): string {
        return `question_${questionId}`;
    }

    /**
     * Format user display name
     */
    static formatUserDisplayName(firstName: string, lastName: string): string {
        return `${firstName} ${lastName}`.trim();
    }

    /**
     * Check if message contains sensitive information
     */
    static containsSensitiveInfo(content: string): boolean {
        // Basic patterns for sensitive information
        const patterns = [
            /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card numbers
            /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses (basic)
            /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/, // Phone numbers
        ];

        return patterns.some((pattern) => pattern.test(content));
    }

    /**
     * Sanitize message content
     */
    static sanitizeContent(content: string): string {
        // Remove potential XSS attempts
        return content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }

    /**
     * Get message preview (for notifications)
     */
    static getMessagePreview(
        content: string,
        type: MessageType,
        metadata?: any,
        maxLength: number = 50,
    ): string {
        let preview = '';

        switch (type) {
            case MessageType.FILE:
                preview = '📎 File attachment';
                break;
            case MessageType.IMAGE:
                // Check if it's actually a document based on metadata
                if (metadata?.isDocument) {
                    preview = '� File attachment';
                } else {
                    preview = '�🖼️ Image';
                }
                break;
            default:
                preview = this.sanitizeContent(content);
                break;
        }

        if (preview.length > maxLength) {
            preview = preview.substring(0, maxLength - 3) + '...';
        }

        return preview;
    }

    /**
     * Calculate time difference for "ago" display
     */
    static getTimeAgo(date: Date): string {
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000,
        );

        if (diffInSeconds < 60) {
            return 'Just now';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        }

        // For older messages, return formatted date
        return date.toLocaleDateString();
    }

    /**
     * Generate unique message ID
     */
    static generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate question access permissions
     */
    static canAccessQuestion(
        userRole: string,
        questionOwnerId: string,
        userId: string,
    ): boolean {
        // Admin and Manager can access all questions
        if (['admin', 'manager'].includes(userRole.toLowerCase())) {
            return true;
        }

        // Question owner can access their own questions
        if (questionOwnerId === userId) {
            return true;
        }

        // Consultants can access questions assigned to them (this would need additional logic)
        if (userRole.toLowerCase() === 'consultant') {
            // This would require checking if the consultant is assigned to the question
            // For now, return true - implement based on your assignment logic
            return true;
        }

        return false;
    }
}
