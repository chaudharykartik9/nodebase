import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrism = global as unknown as {
    prisma : PrismaClient;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = globalForPrism.prisma || new PrismaClient({ adapter }) ;


if(process.env.NODE_ENV !== "production"){
    globalForPrism.prisma = prisma ;
}


export default prisma ;
