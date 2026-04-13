import type { Metadata } from "next";
import { StepsPage } from "@/components/steps-page";
import { getDefaultStepRangeInputs } from "@/lib/range-finder";

export const metadata: Metadata = {
  title: "Step Range",
  description: "Estimate distance by counting steps with your personal pace calibration.",
};

export default function Page() {
  return <StepsPage initialInputs={getDefaultStepRangeInputs()} />;
}
