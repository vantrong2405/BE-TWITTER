
// cách send mail 
//step 1 : Bật xác minh 2 bước 
//step 2 : Tạo ứng dụng mật khẩu link : https://myaccount.google.com/apppasswords?pli=1&rapt=AEjHL4NRqoaDnDMdvw-n0kq14PGm4qjRxXYGaoMMxgiaad8_ysiX8UZpZBOssMM2YDM32tSru5jNOtj--PlRBcFZEVL0nxeyAaqli0Nz0u2nVHnNCAsozx0

// tạo template email
//https://tabular.email/editor/FromdemotemplateMinimalnotification--5c11315c-7d34-453b-a6c2-bd042809ef99
//https://studio.unlayer.com/create/warm-lead-email

import { createTransport, SendMailOptions, SentMessageInfo } from 'nodemailer';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';
import { envConfig } from '~/utils/config';


const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM } = envConfig
export const sendMail = async ({ toEmail, subjectEmail, htmlContent }: { toEmail: string, subjectEmail: string, htmlContent: string }): Promise<SentMessageInfo | void> => {
  try {
    const transporter = createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    })

    const message: SendMailOptions = {
      from: EMAIL_FROM,
      to: toEmail,
      subject: subjectEmail,
      html: htmlContent
    };

    const info: SentMessageInfo = await transporter.sendMail(message);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Reading the template content



export const readingEmailTemplate = (templatePath: string, data: object) => {
  const emailTemplate = readFileSync(templatePath, 'utf-8') //  Đọc nội dung file template
  const compiledTemplate = compile(emailTemplate) // Biên dịch template thành hàm
  return compiledTemplate(data)
}
