import nodemailer from 'nodemailer';
import { getShopDetails } from '@/lib/db';

// Helper to generate Invoice HTML (internal)
function generateInvoiceHTML(
    orderId: string,
    shopName: string,
    shopAddress: string,
    shopContact: string,
    shopGstin: string,
    customerName: string,
    amount: string,
    itemsRows: string
) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #4f46e5; text-align: center;">${shopName}</h1>
            <div style="text-align: center; margin-bottom: 20px; font-size: 14px; color: #666;">
                <p>${shopAddress}</p>
                <p>Contact: ${shopContact}</p>
                ${shopGstin ? `<p>GSTIN: ${shopGstin}</p>` : ''}
            </div>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
                <h2 style="margin-top: 0;">Invoice #${orderId}</h2>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #4f46e5; color: white;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                            <td style="padding: 10px; text-align: right; font-weight: bold;">₹${amount}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">Thank you for your order!</p>
        </div>
    `;
}

export async function sendInvoiceEmail(orderData: any) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('[Email Lib] Missing EMAIL_USER or EMAIL_PASSWORD env vars');
        // Don't throw here to avoid crashing the order flow, but log error
        return { success: false, message: 'Email configuration missing' };
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    try {
        const shopSettings = await getShopDetails();
        const shopName = shopSettings?.name || 'SweetShop';
        const shopAddress = shopSettings?.address || '';
        const shopContact = shopSettings?.contact || '';
        const shopGstin = shopSettings?.gstin || '';

        // Ensure items is an array
        let items = orderData.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.error('[Email Lib] Failed to parse items JSON', e);
                items = [];
            }
        }

        const itemsRows = Array.isArray(items) ? items.map((item: any) => {
            const price = parseFloat(item.price || 0);
            const quantity = parseInt(item.quantity || 1);
            const total = price * quantity;
            return `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${price.toFixed(2)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${total.toFixed(2)}</td>
                </tr>
            `;
        }).join('') : '';

        const htmlContent = generateInvoiceHTML(
            orderData.order_id || orderData.id || 'N/A', // Try order_id first
            shopName,
            shopAddress,
            shopContact,
            shopGstin,
            orderData.name || orderData.customer || 'Customer',
            orderData.amount.toString(),
            itemsRows
        );

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: orderData.user_email || orderData.email,
            subject: `Invoice for Order #${orderData.order_id || orderData.id} - ${shopName}`,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Lib] Invoice email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email Lib] Transporter Send Error (Invoice):', error);
        // We log but maybe don't want to throw to crash the whole request?
        // Depends on caller. Let's return error object.
        return { success: false, error };
    }
}

export async function sendVerificationEmail(email: string, otp: string) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('[Email Lib] Missing EMAIL_USER or EMAIL_PASSWORD env vars');
        throw new Error('Server misconfigured: Missing email credentials');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Verify your email - SweetShop`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4f46e5;">Welcome to SweetShop!</h2>
                <p>Please use the following OTP to verify your email address and complete your signup:</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">This OTP is valid for 15 minutes.</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Lib] Verification email sent: ${info.messageId}`);
        return { success: true };
    } catch (error) {
        console.error('[Email Lib] Verification Email Error:', error);
        throw error;
    }
}

export async function sendPasswordResetEmail(email: string, otp: string) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.error('[Email Lib] Missing EMAIL_USER or EMAIL_PASSWORD env vars');
        throw new Error('Server misconfigured: Missing email credentials');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Sweetshop Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4f46e5;">Password Reset Request</h2>
                <p>Your OTP for password reset is:</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">
                    ${otp}
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">This OTP is valid for 15 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Lib] Password reset email sent: ${info.messageId}`);
        return { success: true };
    } catch (error) {
        console.error('[Email Lib] Password Reset Email Error:', error);
        throw error;
    }
}

