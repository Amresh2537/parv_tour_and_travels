import BookingForm from '@/components/BookingForm';
import Stepper from '@/components/Stepper';

export const metadata = {
  title: 'Booking Entry - PARV Tour & Travels',
};

export default function BookingEntryPage() {
  return (
    <div>
      <Stepper />
      <BookingForm />
    </div>
  );
}