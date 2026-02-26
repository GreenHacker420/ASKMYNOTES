import nodemailer from "nodemailer";

export interface SmtpEmailSenderOptions {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class SmtpEmailSender {
  private readonly from: string;
  private readonly transporter: nodemailer.Transporter;

  constructor(options: SmtpEmailSenderOptions) {
    const isGmailSmtp = options.host.trim().toLowerCase() === "smtp.gmail.com";
    this.from = isGmailSmtp ? options.user : options.from;

    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: isGmailSmtp ? 465 : options.port,
      secure: isGmailSmtp ? true : options.secure,
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: {
        user: options.user,
        pass: options.pass
      }
    });
  }

  async sendMail(input: SendMailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text
    });
  }
}
