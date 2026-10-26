import { Resend } from 'resend';
import { getEmailEnvironment } from '../config/environment.js';
import AppError from '../utils/appError.js';

const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const buildVerificationEmail = ({ name, otp, expiresInMinutes }) => {
    const safeName = escapeHtml(name);
    const safeOtp = escapeHtml(otp);

    return {
        subject: 'Mã xác minh tài khoản Chạm Sắc Việt',
        text: `Xin chào ${name}, mã xác minh của bạn là ${otp}. Mã có hiệu lực trong ${expiresInMinutes} phút.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
                <h1 style="font-size:24px">Xác minh tài khoản Chạm Sắc Việt</h1>
                <p>Xin chào ${safeName},</p>
                <p>Nhập mã sau để kích hoạt tài khoản của bạn:</p>
                <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${safeOtp}</p>
                <p>Mã có hiệu lực trong ${expiresInMinutes} phút. Không chia sẻ mã này với bất kỳ ai.</p>
                <p>Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.</p>
            </div>
        `
    };
};

export const buildPasswordResetEmail = ({ name, otp, expiresInMinutes }) => {
    const safeName = escapeHtml(name);
    const safeOtp = escapeHtml(otp);

    return {
        subject: 'Mã đặt lại mật khẩu Chạm Sắc Việt',
        text: `Xin chào ${name}, mã đặt lại mật khẩu của bạn là ${otp}. Mã có hiệu lực trong ${expiresInMinutes} phút.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
                <h1 style="font-size:24px">Đặt lại mật khẩu Chạm Sắc Việt</h1>
                <p>Xin chào ${safeName},</p>
                <p>Nhập mã sau để đặt lại mật khẩu cho tài khoản của bạn:</p>
                <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${safeOtp}</p>
                <p>Mã có hiệu lực trong ${expiresInMinutes} phút. Không chia sẻ mã này với bất kỳ ai.</p>
                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
            </div>
        `
    };
};

const sendOtpEmail = async ({
    to,
    email,
    idempotencyKey
}) => {
    const environment = getEmailEnvironment();
    const resend = new Resend(environment.resendApiKey);
    const safeFromName = environment.resendFromName.replace(/[<>\r\n]/g, '').trim()
        || 'Chạm Sắc Việt';
    let result;

    try {
        result = await resend.emails.send({
            from: `${safeFromName} <${environment.resendFromEmail}>`,
            to: [to],
            subject: email.subject,
            text: email.text,
            html: email.html
        }, { idempotencyKey });
    } catch {
        throw new AppError(
            'Không thể kết nối dịch vụ gửi email. Vui lòng thử lại sau.',
            502
        );
    }

    if (result.error) {
        throw new AppError(
            'Không thể gửi email OTP lúc này. Vui lòng thử lại sau.',
            502
        );
    }

    return result.data;
};

export const sendVerificationOtpEmail = ({
    to,
    name,
    otp,
    expiresInMinutes,
    idempotencyKey
}) => sendOtpEmail({
    to,
    email: buildVerificationEmail({ name, otp, expiresInMinutes }),
    idempotencyKey
});

export const sendPasswordResetOtpEmail = ({
    to,
    name,
    otp,
    expiresInMinutes,
    idempotencyKey
}) => sendOtpEmail({
    to,
    email: buildPasswordResetEmail({ name, otp, expiresInMinutes }),
    idempotencyKey
});
