export type DeviceType = "desktop" | "mobile" | "tablet";

export interface Collaborator {
  id: string;
  name: string;
  avatarInitials: string;
  company: string;
  department: string;
  jobTitle: string;
  group: string;
  team: string;
  device: DeviceType;
  lastActivity: string; // ISO date
  admissionDate: string; // ISO date
  birthDate: string; // ISO date (ano fictício, apenas dia/mês são relevantes)
  email: string;
  skills: string[];
  active: boolean;
}
