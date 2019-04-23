export interface AssignmentSlideData {
    title: string;
    description: string;
    phase: number;
    open_posts: number;
    assignment_related_users: {
        user: string;
        elected: boolean;
    }[];
}
