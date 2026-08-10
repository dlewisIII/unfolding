import type { Metadata } from "next";

export const metadata: Metadata = { title: "About", description: "About Unfolding and its author." };

export default function AboutPage() {
  return (
    <main className="quiet-page">
      <p className="eyebrow">About</p>
      <h1>A place for thoughts to unfold.</h1>
      <div className="prose about-copy">
        <p>Unfolding is Anastasia’s personal journal, research notebook, and digital garden.</p>
        <p>It holds thoughts, observations, study notes, mathematical arguments, small investigations, and images in one chronological corpus. The subjects may change; the author does not.</p>
        <p>The journal exists as a practice of learning to think independently and formulate ideas with greater precision. Review can question the writing and reasoning, but the author’s text remains immutable unless she explicitly chooses to change it.</p>
        <p>Over time, the same archive may also be explored through the concepts and connections that emerge within it. That semantic view will complement the journal’s chronology rather than divide it into separate blogs.</p>
      </div>
    </main>
  );
}
