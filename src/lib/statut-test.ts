/**
 * Libellé public de l'état du test réel d'un outil.
 *
 * Aucun test n'a commencé tant que la fiche est `a_tester` : le schéma interdit
 * alors toute date de test et tout résultat. Afficher « Test en cours » aurait
 * affirmé un travail qui n'existe pas encore.
 */
export type StatutTest = 'a_tester' | 'teste';

export function libelleStatutTest(statut: StatutTest): string {
  return statut === 'teste' ? 'Testé' : 'Test à venir';
}

/**
 * Phrase de l'accueil sur l'avancement des tests, juste quel que soit le
 * nombre de logiciels testés : aucun, une partie, ou tous.
 */
export function phraseEtatTests(total: number, testes: number): string {
  if (testes <= 0) {
    return total === 1
      ? 'Le logiciel comparé n’a pas encore été testé par nos soins : sa fiche porte la mention « Test à venir » et aucune note.'
      : `Aucun des ${total} logiciels n’a encore été testé par nos soins : leurs fiches portent la mention « Test à venir » et aucune note.`;
  }
  if (testes >= total) {
    return total === 1
      ? 'Le logiciel comparé a passé notre protocole de test.'
      : `Les ${total} logiciels comparés ont passé notre protocole de test.`;
  }
  const restants = total - testes;
  return `Logiciels ayant passé notre protocole de test : ${testes} sur ${total}. ${
    restants === 1
      ? 'Le dernier porte encore la mention « Test à venir », sans note.'
      : `Les ${restants} autres portent encore la mention « Test à venir », sans note.`
  }`;
}
