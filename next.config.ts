import type { NextConfig } from 'next';
const config: NextConfig = { outputFileTracingRoot: process.cwd(), agentRules: false };
export default config;
