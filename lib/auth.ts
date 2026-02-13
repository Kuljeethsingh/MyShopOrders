
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        maxAge: 600, // 10 minutes
    },

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const { verifyUser } = await import("@/lib/db");
                    const user = await verifyUser(credentials.email, credentials.password);

                    if (user) {
                        return {
                            id: user.email,
                            name: user.name,
                            email: user.email,
                            role: user.role
                        };
                    }
                } catch (error) {
                    console.error("Auth Error:", error);
                }
                return null;
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                try {
                    const { loadDoc } = await import("@/lib/db");
                    const doc = await loadDoc();
                    const sheet = doc.sheetsByTitle['Users'];
                    const rows = await sheet.getRows();
                    const existingUser = rows.find(r => r.get('email') === user.email);

                    if (!existingUser) {
                        await sheet.addRow({
                            name: user.name || '',
                            email: user.email || '',
                            password: '',
                            role: 'user',
                            created_at: new Date().toISOString()
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Error saving Google user:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                // For Google login, user comes from provider. We need to fetch role from DB.
                // Or if we just added them, we know it's 'user'.
                // To be safe and consistent, let's fetch role from DB for everyone.
                try {
                    const { loadDoc } = await import("@/lib/db");
                    const doc = await loadDoc();
                    const sheet = doc.sheetsByTitle['Users'];
                    const rows = await sheet.getRows();
                    // Use token.email if user.email is missing? User should have email.
                    const dbUser = rows.find(r => r.get('email') === (user.email || token.email));
                    if (dbUser) {
                        token.role = dbUser.get('role');
                    }
                } catch (e) {
                    console.error("Error fetching role for JWT", e);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
};
