import { PrismaAdapter } from '@auth/prisma-adapter';
import { prismaService } from '@eduquiz/db';

import type { Adapter } from 'next-auth/adapters';

export const adapter: Adapter = PrismaAdapter(prismaService);