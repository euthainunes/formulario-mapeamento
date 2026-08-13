import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <Compass className="h-10 w-10 text-brand-primary" />
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Página não encontrada</h1>
        <p className="mt-1 text-sm text-text-secondary max-w-md">
          O conteúdo que você procura não existe neste ambiente demonstrativo.
        </p>
      </div>
      <Link href="/">
        <Button>Voltar ao início</Button>
      </Link>
    </div>
  );
}
