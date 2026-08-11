import { pageMetadata } from "../i18n";
import LocaleSearch from "../[locale]/search/page";

export function generateMetadata() {
  return pageMetadata("en", "Search", "Search the Unfolding journal.", "/search");
}

export default function EnglishSearch() {
  return <LocaleSearch params={Promise.resolve({ locale: "en" })} />;
}
