import { redirect } from "next/navigation";

// Redireciona /admin/relatorios para /admin/reports
export default function AdminRelatoriosPage() {
  redirect("/admin/reports");
}

