import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata = {
  title: "Smart Note Companion",
  description: "Take better notes, study smarter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

