import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionService } from './session.service';
import { Session, SessionSchema } from './schemas/session.schema';

@Module({
  imports: [
    // Le decimos a Mongo que use nuestro molde
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  providers: [SessionService],
  exports: [SessionService], 
})
export class SessionModule {}