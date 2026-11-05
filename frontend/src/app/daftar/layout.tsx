import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'routeConnect | Pendaftaran pelanggan',
  description: 'Ajukan pemasangan internet routeConnect dan pilih paket yang sesuai.',
};

export default function RegistrationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
