declare module 'next-pwa' {
    import { NextConfig } from 'next';
    function withPWA(config: NextConfig): (phase: string, { defaultConfig }: any) => NextConfig;
    export default withPWA;
}