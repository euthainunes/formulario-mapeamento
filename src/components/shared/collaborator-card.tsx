import { Collaborator } from "@/types/user";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CollaboratorCard({ person }: { person: Collaborator }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-full bg-brand-secondary/15 text-brand-primary flex items-center justify-center text-sm font-semibold">
          {person.avatarInitials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{person.name}</p>
          <p className="text-xs text-text-secondary truncate">{person.jobTitle}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1 text-xs text-text-secondary">
        <p>
          <span className="text-text-primary font-medium">Empresa:</span> {person.company}
        </p>
        <p>
          <span className="text-text-primary font-medium">Departamento:</span> {person.department}
        </p>
        <p>
          <span className="text-text-primary font-medium">Time:</span> {person.team} · {person.group}
        </p>
      </div>
      {person.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {person.skills.map((skill) => (
            <Badge key={skill} tone="brand">
              {skill}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
