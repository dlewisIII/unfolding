import type { Metadata } from "next";

export const metadata: Metadata = { title: "About", description: "About Unfolding and its author." };

export default function AboutPage() {
  return (
    <main className="quiet-page">
      <h1>About</h1>
      <div className="prose about-copy">
        <p><strong>UNFOLDING</strong> is a personal record of inquiry into consciousness, reality, the body, mathematics, science, and whatever else becomes part of that inquiry.</p>
        <p>Some entries begin with something I am learning. Others with a question, an observation, an experiment, a practice, or an experience. Some may develop into arguments or proofs; others may remain fragments, drawings, photographs, or descriptions of states that resist a precise explanation.</p>
        <p>The journal moves freely between <strong>phenomenology, metaphysics, science, experience, and creation</strong>. I do not see these as separate territories so much as different ways of approaching what is here.</p>
        <p>Where something can be tested, calculated, or established, I want to understand it as rigorously as I can. Where I am writing from direct experience, I describe what I experienced without asking the description to prove more than it can. And where a question remains unresolved, I would rather leave it unresolved than force it into an answer.</p>
        <p>This is not an attempt to construct a doctrine or persuade anyone into a particular view of reality. It is a record of learning, observing, questioning, making, and occasionally discovering connections between things that at first seemed unrelated.</p>
        <p>I write from where I am, and from what I encounter.</p>
        <p><strong>What any of it ultimately means is left open.</strong></p>
      </div>
    </main>
  );
}
