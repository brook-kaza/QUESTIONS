import QuestionForm from '@/components/QuestionForm';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-[#faf9f6] text-stone-900 py-6 sm:py-12 selection:bg-amber-200">
      <QuestionForm />
    </main>
  );
}
