import { Request } from 'express';
export interface AuthRequest extends Request {
    user: {
        id: number;
        username: string;
        email: string;
        is_active: boolean;
        password_changed_at: Date | null;
    };
}