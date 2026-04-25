import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";
import { getHomePageInputs } from "@/lib/range-finder";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Reticle Scope Range",
  description: "Estimate target distance in meters using MOA or MIL readings and a known target size.",
};

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const initialInputs = getHomePageInputs(resolvedSearchParams);

  return <HomePage key={JSON.stringify(initialInputs)} initialInputs={initialInputs} />;
}
