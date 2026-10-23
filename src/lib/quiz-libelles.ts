/**
 * Format du quiz annoncé partout sur le site (accueil, fiches, guides, hubs…).
 * Une seule source : le test quiz-libelles.test.ts le confronte aux questions
 * réellement numérotées dans Quiz.tsx. Module sans dépendance : il part aussi
 * dans l'îlot MetierPicker.
 */
export const QUIZ_QUESTIONS = 5;
export const QUIZ_FACULTATIVES = 1;

/** « cinq questions et une facultative » */
export const QUIZ_FORMAT = 'cinq questions et une facultative';
/** Le métier déjà renseigné (fiche métier, sélecteur de métier) : une question de moins. */
export const QUIZ_QUESTIONS_METIER_CONNU = QUIZ_QUESTIONS - 1;
export const QUIZ_FORMAT_METIER_CONNU = 'quatre questions et une facultative';

export const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
