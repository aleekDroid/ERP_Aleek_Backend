import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Session extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  // Mongo borrará el documento automáticamente en 8 horas
  @Prop({ required: true, default: Date.now, expires: '8h' }) 
  createdAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);