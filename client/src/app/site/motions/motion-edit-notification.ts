/**
 * Enum to define different types of notifications.
 */
export enum MotionEditNotificationType {
    /**
     * Type to declare editing a motion.
     */
    TYPE_BEGIN_EDITING_MOTION = 'typeBeginEditingMotion',

    /**
     * Type if the edit-view is closing.
     */
    TYPE_CLOSING_EDITING_MOTION = 'typeClosingEditingMotion',

    /**
     * Type if changes are saved.
     */
    TYPE_SAVING_EDITING_MOTION = 'typeSavingEditingMotion',

    /**
     * Type to declare if another person is also editing the same motion.
     */
    TYPE_ALSO_EDITING_MOTION = 'typeAlsoEditingMotion'
}
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
