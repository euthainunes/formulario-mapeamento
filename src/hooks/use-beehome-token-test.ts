"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/lib/client/api-fetch";

interface HealthCheckResult {
  alias: string;
  label: string;
  ok: boolean;
  detail: string;
}

interface TokenTestResponse {
  tokenAccepted: boolean;
  allChecksPassed: boolean;
  checkedAt: string;
  checks: HealthCheckResult[];
}

/** Cola/testa um token da BeeHome ao vivo (ver /api/admin/integrations/token) e sinaliza, endpoint por endpoint, se está funcionando ou qual falha aparece. */
export function useBeeHomeTokenTest() {
  const [token, setToken] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<TokenTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function submit() {
    setIsPending(true);
    setError(null);
    try {
      const response = await apiFetch<TokenTestResponse>("/api/admin/integrations/token", {
        method: "POST",
        body: JSON.stringify({ token: token.trim() }),
      });
      setResult(response);
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Não foi possível testar o token agora.");
    } finally {
      setIsPending(false);
    }
  }

  async function clear() {
    setIsClearing(true);
    setError(null);
    try {
      await apiFetch<{ cleared: boolean }>("/api/admin/integrations/token", { method: "DELETE" });
      setResult(null);
      setToken("");
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover o token agora.");
    } finally {
      setIsClearing(false);
    }
  }

  return { token, setToken, submit, clear, isPending, isClearing, result, error };
}
