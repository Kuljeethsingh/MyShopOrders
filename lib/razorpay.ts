import Razorpay from 'razorpay';

export const getRazorpay = () => {
    // Check if variables are set at runtime, not build time
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay credentials missing from environment (getRazorpay)");
    }

    return new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};
