import { Processor } from '@nestjs/bull';

@Processor('notifications')
export class NotificationsProcessor {
  // Queue handlers are added with the notifications module (Stage B).
}
