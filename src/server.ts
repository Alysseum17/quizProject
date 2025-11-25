import dotenv from 'dotenv';
import {app} from './app.js';
import { prisma } from './prisma.js';

process.on('uncaughtException', (err:Error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

dotenv.config();
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/', async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { 
                quizzes: true 
            } 
        });
        console.log('Users found:', users.length);
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Something went wrong fetching users' });
    }
});

process.on('unhandledRejection', (err:Error) => {
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    console.log('SIGTERM RECEIVED! Shutting down gracefully');
    server.close(() => {
        console.log('Process terminated!');
    });
});