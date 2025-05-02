import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata = {
  title: "Notes Ninja",
  description: "Take better notes, study smarter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

