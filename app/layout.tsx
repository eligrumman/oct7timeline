import "./globals.css";

export const metadata = {
  title: "October 7th Timeline",
  description: "An interactive timeline memorial of the October 7th events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
