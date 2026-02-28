/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // reactCompiler is experimental and causes useContext to return null
  // during Vercel's static prerender of /_global-error. Disabled until stable.
  // reactCompiler: true,
};

export default nextConfig;
