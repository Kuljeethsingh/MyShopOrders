import nodemailer from 'nodemailer';
import { getShopDetails } from '@/lib/db';

function generateInvoiceHtml(orderId: string, shopName: string, shopAddress: string, shopContact: string, shopGstin: string, customer: string, amount: string, itemsRows: string) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4f46e5;">${shopName} Invoice</h1>
            <div style="font-size: 12px; color: #555; text-align: center; margin-bottom: 20px;">
                <p>${shopAddress}</p>
                <p>Contact: ${shopContact} | GSTIN: ${shopGstin}</p>
            </div>
            
            <p>Hi ${customer},</p>
            <p>Thank you for your order!</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Order Summary</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                
                <h4 style="margin-top: 20px;">Items:</h4>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #4f46e5; color: white;">
                            <th style="padding: 8px; text-align: left;">Item</th>
                            <th style="padding: 8px; text-align: center;">Qty</th>
                            <th style="padding: 8px; text-align: right;">Price</th>
                            <th style="padding: 8px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>
                
                 <p style="text-align: right; margin-top: 15px; font-size: 16px;"><strong>Total Amount:</strong> ₹${amount}</p>
            </div>
            
            <p>We hope you enjoy your sweets!</p>
            <p>Regards,<br>${shopName} Team</p>
        </div>
    `;
}

export async function sendInvoiceEmail(orderData: {
    orderId: string;
    email: string;
    customer: string;
    amount: string | number;
    items: any[];
}) {
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

    const shopSettings = await getShopDetails();
    const shopName = shopSettings?.name || 'SweetShop';
    const shopAddress = shopSettings?.address || '';
    const shopContact = shopSettings?.contact || '';
    const shopGstin = shopSettings?.gstin || '';

    const itemsRows = orderData.items.map((item: any) => {
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
    }).join('');

    const htmlContent = generateInvoiceHtml(
        orderData.orderId,
        shopName,
        shopAddress,
        shopContact,
        shopGstin,
        orderData.customer,
        orderData.amount.toString(),
        itemsRows
    );

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: orderData.email,
        subject: `Invoice for Order #${orderData.orderId} - ${shopName}`,
        html: htmlContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Lib] Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[Email Lib] Transporter Send Error:', error);
        throw error;
    }
}
