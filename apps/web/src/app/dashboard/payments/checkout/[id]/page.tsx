import { ParticipantPayments } from '@/components/payments/participant-payments';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ParticipantPayments enrollmentId={(await params).id} />;
}
