import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { MessageType, RolesNameEnum } from 'src/enums';
import { RoleGuard } from 'src/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { SendPublicPdfMessageDto } from './dto/send-public-pdf-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post('questions')
    @UseGuards(RoleGuard)
    @Roles([RolesNameEnum.CUSTOMER])
    @ApiOperation({ summary: 'Create a new question' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Question created successfully.',
    })
    async createQuestion(
        @Body() createQuestionDto: CreateQuestionDto,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;
        const question = await this.chatService.createQuestion(
            createQuestionDto,
            userId,
        );
        return {
            success: true,
            data: question,
            message: 'Question created successfully',
        };
    }

    @Post('questions/:questionId/messages')
    @ApiOperation({ summary: 'Send a text message to a question chat' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Message sent successfully',
    })
    @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Question not found',
    })
    async sendMessage(
        @Param('questionId') questionId: string,
        @Body() createMessageDto: CreateChatDto,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;

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
    @ApiOperation({
        summary: 'Send a file or image message to a question chat',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload (image or document)',
                },
                content: {
                    type: 'string',
                    description: 'Optional message content/description',
                },
                type: {
                    type: 'string',
                    enum: Object.values(MessageType),
                    description:
                        'Message type - will be auto-detected if not provided based on file MIME type. Note: Both files and images are stored as IMAGE type in database for compatibility.',
                },
            },
            required: ['file'],
        },
    })
    async sendFileMessage(
        @Param('questionId') questionId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { content?: string; type?: MessageType },
        @CurrentUser() user: User,
    ) {
        const userId = user.id;
        const content = body.content || file.originalname;

        // Auto-detect file type based on MIME type if not explicitly provided
        let type = body.type;
        if (!type) {
            type = file.mimetype.startsWith('image/')
                ? MessageType.IMAGE
                : MessageType.FILE; // We still use FILE logic internally, but will convert to IMAGE in service
        }

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

    @Post('questions/:questionId/messages/public-pdf')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Send a public PDF message to a question chat',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'PDF file to upload to public bucket',
                },
                content: {
                    type: 'string',
                    description: 'Optional message content/description',
                },
                description: {
                    type: 'string',
                    description: 'Description of the PDF document',
                },
                tags: {
                    type: 'string',
                    description: 'Comma-separated tags for categorization',
                },
                category: {
                    type: 'string',
                    description: 'Category of the PDF',
                },
            },
            required: ['file'],
        },
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Public PDF message sent successfully',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid file type - only PDF files are allowed',
    })
    async sendPublicPdfMessage(
        @Param('questionId') questionId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: SendPublicPdfMessageDto,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;
        const content = body.content || file.originalname;

        const message = await this.chatService.sendMessageWithPublicPdf(
            questionId,
            userId,
            content,
            file,
            body.description,
        );

        return {
            success: true,
            data: message,
            message: 'Public PDF message sent successfully',
        };
    }

    @Get('questions/:questionId/messages')
    @ApiOperation({ summary: 'Get message history for a question' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Messages retrieved successfully',
    })
    async getMessages(
        @Param('questionId') questionId: string,
        @Query() query: GetMessagesDto,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;

        // Verify user has access to this question
        const hasAccess = await this.chatService.verifyQuestionAccess(
            questionId,
            userId,
        );
        if (!hasAccess) {
            throw new ForbiddenException('Truy cập bị từ chối vào câu hỏi này');
        }

        const messages = await this.chatService.getMessageHistory(
            questionId,
            query.page,
            query.limit,
        );

        return {
            success: true,
            data: messages,
            message: 'Messages retrieved successfully',
        };
    }

    @Get('questions/:questionId/messages/with-urls')
    @ApiOperation({
        summary: 'Get message history with file URLs for a question',
        description:
            'Get messages with enhanced file URLs, especially useful for public PDFs',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Messages with file URLs retrieved successfully',
    })
    async getMessagesWithFileUrls(
        @Param('questionId') questionId: string,
        @Query() query: GetMessagesDto,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;

        // Verify user has access to this question
        const hasAccess = await this.chatService.verifyQuestionAccess(
            questionId,
            userId,
        );
        if (!hasAccess) {
            throw new ForbiddenException('Truy cập bị từ chối vào câu hỏi này');
        }

        const messages = await this.chatService.getMessageHistoryWithFileUrls(
            questionId,
            userId,
            query.page,
            query.limit,
        );

        return {
            success: true,
            data: messages,
            message: 'Messages with file URLs retrieved successfully',
        };
    }

    @Patch('messages/:messageId/read')
    @ApiOperation({ summary: 'Mark message as read' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Message marked as read',
    })
    async markMessageAsRead(
        @Param('messageId') messageId: string,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;

        await this.chatService.markMessageAsRead(messageId, userId);

        return {
            success: true,
            message: 'Message marked as read',
        };
    }

    @Patch('questions/:questionId/messages/read-all')
    @ApiOperation({ summary: 'Mark all messages in a question as read' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'All messages marked as read',
    })
    async markAllMessagesAsRead(
        @Param('questionId') questionId: string,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;

        await this.chatService.markAllMessagesAsRead(questionId, userId);

        return {
            success: true,
            message: 'All messages marked as read',
        };
    }

    @Delete('messages/:messageId')
    @ApiOperation({ summary: 'Delete a message (soft delete)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Message deleted successfully',
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: 'Cannot delete this message',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Message not found',
    })
    async deleteMessage(
        @Param('messageId') messageId: string,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;

        await this.chatService.deleteMessage(messageId, userId);

        return {
            success: true,
            message: 'Message deleted successfully',
        };
    }

    @Get('questions/:questionId/summary')
    @ApiOperation({ summary: 'Get question chat summary with last message' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Summary retrieved successfully',
    })
    async getQuestionSummary(
        @Param('questionId') questionId: string,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;

        // Verify access
        const hasAccess = await this.chatService.verifyQuestionAccess(
            questionId,
            userId,
        );
        if (!hasAccess) {
            throw new ForbiddenException('Truy cập bị từ chối vào câu hỏi này');
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
        status: HttpStatus.OK,
        description: 'Unread count retrieved successfully',
    })
    async getUnreadCount(@CurrentUser() user: User) {
        const userId = user.id;

        const count = await this.chatService.getUnreadMessageCount(userId);

        return {
            success: true,
            data: { unreadCount: count },
        };
    }

    @Get('messages/:messageId/file')
    @ApiOperation({ summary: 'Download file from message' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'File URL retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'File not found',
    })
    async getMessageFile(
        @Param('messageId') messageId: string,
        @CurrentUser() user: User,
    ) {
        const userId = user.id;

        const fileUrl = await this.chatService.getMessageFileUrl(
            messageId,
            userId,
        );

        return {
            success: true,
            data: { fileUrl },
        };
    }

    @Get('questions')
    @ApiOperation({
        summary: 'Get questions that the current user has access to',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Questions retrieved successfully',
    })
    async getUserQuestions(@CurrentUser() user: User) {
        const userId = user.id;

        const questions =
            await this.chatService.getUserAccessibleQuestions(userId);

        return {
            success: true,
            data: questions,
            message: 'Questions retrieved successfully',
        };
    }
}
