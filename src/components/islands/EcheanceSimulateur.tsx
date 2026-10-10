import { useEffect, useRef, useState } from 'preact/hooks';
import { situerEcheances, type Echeance, type SituationTva, type Taille } from '../../lib/echeance';
import { formatDateFr } from '../../lib/dates';

interface Props {
  echeances: Echeance[];
}

export default function EcheanceSimulateur({ echeances }: Props) {
  const [taille, setTaille] = useState<Taille>('pme-tpe-micro');
  const [tva, setTva] = useState<SituationTva>('assujetti');
  const [affiche, setAffiche] = useState(false);
  // Le focus va sur le titre du résultat (même modèle que le quiz) : une région
  // aria-live insérée déjà remplie n'est pas annoncée de façon fiable.
  const titreResultat = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (affiche) titreResultat.current?.focus();
  }, [affiche]);

  const situation = affiche ? situerEcheances(taille, tva, echeances) : null;

  const Ligne = ({ titre, e }: { titre: string; e: Echeance | null }) =>
    e && (
      <li>
        <strong>{titre} :</strong> {formatDateFr(e.date)}{' '}
        <span class={e.statut === 'en_vigueur' ? 'font-semibold text-accent' : 'text-ink-soft'}>
          ({e.statut === 'en_vigueur' ? 'déjà en vigueur' : 'à venir'})
        </span>
        {e.complement && (
          <span class="mt-1 block text-sm text-ink-soft">{e.complement.replace(/\.?$/, '.')}</span>
        )}
      </li>
    );

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAffiche(true);
        }}
        class="space-y-4"
      >
        <div>
          <label class="font-bold" for="sim-taille">
            Taille de votre entreprise
          </label>
          <select
            id="sim-taille"
            class="champ mt-1"
            value={taille}
            onChange={(e) => {
              setTaille((e.target as HTMLSelectElement).value as Taille);
              setAffiche(false);
            }}
          >
            <option value="pme-tpe-micro">TPE, PME ou micro-entreprise</option>
            <option value="ge-eti">Grande entreprise ou ETI</option>
          </select>
        </div>
        <div>
          <label class="font-bold" for="sim-tva">
            Votre situation TVA
          </label>
          <select
            id="sim-tva"
            class="champ mt-1"
            value={tva}
            onChange={(e) => {
              setTva((e.target as HTMLSelectElement).value as SituationTva);
              setAffiche(false);
            }}
          >
            <option value="assujetti">Assujettie à la TVA</option>
            <option value="franchise">Franchise en base (micro…)</option>
            <option value="non-assujetti">Non assujettie</option>
          </select>
        </div>
        <button type="submit" class="btn-cta text-lg">
          Voir mes échéances
        </button>
      </form>

      {situation && (
        <section class="mt-8">
          <h2 ref={titreResultat} tabIndex={-1} class="titre-section">
            Vos échéances
          </h2>
          {situation.horsChamp ? (
            <p class="mt-3">{situation.message}</p>
          ) : (
            <>
              <ul class="liste-filets mt-2">
                <Ligne titre="Recevoir des factures électroniques" e={situation.reception} />
                <Ligne titre="Émettre vos factures en électronique" e={situation.emission} />
                <Ligne titre="E-reporting (données de transactions)" e={situation.eReporting} />
              </ul>
              <h3 class="mt-8">Votre check-list</h3>
              <ol class="mt-2 list-decimal space-y-2 pl-5">
                {situation.checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}
    </div>
  );
}
