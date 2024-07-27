import Image from "next/image";
import SubmissionForm from "@/components/SubmissionForm";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="container max-w-xl">
            <h1 className="text-4xl font-bold text-center mb-8">Submit a Gig</h1>
      <SubmissionForm />
        </div>
  </main>
  );
}
