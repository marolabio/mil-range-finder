import type { Metadata } from "next";
import { MoaGuidePage } from "@/components/moa-guide-page";

export const metadata: Metadata = {
  title: "MOA Guide",
  description: "Learn how to estimate distance in meters using MOA readings and target size.",
};

export default function Page() {
  return <MoaGuidePage />;
}
