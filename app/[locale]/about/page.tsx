import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy, isLocale, pageMetadata } from "../../i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata(locale, copy[locale].about, locale === "ru" ? "Об Unfolding и его авторе." : "About Unfolding and its author.", "/about");
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale === "ru" ? <RussianAbout /> : <EnglishAbout />;
}

function EnglishAbout() {
  return <main className="quiet-page"><h1>About</h1><div className="prose about-copy">
    <p><strong>UNFOLDING</strong> is a personal record of inquiry into consciousness, reality, the body, mathematics, science, and whatever else becomes part of that inquiry.</p>
    <p>Some entries begin with something I am learning. Others with a question, an observation, an experiment, a practice, or an experience. Some may develop into arguments or proofs; others may remain fragments, drawings, photographs, or descriptions of states that resist a precise explanation.</p>
    <p>The journal moves freely between <strong>phenomenology, metaphysics, science, experience, and creation</strong>. I do not see these as separate territories so much as different ways of approaching what is here.</p>
    <p>Where something can be tested, calculated, or established, I want to understand it as rigorously as I can. Where I am writing from direct experience, I describe what I experienced without asking the description to prove more than it can. And where a question remains unresolved, I would rather leave it unresolved than force it into an answer.</p>
    <p>This is not an attempt to construct a doctrine or persuade anyone into a particular view of reality. It is a record of learning, observing, questioning, making, and occasionally discovering connections between things that at first seemed unrelated.</p>
    <p>I write from where I am, and from what I encounter.</p>
    <p><strong>What any of it ultimately means is left open.</strong></p>
  </div></main>;
}

function RussianAbout() {
  return <main className="quiet-page"><h1>Об Unfolding</h1><div className="prose about-copy">
    <p><strong>UNFOLDING</strong> — это личная хроника исследования сознания, реальности, тела, математики, науки и всего остального, что становится частью этого исследования.</p>
    <p>Некоторые записи начинаются с того, что я изучаю. Другие — с вопроса, наблюдения, эксперимента, практики или переживания. Некоторые могут развиться в аргументы или доказательства; другие могут остаться фрагментами, рисунками, фотографиями или описаниями состояний, которые не поддаются точному объяснению.</p>
    <p>Журнал свободно движется между <strong>феноменологией, метафизикой, наукой, опытом и творчеством</strong>. Я воспринимаю их не столько как отдельные территории, сколько как разные способы приблизиться к тому, что есть.</p>
    <p>Там, где что-то можно проверить, вычислить или установить, я хочу понять это настолько строго, насколько могу. Там, где я пишу из непосредственного опыта, я описываю пережитое, не требуя от описания доказать больше, чем оно способно. А там, где вопрос остаётся нерешённым, я предпочитаю оставить его открытым, а не принуждать к ответу.</p>
    <p>Это не попытка построить доктрину или убедить кого-либо в определённом взгляде на реальность. Это хроника обучения, наблюдения, вопрошания, создания и иногда — обнаружения связей между вещами, которые сначала казались несвязанными.</p>
    <p>Я пишу из той точки, в которой нахожусь, и из того, с чем встречаюсь.</p>
    <p><strong>То, что всё это в конечном счёте значит, остаётся открытым.</strong></p>
  </div></main>;
}
