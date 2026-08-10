import Link from "next/link";

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="Unfolding — journal">
      <svg className="logo-mark" viewBox="0 0 28 28" aria-hidden="true">
        <path className="logo-primary" d="M5 4v12.3C5 21.7 8.3 25 13.3 25 18.6 25 23 21 23 14.8V4h-3.2v10.7c0 4.5-2.6 7.2-6.4 7.2-3.4 0-5.2-2.1-5.2-5.9V4H5Z" />
        <path className="logo-accent" d="M13.8 4h3.3v10.2c0 2.8-1.1 4.6-3.3 5.5V4Z" />
      </svg>
      <span>Unfolding</span>
    </Link>
  );
}
