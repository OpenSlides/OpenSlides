import { MotionEditNotificationType } from './motions.constants';

/**
 * Class to specify the notifications for editing a motion.
 */
export interface MotionEditNotification {
    /**
     * The id of the motion the user wants to edit.
     * Necessary to identify if users edit the same motion.
     */
    motionId: number;

    /**
     * The id of the sender.
     * Necessary if this differs from senderUserId.
     */
    senderId: number;

    /**
     * The name of the sender.
     * To show the names of the other editors
     */
    senderName: string;

    /**
     * The type of the notification.
     * Separates if the user is beginning the work or closing the edit-view.
     */
    type: MotionEditNotificationType;
}
