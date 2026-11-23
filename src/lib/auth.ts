import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { polarClient, requireEnv } from "./polar";
import { getSocialProviders } from "./social-providers";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword:{
        enabled:true,
        autoSignIn: true
    },
    // GitHub and Google, for the providers that are set up in .env
    socialProviders: getSocialProviders(),
    plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: requireEnv("POLAR_PRODUCT_ID"),
                            slug: "pro",
                        },
                    ],
                    successUrl: requireEnv("POLAR_SUCCESS_URL"),
                    authenticatedUsersOnly: true,
                }),
                portal(),
            ],
        }),
    ],
});
