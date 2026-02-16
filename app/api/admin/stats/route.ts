
import { NextResponse } from 'next/server';
import { loadDoc } from '@/lib/db';
import { startOfDay, subDays, format, startOfWeek, startOfMonth, parseISO, isSameDay, isSameWeek, isSameMonth } from 'date-fns';

export async function GET() {
    try {
        const doc = await loadDoc();
        const productsSheet = doc.sheetsByTitle['Products'];
        const ordersSheet = doc.sheetsByTitle['Orders'];
        const usersSheet = doc.sheetsByTitle['Users'];

        const [products, orders, users] = await Promise.all([
            productsSheet.getRows(),
            ordersSheet.getRows(),
            usersSheet.getRows()
        ]);

        // Helper to parse amount safely
        const getAmount = (row: any) => {
            const val = parseFloat(row.get('amount') || '0');
            return isNaN(val) ? 0 : val;
        };

        // Helper to parse date
        const getDate = (row: any) => {
            try {
                return parseISO(row.get('created_at'));
            } catch (e) {
                return new Date();
            }
        };

        // Calculate Revenue
        const totalRevenue = orders.reduce((acc, order) => acc + getAmount(order), 0);

        // Recent Orders
        // Current Orders (Active)
        const currentOrders = orders
            .slice()
            .reverse() // Newest first
            .map(o => {
                const userEmail = (o.get('user_email') || '').toLowerCase().trim();
                let customerName = '';

                // 1. Try to find the official registered name from Users sheet
                const user = users.find(u => (u.get('email') || '').toLowerCase().trim() === userEmail);
                if (user && user.get('name') && user.get('name').trim() !== '') {
                    customerName = user.get('name');
                }

                // 2. Fallback to Name stored in the Order (if any)
                if ((!customerName || customerName === '') && o.get('name')) {
                    customerName = o.get('name');
                }

                // 3. Last resort: Email prefix
                if (!customerName || customerName === '') {
                    customerName = userEmail ? userEmail.split('@')[0] : 'Guest';
                }

                return {
                    id: o.get('order_id'),
                    customer: customerName,
                    email: o.get('user_email'), // Keep original case for display if needed
                    address: o.get('address'),
                    amount: getAmount(o),
                    date: o.get('created_at'),
                    status: o.get('status') || 'Pending'
                };
            })
            .filter(o => !['Delivered', 'Cancelled', 'Refunded'].includes(o.status))
            .slice(0, 10); // Limit to 10 active orders

        // Recent Orders (Kept for backward compat if needed, but we will return currentOrders)


        // Chart Data Preparation
        const dailyRevenue: Record<string, number> = {};
        const weeklyRevenue: Record<string, number> = {};
        const monthlyRevenue: Record<string, number> = {};
        const productSales: Record<string, number> = {};

        // Initialize last 7 days for daily
        for (let i = 0; i < 7; i++) {
            const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
            dailyRevenue[dateStr] = 0;
        }

        orders.forEach(order => {
            const date = getDate(order);
            const amount = getAmount(order);
            const itemsJson = order.get('items');

            // Revenue Charts
            const dayKey = format(date, 'yyyy-MM-dd');
            if (dailyRevenue[dayKey] !== undefined) dailyRevenue[dayKey] += amount; // Only count for initiated days if strict 7 days

            // Weekly: Show last 4 weeks or current week
            const weekStart = startOfWeek(date);
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            // Only include if within last 4 weeks or so, or if we want just "Current Week" vs "Past Weeks"
            // For now, let's just keep accumulating by week key. 
            // If user wants "Week till date", it usually means "Current Week's Total". 
            // The chart will show bars for each week. The last bar is "Current Week".
            weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + amount;

            const monthStart = startOfMonth(date);
            const monthKey = format(monthStart, 'yyyy-MM');
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + amount;

            // Product Stats
            try {
                const items = JSON.parse(itemsJson || '[]');
                items.forEach((item: any) => {
                    const name = item.name || 'Unknown';
                    const qty = parseInt(item.quantity || '1');
                    productSales[name] = (productSales[name] || 0) + qty;
                });
            } catch (e) {
                // Ignore parse errors
            }
        });

        return NextResponse.json({
            totalOrders: orders.length,
            totalRevenue: totalRevenue,
            totalProducts: products.length,
            totalUsers: users.length,
            recentOrders: currentOrders, // Sending currentOrders as recentOrders to avoid breaking frontend type initially, or just rename property if I handle it in frontend
            currentOrders,
            charts: {
                daily: dailyRevenue,
                weekly: weeklyRevenue,
                monthly: monthlyRevenue,
                products: productSales
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
