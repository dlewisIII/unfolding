import { pageMetadata } from "../i18n";
import LocaleAbout from "../[locale]/about/page";

export function generateMetadata() {
  return pageMetadata("en", "About", "About Unfolding and its author.", "/about");
}

export default function EnglishAbout() {
  return <LocaleAbout params={Promise.resolve({ locale: "en" })} />;
}
