import { redirect } from 'next/navigation';

export default function ManagementPage() {
  redirect('/admin?tab=vehicles');
}
