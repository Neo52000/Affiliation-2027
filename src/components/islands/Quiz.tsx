import { useEffect, useRef, useState } from 'preact/hooks';
import {
  LIBELLES_FONCTIONS,
  outilRetenu,
  recommander,
  trouverMetier,
  type FonctionCle,
  type OutilFacts,
  type QuizReponses,
  type QuizResultat,
  type Recommandation,
} from '../../lib/quiz';
import { affiliateLink } from '../../lib/affiliate';
import { envoyerMesure } from '../../lib/mesure-client';
import { de, typographier } from '../../lib/typographie';

interface MetierOption {
  nom: string;
  slug: string;
}

interface Props {
  metiers: MetierOption[];
  outils: (OutilFacts & { urlOfficielle: string; libelleTest: string })[];
  recosParMetier: Record<string, string[]>;
}

export default function Quiz({ metiers, outils, recosParMetier }: Props) {
  const [metierSaisi, setMetierSaisi] = useState('');
  const [statut, setStatut] = useState<QuizReponses['statut']>('micro');
  const [volume, setVolume] = useState<QuizReponses['facturesParMois']>('moins-10');
  const [comptePro, setComptePro] = useState(false);
  const [expert, setExpert] = useState(false);
  const [indispensables, setIndispensables] = useState<FonctionCle[]>([]);
  const [resultat, setResultat] = useState<QuizResultat | null>(null);
  // Saisie de métier non reconnue au moment du calcul (message dans le résultat).
  const [metierInconnu, setMetierInconnu] = useState<string | null>(null);
  const titreResultat = useRef<HTMLHeadingElement>(null);

  // Préremplissage depuis un hub de famille (?metier=slug). Un slug inconnu est
  // ignoré : seul un métier de la collection peut remplir le champ.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('metier');
    const metier = metiers.find((m) => m.slug === slug);
    if (metier) setMetierSaisi(metier.nom);
  }, [metiers]);

  // Le résultat apparaît sous le formulaire : le focus y est déplacé, et son
  // titre est la première chose annoncée.
  useEffect(() => {
    if (!resultat) return;
    titreResultat.current?.focus();
    // Quiz terminé : seul le logiciel retenu est transmis (mesure agrégée, sans cookie),
    // « aucun » en cas d'égalité ou sans logiciel compatible.
    envoyerMesure({ type: 'quiz_termine', outil: outilRetenu(resultat), emplacement: 'quiz' });
  }, [resultat]);

  const calculer = (e: Event) => {
    e.preventDefault();
    const metierSlug = trouverMetier(metierSaisi, metiers);
    setMetierInconnu(metierSaisi.trim() && !metierSlug ? metierSaisi.trim() : null);
    setResultat(
      recommander(
        {
          metierSlug,
          statut,
          facturesParMois: volume,
          besoinComptePro: comptePro,
          expertComptable: expert,
          indispensables,
        },
        outils,
        recosParMetier,
      ),
    );
  };

  const basculer = (f: FonctionCle, coche: boolean) =>
    setIndispensables((liste) => (coche ? [...liste, f] : liste.filter((x) => x !== f)));

  const Details = ({ reco }: { reco: Recommandation }) => (
    <>
      {reco.raisons.length > 0 && (
        <p class="mt-1 text-sm">
          <span class="font-semibold">Pourquoi&nbsp;:</span> {typographier(reco.raisons.join(', '))}
          .
        </p>
      )}
      {reco.aConfirmer.length > 0 && (
        <p class="mt-1 text-sm text-ink-soft">
          <span class="font-semibold">À confirmer auprès de l’éditeur&nbsp;:</span>{' '}
          {typographier(reco.aConfirmer.join(', '))}.
        </p>
      )}
    </>
  );

  const annonce = !resultat
    ? ''
    : resultat.exAequo.length > 1
      ? `${resultat.exAequo.length} logiciels à égalité : ${resultat.exAequo.map((r) => r.nom).join(', ')}.`
      : resultat.recommande
        ? `Recommandation : ${resultat.recommande.nom}.`
        : 'Aucun logiciel compatible avec vos fonctions indispensables.';

  const Bouton = ({ slug, nom }: { slug: string; nom: string }) => {
    const outil = outils.find((o) => o.slug === slug);
    if (!outil) return null;
    const lien = affiliateLink(slug, outil.urlOfficielle);
    return (
      <span class="inline-flex flex-col items-start gap-1">
        <a
          href={lien.href}
          rel={lien.rel}
          class="btn-cta"
          data-emplacement={`quiz-${slug}`}
          data-outil={slug}
        >
          Aller sur le site {de(nom)}
        </a>
        {lien.mention && <span class="mention-affiliee text-xs text-ink-soft">{lien.mention}</span>}
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
            placeholder={'Ex.\u00a0: plombier, infirmier libéral…'}
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
          <legend class="font-bold">4. Avez-vous besoin d'un compte professionnel&nbsp;?</legend>
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
          <legend class="font-bold">5. Travaillez-vous avec un expert-comptable&nbsp;?</legend>
          <label class="choix mr-2">
            <input type="radio" name="expert" checked={expert} onChange={() => setExpert(true)} />{' '}
            Oui
          </label>
          <label class="choix">
            <input type="radio" name="expert" checked={!expert} onChange={() => setExpert(false)} />{' '}
            Non
          </label>
        </fieldset>

        <fieldset>
          <legend class="font-bold">6. Fonctions indispensables (facultatif)</legend>
          <p class="text-sm text-ink-soft">
            Un logiciel dont l'absence est vérifiée est écarté&nbsp;; une donnée encore inconnue
            n'écarte personne.
          </p>
          {(Object.keys(LIBELLES_FONCTIONS) as FonctionCle[]).map((f) => (
            <label class="choix mr-3 inline-block" key={f}>
              <input
                type="checkbox"
                name="indispensables"
                value={f}
                checked={indispensables.includes(f)}
                onChange={(e) => basculer(f, (e.target as HTMLInputElement).checked)}
              />{' '}
              {LIBELLES_FONCTIONS[f]
                .replace(/^(les |l’|une )/, '')
                .replace(/^./, (c) => c.toUpperCase())}
            </label>
          ))}
        </fieldset>

        <button type="submit" class="btn-cta text-lg">
          Voir ma recommandation
        </button>
        <p id="quiz-note" class="text-xs text-ink-soft">
          Recommandation calculée à partir des faits vérifiés de chaque logiciel et de votre métier.
        </p>
      </form>

      <p role="status" class="sr-only">
        {typographier(annonce)}
      </p>

      {resultat && (
        <section class="mt-10">
          {metierInconnu && (
            <p class="en-bref mb-6 text-sm">
              {typographier(
                `Métier « ${metierInconnu} » non reconnu : la recommandation ne tient pas compte de votre métier. Choisissez-le dans la liste proposée pour l'affiner.`,
              )}
            </p>
          )}
          {resultat.exAequo.length > 1 ? (
            <>
              <h2 ref={titreResultat} tabIndex={-1} class="titre-section">
                Plusieurs logiciels à égalité
              </h2>
              <p class="mt-2">
                {typographier(
                  'Les données vérifiées ne permettent pas de les départager pour votre profil. Comparez les points à confirmer avant de choisir.',
                )}
              </p>
              <ul class="liste-filets mt-4">
                {resultat.exAequo.map((r) => (
                  <li key={r.slug}>
                    <a href={`/logiciels/${r.slug}`} class="font-semibold">
                      {r.nom}
                    </a>
                    <span class="pill ml-2 align-middle text-sm font-normal">
                      {outils.find((o) => o.slug === r.slug)?.libelleTest}
                    </span>
                    <p class="mt-1">{typographier(r.justification)}</p>
                    <Details reco={r} />
                  </li>
                ))}
              </ul>
            </>
          ) : resultat.recommande ? (
            <>
              <h2 ref={titreResultat} tabIndex={-1} class="titre-section">
                Notre recommandation
              </h2>
              <div class="mt-4">
                <p class="text-xl font-semibold">
                  <a href={`/logiciels/${resultat.recommande.slug}`}>{resultat.recommande.nom}</a>
                  <span class="pill ml-2 align-middle text-base font-normal">
                    {outils.find((o) => o.slug === resultat.recommande?.slug)?.libelleTest}
                  </span>
                </p>
                <p class="mt-1">{typographier(resultat.recommande.justification)}</p>
                <Details reco={resultat.recommande} />
                <div class="mt-3">
                  <Bouton slug={resultat.recommande.slug} nom={resultat.recommande.nom} />
                </div>
              </div>
              {resultat.alternatives.length > 0 && (
                <>
                  <h3 class="mt-8">
                    {resultat.alternatives.length === 2 ? 'Deux alternatives' : 'Une alternative'}
                  </h3>
                  <ul class="liste-filets mt-2">
                    {resultat.alternatives.map((a) => (
                      <li key={a.slug}>
                        <a href={`/logiciels/${a.slug}`} class="font-semibold">
                          {a.nom}
                        </a>
                        <p class="mt-1">{typographier(a.justification)}</p>
                        <Details reco={a} />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <>
              <h2 ref={titreResultat} tabIndex={-1} class="titre-section">
                Aucun logiciel compatible
              </h2>
              <p class="mt-2">
                {typographier(
                  'Aucun des logiciels comparés ne propose toutes les fonctions que vous jugez indispensables. Retirez-en une pour voir les plus proches.',
                )}
              </p>
            </>
          )}
          {resultat.exclus.length > 0 && (
            <p class="mt-6 text-sm text-ink-soft">
              {typographier(
                `Écartés : ${resultat.exclus.map((x) => `${x.nom}, qui ${x.motif}`).join(' ; ')}.`,
              )}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
