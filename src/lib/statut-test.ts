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
