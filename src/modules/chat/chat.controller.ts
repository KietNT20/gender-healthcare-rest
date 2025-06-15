import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { MessageType } from 'src/enums';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post('questions/:questionId/messages')
    @ApiOperation({ summary: 'Send a text message to a question chat' })
    @ApiResponse({ status: 201, description: 'Message sent successfully' })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiResponse({ status: 404, description: 'Question not found' })
    async sendMessage(
        @Param('questionId') questionId: string,
        @Body() createMessageDto: CreateChatDto,
        @Req() req: Request,
    ) {
        // Extract user ID from request (assuming middleware adds user info)
        const userId = (req as any).user?.id;

        const message = await this.chatService.createMessage({
            content: createMessageDto.content,
            type: createMessageDto.type || MessageType.TEXT,
            questionId,
            senderId: userId,
        });

        return {
            success: true,
            data: message,
            message: 'Message sent successfully',
        };
    }

    @Post('questions/:questionId/messages/file')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Send a file message to a question chat' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                content: {
                    type: 'string',
                    description: 'Optional message content/description',
                },
                type: {
                    type: 'string',
                    enum: ['FILE', 'IMAGE'],
                    default: 'FILE',
                },
            },
        },
    })
    async sendFileMessage(
        @Param('questionId') questionId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { content?: string; type?: MessageType },
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;
        const content = body.content || file.originalname;
        const type = body.type || MessageType.FILE;

        const message = await this.chatService.sendMessageWithFile(
            questionId,
            userId,
            content,
            file,
            type,
        );

        return {
            success: true,
            data: message,
            message: 'File message sent successfully',
        };
    }

    @Get('questions/:questionId/messages')
    @ApiOperation({ summary: 'Get message history for a question' })
    @ApiResponse({
        status: 200,
        description: 'Messages retrieved successfully',
    })
    async getMessages(
        @Param('questionId') questionId: string,
        @Query() query: GetMessagesDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        // Verify user has access to this question
        const hasAccess = await this.chatService.verifyQuestionAccess(
            questionId,
            userId,
        );
        if (!hasAccess) {
            throw new Error('Access denied to this question');
        }

        const messages = await this.chatService.getMessageHistory(
            questionId,
            query.page || 1,
            query.limit || 50,
        );

        return {
            success: true,
            data: messages,
            pagination: {
                page: query.page || 1,
                limit: query.limit || 50,
                total: messages.length,
            },
        };
    }

    @Patch('messages/:messageId/read')
    @ApiOperation({ summary: 'Mark message as read' })
    @ApiResponse({ status: 200, description: 'Message marked as read' })
    async markMessageAsRead(
        @Param('messageId') messageId: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        await this.chatService.markMessageAsRead(messageId, userId);

        return {
            success: true,
            message: 'Message marked as read',
        };
    }

    @Patch('questions/:questionId/messages/read-all')
    @ApiOperation({ summary: 'Mark all messages in a question as read' })
    @ApiResponse({ status: 200, description: 'All messages marked as read' })
    async markAllMessagesAsRead(
        @Param('questionId') questionId: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        await this.chatService.markAllMessagesAsRead(questionId, userId);

        return {
            success: true,
            message: 'All messages marked as read',
        };
    }

    @Delete('messages/:messageId')
    @ApiOperation({ summary: 'Delete a message (soft delete)' })
    @ApiResponse({ status: 200, description: 'Message deleted successfully' })
    @ApiResponse({ status: 403, description: 'Cannot delete this message' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    async deleteMessage(
        @Param('messageId') messageId: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        await this.chatService.deleteMessage(messageId, userId);

        return {
            success: true,
            message: 'Message deleted successfully',
        };
    }

    @Get('questions/:questionId/summary')
    @ApiOperation({ summary: 'Get question chat summary with last message' })
    @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
    async getQuestionSummary(
        @Param('questionId') questionId: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        // Verify access
        const hasAccess = await this.chatService.verifyQuestionAccess(
            questionId,
            userId,
        );
        if (!hasAccess) {
            throw new Error('Access denied to this question');
        }

        const summary =
            await this.chatService.getQuestionChatSummary(questionId);

        return {
            success: true,
            data: summary,
        };
    }

    @Get('messages/unread-count')
    @ApiOperation({ summary: 'Get unread message count for current user' })
    @ApiResponse({
        status: 200,
        description: 'Unread count retrieved successfully',
    })
    async getUnreadCount(@Req() req: Request) {
        const userId = (req as any).user?.id;

        const count = await this.chatService.getUnreadMessageCount(userId);

        return {
            success: true,
            data: { unreadCount: count },
        };
    }

    @Get('messages/:messageId/file')
    @ApiOperation({ summary: 'Download file from message' })
    @ApiResponse({
        status: 200,
        description: 'File URL retrieved successfully',
    })
    @ApiResponse({ status: 404, description: 'File not found' })
    async getMessageFile(
        @Param('messageId') messageId: string,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        const fileUrl = await this.chatService.getMessageFileUrl(
            messageId,
            userId,
        );

        return {
            success: true,
            data: { fileUrl },
        };
    }
}
