import React from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./Rules.scss";

export default function TermOfUse() { const { t } = useTranslation(); return <PolicyPage icon={<FileText />} eyebrow={t("normal.policy.termsEyebrow")} title={t("normal.policy.termsTitle")} intro={t("normal.policy.termsIntro")} sections={t("normal.policy.termsSections", { returnObjects: true })} note={t("normal.policy.note")} />; }
function PolicyPage({ icon, eyebrow, title, intro, sections, note }) { return <main className="rules-page"><div className="rules-shell"><header className="rules-hero"><span className="rules-icon">{icon}</span><p>{eyebrow}</p><h1>{title}</h1><div className="rules-intro">{intro}</div></header><div className="rules-content">{sections.map(([heading, ...paragraphs]) => <section key={heading}><h2>{heading}</h2>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}<aside className="rules-note"><ShieldCheck size={19} /><span>{note}</span></aside></div></div></main>; }
