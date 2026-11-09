import { ParticipantPayments } from '@/components/payments/participant-payments';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ParticipantPayments orderId={(await params).id} />;
}
