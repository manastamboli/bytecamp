import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import SmoothScroll from "@/components/smooth-scroll";
import { Toaster } from "sonner";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "SitePilot - AI-Powered Multi-Tenant Website Builder",
  description: "Build, manage, and scale multi-tenant websites with intelligent automation and complete tenant isolation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfairDisplay.variable} antialiased transition-colors duration-500`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
