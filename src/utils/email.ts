import nodemailer from 'nodemailer';
import {convert} from 'html-to-text';



export class Email {
    
    private to: string;
    private from: string;
    private userName: string;

    constructor(private user: any, private url: string) {
        this.to = user.email;
        this.userName = user.username;
        this.from = `Quiz App <${process.env.EMAIL_FROM}>`;
    }
    newTransport(){
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST as string,
            port: Number(process.env.EMAIL_PORT),
            auth: {
                user: process.env.EMAIL_USERNAME as string,
                pass: process.env.EMAIL_PASSWORD as string
            }
        });
    }
    async send(subject: string, message: string){
        const html = `<p>Hi ${this.userName},</p>
        <p>${message}</p>
        <p>Click <a href="${this.url}">here</a> to proceed.</p>
        <p>If you did not request this, please ignore this email.</p>
        `;
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: convert(html)
        };
        await this.newTransport().sendMail(mailOptions);
    }
    async sendWelcome(){
        await this.send(
            'Welcome to Quiz App!',
            'Thank you for signing up to our Quiz App. We are excited to have you on board!'
        );
    }
    async sendPasswordReset(){
        await this.send(
            'Your password reset token (valid for 10 minutes)',
            `Please use the following link to reset your password: ${this.url}`
        );
    }
}

