import { useEffect, useRef, useState } from 'preact/hooks';
import { pluriel } from '../../lib/typographie';
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
  // Focus sur le titre du résultat, comme le quiz (pas de région aria-live
  // insérée déjà remplie).
  const titreResultat = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (resultat) titreResultat.current?.focus();
  }, [resultat]);

  const socle = mentions.filter((m) => m.condition === null);
  const conditionnelles = mentions.filter((m) => m.condition !== null);

  const basculer = (id: string) => {
    const s = new Set(cochees);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setCochees(s);
    setResultat(null);
  };

  // Fonctions de rendu appelées directement, et non composants : un composant
  // déclaré dans le corps serait un nouveau type à chaque rendu, et Preact
  // remonterait le groupe, case focalisée comprise, à chaque coche.
  const groupe = (titre: string, liste: MentionFacture[]) => (
    <fieldset class="mt-4">
      <legend class="font-bold">{titre}</legend>
      <ul class="mt-2 space-y-2">
        {liste.map((m) => (
          <li key={m.id}>
            <label class="flex items-start gap-2">
              <input
                type="checkbox"
                class="mt-1 size-[1.125rem] shrink-0"
                checked={cochees.has(m.id)}
                onChange={() => basculer(m.id)}
              />
              <span>
                {m.libelle}
                {m.condition && (
                  <span class="block text-sm text-ink-soft">Condition : {m.condition}</span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );

  const manquante = (m: MentionFacture) => (
    <li key={m.id}>
      <p class="font-semibold">{m.libelle}</p>
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
        {groupe('Mentions toujours obligatoires', socle)}
        {groupe('Mentions selon votre situation', conditionnelles)}
        <button type="submit" class="btn-cta mt-5 text-lg">
          Vérifier ma facture
        </button>
      </form>

      {resultat && (
        <section class="mt-8">
          {resultat.complet ? (
            <h2 ref={titreResultat} tabIndex={-1} class="titre-section">
              Aucune mention obligatoire manquante
            </h2>
          ) : (
            <>
              <h2 ref={titreResultat} tabIndex={-1} class="titre-section">
                {pluriel(resultat.manquantes.length, 'mention obligatoire manquante')}
              </h2>
              <ul class="liste-filets mt-2">{resultat.manquantes.map(manquante)}</ul>
            </>
          )}
          {resultat.aVerifier.length > 0 && (
            <>
              <h3 class="mt-8">À vérifier selon votre situation</h3>
              <ul class="liste-filets mt-2">{resultat.aVerifier.map(manquante)}</ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
