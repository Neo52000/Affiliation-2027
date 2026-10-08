import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * Sélecteur de métier d'un hub de famille. De vrais boutons radio, rendus en
 * pastilles : flèches du clavier, état lu par les technologies d'assistance.
 * Le panneau reprend la recommandation publiée sur la fiche du métier choisi
 * (ses outils retenus, dans leur ordre), sans autre calcul. Une région d'état
 * stable annonce chaque changement.
 */
interface OutilChoix {
  slug: string;
  nom: string;
}

export interface MetierChoix {
  slug: string;
  nom: string;
  /** Outils retenus par la fiche métier, le premier étant sa recommandation. */
  outils: OutilChoix[];
}

interface Props {
  metiers: MetierChoix[];
}

const listeFr = (noms: string[]) =>
  noms.length < 2 ? noms.join('') : `${noms.slice(0, -1).join(', ')} et ${noms.at(-1)}`;

export default function MetierPicker({ metiers }: Props) {
  const [choix, setChoix] = useState<string | null>(null);
  const racine = useRef<HTMLDivElement>(null);

  // Un choix fait avant l'hydratation, ou restauré par le navigateur au retour
  // arrière, reste coché dans le DOM : l'état s'y aligne au montage.
  useEffect(() => {
    const coche = racine.current?.querySelector<HTMLInputElement>('input:checked');
    if (coche) setChoix(coche.value);
  }, []);
  const metier = metiers.find((m) => m.slug === choix) ?? null;
  const [reco, ...alternatives] = metier?.outils ?? [];

  const annonce =
    metier && reco
      ? `${metier.nom} : ${reco.nom} recommandé${
          alternatives.length > 0 ? `, alternatives ${listeFr(alternatives.map((a) => a.nom))}` : ''
        }.`
      : '';

  return (
    <div class="m-selecteur mt-6" ref={racine}>
      <fieldset>
        <legend class="font-bold">Votre métier dans cette famille</legend>
        <div class="m-puces mt-3">
          {metiers.map((m) => (
            <label class="m-puce" key={m.slug}>
              <input
                type="radio"
                name="metier-famille"
                value={m.slug}
                checked={choix === m.slug}
                onChange={() => setChoix(m.slug)}
              />
              <span class="m-puce-coche" aria-hidden="true">
                ✓
              </span>
              {m.nom}
            </label>
          ))}
        </div>
      </fieldset>

      <p role="status" class="sr-only">
        {annonce}
      </p>

      <div class="m-choix-panneau mt-4">
        {metier && reco ? (
          <div key={metier.slug} class="m-apparait">
            <p class="text-sm text-ink-soft">Sur la fiche {metier.nom}, notre recommandation :</p>
            <p class="text-xl font-extrabold">
              <a href={`/logiciels/${reco.slug}`}>{reco.nom}</a>
            </p>
            {alternatives.length > 0 && (
              <p class="mt-1 text-sm">
                Alternatives :{' '}
                {alternatives.map((a, i) => (
                  <span key={a.slug}>
                    {i > 0 && (i === alternatives.length - 1 ? ' et ' : ', ')}
                    <a href={`/logiciels/${a.slug}`}>{a.nom}</a>
                  </span>
                ))}
              </p>
            )}
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <a href={`/outils/quiz?metier=${encodeURIComponent(metier.slug)}`} class="btn-cta">
                Affiner en 5 questions
              </a>
              <a href={`/facturation-electronique/${metier.slug}`} class="btn-ghost">
                Lire la fiche {metier.nom}
              </a>
            </div>
          </div>
        ) : (
          <p class="text-sm text-ink-soft">
            Choisissez votre métier : la recommandation de sa fiche s'affiche ici, avec ses
            alternatives.
          </p>
        )}
      </div>
    </div>
  );
}
