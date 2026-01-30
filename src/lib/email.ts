import { createTransport } from "nodemailer";

export const sendResetPasswordLink = async (email: string, token: string) => {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // const link = `http://localhost:${process.env.PORT}/api/auth/reset-password?token=${token}`;
  const link = `${process.env.FRONT_END_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `VyapaarX ${process.env.EMAIL_USER}`,
    to: email,
    subject: "Link to reset password",
    html: `<h2>Welcome to VyapaarX!</h2>
           <p>Please click the link below to reset your password:</p>
           <a href="${link}">${link}</a>
           <p>If not initiated by you please ignore.</p>
           `,
  });
};
