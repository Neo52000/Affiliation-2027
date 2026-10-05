import { useState } from 'preact/hooks';
import {
  verifierFacture,
  type MentionFacture,
  type ResultatVerification,
} from '../../lib/facture-check';

interface Props {
  mentions: MentionFacture[];
}

export default function VerificateurFacture({ mentions }: Props) {
  const [cochees, setCochees] = useState<Set<string>>(new Set());
  const [resultat, setResultat] = useState<ResultatVerification | null>(null);

  const socle = mentions.filter((m) => m.condition === null);
  const conditionnelles = mentions.filter((m) => m.condition !== null);

  const basculer = (id: string) => {
    const s = new Set(cochees);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setCochees(s);
    setResultat(null);
  };

  const Groupe = ({ titre, liste }: { titre: string; liste: MentionFacture[] }) => (
    <fieldset class="mt-4">
      <legend class="font-bold">{titre}</legend>
      <ul class="mt-2 space-y-2">
        {liste.map((m) => (
          <li key={m.id}>
            <label class="flex items-start gap-2">
              <input
                type="checkbox"
                class="mt-1"
                checked={cochees.has(m.id)}
                onChange={() => basculer(m.id)}
              />
              <span>
                {m.libelle}
                {m.condition && <span class="block text-sm text-ink-soft">Si : {m.condition}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );

  const Manquante = ({ m }: { m: MentionFacture }) => (
    <li class="rounded border border-border p-3">
      <p class="font-bold">{m.libelle}</p>
      <p class="mt-1 text-sm">{m.regle}</p>
      {m.condition && <p class="mt-1 text-sm text-ink-soft">Condition : {m.condition}</p>}
      <p class="mt-1 text-sm">
        <a href={m.url_source} rel="noopener">
          Source officielle
        </a>
      </p>
    </li>
  );

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setResultat(verifierFacture(mentions, cochees));
        }}
      >
        <p class="text-sm text-ink-soft">
          Cochez les mentions déjà présentes sur votre facture. Tout se passe dans votre navigateur
          : aucune donnée n'est envoyée.
        </p>
        <Groupe titre="Mentions toujours obligatoires" liste={socle} />
        <Groupe titre="Mentions selon votre situation" liste={conditionnelles} />
        <button
          type="submit"
          class="mt-5 rounded bg-accent px-5 py-2 font-bold text-white hover:bg-accent-dark"
        >
          Vérifier ma facture
        </button>
      </form>

      {resultat && (
        <section aria-live="polite" class="mt-8">
          {resultat.complet ? (
            <p class="rounded border-2 border-accent p-4 font-bold">
              Toutes les mentions toujours obligatoires sont présentes. Vérifiez encore les mentions
              conditionnelles ci-dessous si votre situation est concernée.
            </p>
          ) : (
            <>
              <h2 class="text-2xl font-bold">
                {resultat.manquantes.length} mention(s) obligatoire(s) manquante(s)
              </h2>
              <ul class="mt-3 space-y-3">
                {resultat.manquantes.map((m) => (
                  <Manquante m={m} key={m.id} />
                ))}
              </ul>
            </>
          )}
          {resultat.aVerifier.length > 0 && (
            <>
              <h3 class="mt-6 text-lg font-bold">À vérifier selon votre situation</h3>
              <ul class="mt-3 space-y-3">
                {resultat.aVerifier.map((m) => (
                  <Manquante m={m} key={m.id} />
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
