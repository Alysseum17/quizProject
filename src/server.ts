import 'dotenv/config';
import {app} from './app.js';


process.on('uncaughtException', (err:Error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
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