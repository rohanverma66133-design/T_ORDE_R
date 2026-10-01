import { redirect } from 'next/navigation';

export default async function LegacyProductRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/product/${id}`);
}
