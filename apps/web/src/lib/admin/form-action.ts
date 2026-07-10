/**
 * Adapte une Server Action retournant AdminActionResult en action
 * compatible avec la prop `action` d'un <form> (qui exige void | Promise<void>).
 *
 * Le résultat n'est pas consommé ici — ces formulaires ne lisent pas
 * (encore) le retour de la Server Action. Si un affichage d'erreur inline
 * est ajouté plus tard, remplacer par useFormState côté composant client.
 */
export function discardResult<Args extends readonly unknown[]>(
  action: (...args: Args) => Promise<unknown>,
): (...args: Args) => Promise<void> {
  return async (...args: Args) => {
    await action(...args);
  };
}
