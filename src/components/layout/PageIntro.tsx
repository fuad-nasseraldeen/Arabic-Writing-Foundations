import { Leaf } from "lucide-react";

export function PageIntro({ title, eyebrow, description }: {
  title: string;
  eyebrow: string;
  description?: string;
}) {
  return (
    <header className="page-intro">
      <div className="page-intro__copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1><Leaf aria-hidden="true" />{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="page-intro__leaves" aria-hidden="true"><Leaf /><Leaf /><Leaf /></div>
    </header>
  );
}
