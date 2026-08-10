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
    <p><strong>UNFOLDING</strong> is my record of exploring consciousness, reality, the body, mathematics, science, and whatever else becomes part of my inquiry into life.</p>
    <p>Some entries begin with something I am learning. Others begin with a question, an observation, an experiment, a practice, or an experience. Some may develop over time into arguments or proofs, while others may remain fragments, drawings, photographs, or descriptions of states that resist precise explanation.</p>
    <p>Here, <strong>phenomenology, metaphysics, science, experience, and creation</strong> meet freely. I see them not as separate fields, but rather as different ways of exploring what is.</p>
    <p>Where something can be tested, calculated, or established, I try to understand it as rigorously as I can. When I write from direct experience, I describe what I have experienced without trying to make it prove something beyond itself. And when a question remains unanswered, I prefer to leave it open rather than force it into an explanation.</p>
    <p>My view of the world is not something I consider fixed or complete. It changes with new experiences and the knowledge I acquire. I want to keep it open to what I do not yet know or understand.</p>
    <p>These are records of what I learn, observe, question, and create, and of the connections that sometimes emerge between things that at first seemed entirely unrelated.</p>
    <p><strong>The question of what any of this ultimately means remains open.</strong></p>
  </div></main>;
}

function RussianAbout() {
  return <main className="quiet-page"><h1>Об Unfolding</h1><div className="prose about-copy">
    <p><strong>UNFOLDING</strong> — это мои записи об исследовании сознания, реальности, тела, математики, науки и всего остального, что является для меня частью исследования жизни.</p>
    <p>Некоторые записи начинаются с того, что я изучаю. Другие начинаются с вопроса, наблюдения, эксперимента, практики или переживания. Некоторые со временем могут превратиться в рассуждения или доказательства, а другие так и останутся фрагментами, рисунками, фотографиями или описаниями состояний, которым трудно дать точное объяснение.</p>
    <p>Здесь свободно встречаются <strong>феноменология, метафизика, наука, опыт и творчество</strong>. Я воспринимаю их не как отдельные области, а скорее как разные способы исследовать то, что есть.</p>
    <p>То, что можно проверить, вычислить или установить, я стараюсь понять настолько строго, насколько могу. Когда я пишу о непосредственном опыте, я описываю то, что пережила, не пытаясь сделать из этого доказательство чего-то большего. А если вопрос остаётся без ответа, я предпочитаю оставить его открытым, а не пытаться во что бы то ни стало найти для него объяснение.</p>
    <p>Моя картина мира не является чем-то окончательно сложившимся. Она меняется вместе с новым опытом и знаниями, которые я получаю. Мне интересно сохранять её открытой для того, чего я пока не знаю или не понимаю.</p>
    <p>Это записи о том, что я изучаю, наблюдаю, о чём задаю вопросы и что создаю, и о связях, которые иногда обнаруживаются между вещами, поначалу казавшимися совершенно разными.</p>
    <p><strong>Вопрос о том, какой это всё имеет смысл, остаётся открытым.</strong></p>
  </div></main>;
}
