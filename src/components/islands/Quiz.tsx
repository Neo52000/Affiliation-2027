import { useState } from 'preact/hooks';
import { recommander, type OutilFacts, type QuizReponses, type QuizResultat } from '../../lib/quiz';
import { affiliateLink } from '../../lib/affiliate';

interface MetierOption {
  nom: string;
  slug: string;
}

interface Props {
  metiers: MetierOption[];
  outils: (OutilFacts & { urlOfficielle: string })[];
  recosParMetier: Record<string, string[]>;
}

export default function Quiz({ metiers, outils, recosParMetier }: Props) {
  const [metierSaisi, setMetierSaisi] = useState('');
  const [statut, setStatut] = useState<QuizReponses['statut']>('micro');
  const [volume, setVolume] = useState<QuizReponses['facturesParMois']>('moins-10');
  const [comptePro, setComptePro] = useState(false);
  const [expert, setExpert] = useState(false);
  const [resultat, setResultat] = useState<QuizResultat | null>(null);

  const trouverSlug = (saisie: string): string | null => {
    const s = saisie.trim().toLowerCase();
    return metiers.find((m) => m.nom.toLowerCase() === s)?.slug ?? null;
  };

  const calculer = (e: Event) => {
    e.preventDefault();
    setResultat(
      recommander(
        {
          metierSlug: trouverSlug(metierSaisi),
          statut,
          facturesParMois: volume,
          besoinComptePro: comptePro,
          expertComptable: expert,
        },
        outils,
        recosParMetier,
      ),
    );
  };

  const Bouton = ({ slug, nom }: { slug: string; nom: string }) => {
    const outil = outils.find((o) => o.slug === slug);
    if (!outil) return null;
    const lien = affiliateLink(slug, outil.urlOfficielle);
    return (
      <span class="inline-flex flex-col items-start gap-1">
        <a
          href={lien.href}
          rel={lien.sponsored ? 'sponsored nofollow noopener' : 'noopener'}
          class="btn-cta"
          data-emplacement={`quiz-${slug}`}
        >
          Découvrir {nom}
        </a>
        {lien.sponsored && <span class="text-xs text-ink-soft">lien affilié</span>}
      </span>
    );
  };

  return (
    <div>
      <form onSubmit={calculer} class="space-y-5" aria-describedby="quiz-note">
        <div>
          <label class="font-bold" for="quiz-metier">
            1. Votre métier
          </label>
          <input
            id="quiz-metier"
            list="quiz-metiers-liste"
            class="champ mt-1"
            placeholder="Ex. : plombier, infirmier libéral…"
            value={metierSaisi}
            onInput={(e) => setMetierSaisi((e.target as HTMLInputElement).value)}
          />
          <datalist id="quiz-metiers-liste">
            {metiers.map((m) => (
              <option value={m.nom} key={m.slug} />
            ))}
          </datalist>
        </div>

        <div>
          <label class="font-bold" for="quiz-statut">
            2. Votre statut
          </label>
          <select
            id="quiz-statut"
            class="champ mt-1"
            value={statut}
            onChange={(e) =>
              setStatut((e.target as HTMLSelectElement).value as QuizReponses['statut'])
            }
          >
            <option value="micro">Micro-entreprise</option>
            <option value="ei">Entreprise individuelle</option>
            <option value="societe">Société (SASU, SARL, EURL…)</option>
          </select>
        </div>

        <div>
          <label class="font-bold" for="quiz-volume">
            3. Factures émises par mois
          </label>
          <select
            id="quiz-volume"
            class="champ mt-1"
            value={volume}
            onChange={(e) =>
              setVolume((e.target as HTMLSelectElement).value as QuizReponses['facturesParMois'])
            }
          >
            <option value="moins-10">Moins de 10</option>
            <option value="10-50">Entre 10 et 50</option>
            <option value="plus-50">Plus de 50</option>
          </select>
        </div>

        <fieldset>
          <legend class="font-bold">4. Avez-vous besoin d'un compte professionnel ?</legend>
          <label class="choix mr-2">
            <input
              type="radio"
              name="compte-pro"
              checked={comptePro}
              onChange={() => setComptePro(true)}
            />{' '}
            Oui
          </label>
          <label class="choix">
            <input
              type="radio"
              name="compte-pro"
              checked={!comptePro}
              onChange={() => setComptePro(false)}
            />{' '}
            Non
          </label>
        </fieldset>

        <fieldset>
          <legend class="font-bold">5. Travaillez-vous avec un expert-comptable ?</legend>
          <label class="choix mr-2">
            <input type="radio" name="expert" checked={expert} onChange={() => setExpert(true)} />{' '}
            Oui
          </label>
          <label class="choix">
            <input type="radio" name="expert" checked={!expert} onChange={() => setExpert(false)} />{' '}
            Non
          </label>
        </fieldset>

        <button type="submit" class="btn-cta text-lg">
          Voir ma recommandation
        </button>
        <p id="quiz-note" class="text-xs text-ink-soft">
          Recommandation fondée sur les faits vérifiés de chaque outil et sur votre métier — jamais
          sur les commissions.
        </p>
      </form>

      {resultat && (
        <section aria-live="polite" class="mt-8 space-y-4">
          <h2 class="text-2xl font-bold">Notre recommandation</h2>
          <div class="card-top carte-reco rounded-lg border border-border p-4">
            <p class="font-bold">
              <a href={`/logiciels/${resultat.recommande.slug}`}>{resultat.recommande.nom}</a>
              <span class="ml-2 text-sm font-normal text-ink-soft">Test en cours</span>
            </p>
            <p class="mt-1">{resultat.recommande.justification}</p>
            <div class="mt-3">
              <Bouton slug={resultat.recommande.slug} nom={resultat.recommande.nom} />
            </div>
          </div>
          <h3 class="text-lg font-bold">Deux alternatives</h3>
          {resultat.alternatives.map((a) => (
            <div class="card-reco rounded-lg border border-border p-4" key={a.slug}>
              <p class="font-bold">
                <a href={`/logiciels/${a.slug}`}>{a.nom}</a>
              </p>
              <p class="mt-1">{a.justification}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
