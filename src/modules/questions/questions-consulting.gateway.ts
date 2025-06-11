import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
    fullName: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/consulting',
})
export class QuestionsConsultingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QuestionsConsultingGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly authService: AuthService) {}

  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (client.user) {
      this.connectedUsers.delete(client.user.id);
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // Use the injected authService
      const user = await this.authService.verifyTokenForWebSocket(data.token);

      if (!user) {
        client.emit('authentication_error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      client.user = user;
      this.connectedUsers.set(user.id, client.id);

      client.emit('authenticated', {
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          role: user.role,
        },
      });

      this.logger.log(`User authenticated: ${user.id} (${user.fullName})`);
    } catch (error) {
      this.logger.error('Authentication error:', error.message);
      client.emit('authentication_error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  @SubscribeMessage('join_question_room')
  async handleJoinQuestionRoom(
    @MessageBody() data: { questionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const room = `question_${data.questionId}`;
    client.join(room);
    client.emit('joined_room', { room, questionId: data.questionId });
    this.logger.log(
      `Client ${client.id} (${client.user.fullName}) joined room: ${room}`,
    );
  }

  @SubscribeMessage('leave_question_room')
  async handleLeaveQuestionRoom(
    @MessageBody() data: { questionId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const room = `question_${data.questionId}`;
    client.leave(room);
    client.emit('left_room', { room, questionId: data.questionId });
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }

  @SubscribeMessage('typing_question')
  async handleTypingQuestion(
    @MessageBody() data: { questionId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    const room = `question_${data.questionId}`;
    client.to(room).emit('user_typing', {
      userId: client.user.id,
      userName: client.user.fullName,
      isTyping: data.isTyping,
      questionId: data.questionId,
    });
  }

  // Method to notify when new question is created
  async notifyNewQuestion(question: any) {
    this.server.emit('new_question', {
      type: 'new_question',
      data: question,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notified new question: ${question.id}`);
  }

  // Method to notify when new answer is posted
  async notifyNewAnswer(answer: any, questionId: string) {
    const room = `question_${questionId}`;
    this.server.to(room).emit('new_answer', {
      type: 'new_answer',
      data: answer,
      questionId,
      timestamp: new Date().toISOString(),
    });

    // Also notify question owner directly if they're online
    if (answer.question?.userId) {
      const questionOwnerSocketId = this.connectedUsers.get(
        answer.question.userId,
      );
      if (questionOwnerSocketId) {
        this.server.to(questionOwnerSocketId).emit('question_answered', {
          type: 'question_answered',
          data: answer,
          questionId,
          message: `Tư vấn viên ${answer.consultant?.fullName} đã trả lời câu hỏi của bạn`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.logger.log(`Notified new answer for question: ${questionId}`);
  }

  // Method to notify when answer is accepted
  async notifyAnswerAccepted(answer: any, questionId: string) {
    const room = `question_${questionId}`;
    this.server.to(room).emit('answer_accepted', {
      type: 'answer_accepted',
      data: answer,
      questionId,
      timestamp: new Date().toISOString(),
    });

    // Notify consultant whose answer was accepted
    if (answer.consultantId) {
      const consultantSocketId = this.connectedUsers.get(answer.consultantId);
      if (consultantSocketId) {
        this.server.to(consultantSocketId).emit('your_answer_accepted', {
          type: 'your_answer_accepted',
          data: answer,
          questionId,
          message: 'Câu trả lời của bạn đã được chấp nhận!',
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.logger.log(`Notified answer accepted for question: ${questionId}`);
  }

  // Method to notify consultants about new questions in their expertise area
  async notifyConsultantsNewQuestion(question: any, consultantIds: string[]) {
    consultantIds.forEach((consultantId) => {
      const socketId = this.connectedUsers.get(consultantId);
      if (socketId) {
        this.server.to(socketId).emit('new_question_for_expertise', {
          type: 'new_question_for_expertise',
          data: question,
          message: `Có câu hỏi mới trong lĩnh vực chuyên môn của bạn: ${question.title}`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    this.logger.log(
      `Notified ${consultantIds.length} consultants about new question: ${question.id}`,
    );
  }

  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  async sendDirectMessage(userId: string, message: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('direct_message', message);
      return true;
    }
    return false;
  }
}
