import { redirect } from "next/navigation";

// Garage has merged into Profile. Redirect all deep-links.
export default function GaragePage() {
  redirect("/profile");
}
