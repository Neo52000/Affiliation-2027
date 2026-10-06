import { useState } from 'preact/hooks';

interface Props {
  metiers: { nom: string; slug: string }[];
}

type Etat =
  | { phase: 'saisie' }
  | { phase: 'envoi' }
  | { phase: 'ok'; message: string }
  | { phase: 'erreur'; message: string };

export default function RappelEmail({ metiers }: Props) {
  const [email, setEmail] = useState('');
  const [metier, setMetier] = useState('');
  const [consentement, setConsentement] = useState(false);
  const [etat, setEtat] = useState<Etat>({ phase: 'saisie' });

  const envoyer = async (e: Event) => {
    e.preventDefault();
    setEtat({ phase: 'envoi' });
    try {
      const reponse = await fetch('/.netlify/functions/rappel-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, metier: metier || null, consentement }),
      });
      const corps = (await reponse.json()) as { message?: string; erreur?: string };
      if (reponse.ok) {
        setEtat({ phase: 'ok', message: corps.message ?? 'Inscription enregistrée.' });
      } else {
        setEtat({ phase: 'erreur', message: corps.erreur ?? "L'inscription a échoué." });
      }
    } catch {
      setEtat({ phase: 'erreur', message: 'Le service de rappel est momentanément indisponible.' });
    }
  };

  if (etat.phase === 'ok') {
    return <p class="card-top rounded-lg border border-border p-4 font-bold">{etat.message}</p>;
  }

  return (
    <form onSubmit={envoyer} class="space-y-3">
      <div>
        <label class="font-bold" for="rappel-email">
          Votre email
        </label>
        <input
          id="rappel-email"
          type="email"
          required
          autocomplete="email"
          class="champ mt-1"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
        />
      </div>
      <div>
        <label class="font-bold" for="rappel-metier">
          Votre métier <span class="font-normal text-ink-soft">(facultatif)</span>
        </label>
        <select
          id="rappel-metier"
          class="champ mt-1"
          value={metier}
          onChange={(e) => setMetier((e.target as HTMLSelectElement).value)}
        >
          <option value="">—</option>
          {metiers.map((m) => (
            <option value={m.slug} key={m.slug}>
              {m.nom}
            </option>
          ))}
        </select>
      </div>
      <label class="flex items-start gap-2">
        <input
          type="checkbox"
          class="mt-1"
          required
          checked={consentement}
          onChange={() => setConsentement(!consentement)}
        />
        <span class="text-sm">
          J'accepte de recevoir un rappel par email avant mon échéance de facturation électronique.
          Désinscription possible à tout moment via le lien présent dans chaque email (double opt-in
          : une confirmation vous sera demandée).
        </span>
      </label>
      <button
        type="submit"
        disabled={etat.phase === 'envoi'}
        class="btn-cta text-lg disabled:opacity-50"
      >
        {etat.phase === 'envoi' ? 'Envoi…' : 'Recevoir mon rappel'}
      </button>
      {etat.phase === 'erreur' && (
        <p class="rounded border border-border bg-paper-soft p-3 text-sm" role="alert">
          {etat.message}
        </p>
      )}
    </form>
  );
}
