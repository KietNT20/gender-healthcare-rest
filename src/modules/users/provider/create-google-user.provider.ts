import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { GoogleUser } from '../interfaces/google-user.interface';

@Injectable()
export class CreateGoogleUserProvider {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    public async createGoogleUser(googleUser: GoogleUser) {
        try {
            const user = this.usersRepository.create({
                firstName: googleUser.firstName,
                lastName: googleUser.lastName,
                googleId: googleUser.googleId,
                email: googleUser.email,
            });
            return await this.usersRepository.save(user);
        } catch (error) {
            throw new ConflictException(error, {
                description: 'Could not create a new user',
            });
        }
    }
}
