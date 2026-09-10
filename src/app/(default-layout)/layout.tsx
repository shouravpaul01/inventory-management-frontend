
import Navbar from "@/components/shared/navbar";

type Props = {
  children: React.ReactNode;
  
};

export default function DefaultLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      {/* <Footer /> */}
    </div>
  );
}