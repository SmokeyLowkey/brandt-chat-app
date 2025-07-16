import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to send email using Resend
async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    // Log the email details for debugging
    console.log(`Sending password reset email to: ${email}`);
    
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: `PartsIQ <noreply@${process.env.RESEND_APPROVED_DOMAIN}>`,
      to: email,
      subject: "Reset Your PartsIQ Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E31937;">Reset Your PartsIQ Password</h2>
          <p>Hello,</p>
          <p>You requested to reset your PartsIQ password. Please click the link below to reset your password:</p>
          <p><a href="${resetLink}" style="display: inline-block; background-color: #E31937; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The PartsIQ Team</p>
        </div>
      `,
    });
    
    if (error) {
      console.error("Error sending email:", error);
      return false;
    }
    
    console.log("Email sent successfully:", data);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// POST /api/auth/forgot-password - Request a password reset
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    
    if (!email || typeof email !== "string") {
      return new NextResponse("Invalid email", { status: 400 });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
    
    // For security reasons, don't reveal if the email exists or not
    // We'll proceed as if the email was found and just not send an actual email if it doesn't exist
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration attacks
      return NextResponse.json({ success: true });
    }
    
    // Generate a random token
    const resetToken = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: email.toLowerCase(),
      },
    });
    
    // Create a new reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token: resetToken,
        expires,
      },
    });
    
    // Send the password reset email
    await sendPasswordResetEmail(email, resetToken);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}