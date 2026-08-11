import { pageMetadata } from "./i18n";
import LocaleHome from "./[locale]/page";

export function generateMetadata() { return pageMetadata("en"); }

export default function EnglishHome() {
  return <LocaleHome params={Promise.resolve({ locale: "en" })} />;
}
