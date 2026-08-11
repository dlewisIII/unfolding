import type { Metadata } from "next";
import LocaleEntry, { generateMetadata as generateLocaleMetadata } from "../../[locale]/entries/[slug]/page";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return generateLocaleMetadata({ params: Promise.resolve({ locale: "en", slug }) });
}

export default async function EnglishEntry({ params }: Props) {
  const { slug } = await params;
  return <LocaleEntry params={Promise.resolve({ locale: "en", slug })} />;
}
