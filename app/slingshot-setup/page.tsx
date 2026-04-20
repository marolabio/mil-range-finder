import type { Metadata } from "next";
import { SlingshotSetupPage } from "@/components/slingshot-setup-page";
import { getDefaultSlingshotSetupInputs } from "@/lib/range-finder";

export const metadata: Metadata = {
  title: "Slingshot Setup",
  description: "Use your draw length to estimate active band length and a starting ammo match.",
};

export default function Page() {
  return <SlingshotSetupPage initialInputs={getDefaultSlingshotSetupInputs()} />;
}
