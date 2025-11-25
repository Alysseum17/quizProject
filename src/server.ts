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

app.get('/', (_req, res) => {
    prisma.user.findMany().then(users => {
        console.log('Users:', users);
        res.json(users);
    }).catch(err => {
        console.error('Error fetching users:', err);
    });
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