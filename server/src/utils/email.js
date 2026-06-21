import nodemailer from 'nodemailer';

export const sendActivationEmail = async (toEmail, code) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: '"Tarımsal Maliyet Sistemi" <' + process.env.EMAIL_USER + '>',
      to: toEmail,
      subject: 'Hesap Doğrulama Kodunuz',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4CAF50;">Tarımsal Maliyet Sistemine Hoş Geldiniz!</h2>
          <p>Hesabınızı aktifleştirmek için aşağıdaki 6 haneli doğrulama kodunu kullanın:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>Bu kodun geçerlilik süresi 1 saattir.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;" />
          <p style="font-size: 12px; color: #777;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    return false;
  }
};
