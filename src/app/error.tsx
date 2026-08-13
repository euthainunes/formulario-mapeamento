"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-error" />
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Algo deu errado neste ambiente demonstrativo</h1>
        <p className="mt-1 text-sm text-text-secondary max-w-md">
          Ocorreu um erro inesperado ao carregar os dados simulados. Você pode tentar novamente.
        </p>
      </div>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
