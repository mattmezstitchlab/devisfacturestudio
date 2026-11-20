# MATT MEZ STUDIO

Studio de gestion de prestations artistiques en français, construit avec Expo, React Native et TypeScript. Le même projet exporte les plateformes web, iOS et Android.

## Première utilisation

Le tableau de bord public est un bac à sable **explicitement fictif**. Les modifications de démonstration ne durent que le temps de la session de l’onglet. Ne pas y saisir d’informations confidentielles.

1. Choisir **Ouvrir mon espace privé**, ou sur téléphone **Réglages → Accéder à mon espace**.
2. Utiliser le code d’initialisation transmis séparément au propriétaire, puis choisir un mot de passe personnel d’au moins dix caractères.
3. Vérifier le profil du prestataire, le statut juridique, les clauses et le prochain numéro avant la première émission.

Le code d’initialisation déchiffre exclusivement le profil de départ. Il ne déverrouille pas les dossiers privés existants. Les données bancaires initiales sont fournies sous forme chiffrée, jamais en clair dans le code public. Le coffre démarre avec la prestation demandée « Chez Julien », en brouillon protégé, sans facture ni encaissement.

## Parcours et garanties

- Saisie en trois étapes, carnet de clients, duplication et détection des chevauchements, y compris les prestations de nuit.
- Extraction locale et déterministe des dates, tarifs, acomptes, lieux et clients d’une phrase française. Toute extraction est relue dans le formulaire ; aucune IA distante n’est utilisée.
- Comptabilité des montants en centimes entiers. Échéances, frais supplémentaires, acomptes et soldes sont calculés en direct.
- Vrais PDF A4 (jsPDF sur web, Expo Print sur mobile). Devis, contrats, factures d’acompte, de solde, récapitulatifs non exigibles et avoirs.
- L’émission est une action explicite : elle attribue un numéro persistant et conserve un instantané des données. Aucun document émis n’est réécrit par une modification de fiche. Les corrections de factures passent par un avoir intégral référencé.
- La création d’un document ne déclenche **aucun encaissement ni e-mail**. Les paiements doivent être confirmés manuellement. Les statuts de suivi ne constituent pas une signature électronique.
- Brouillons de courriel `.eml` avec une véritable pièce jointe PDF ; import dans un logiciel compatible puis envoi par l’utilisateur. Pas de service SMTP.
- Rappels `.ics` à importer dans l’agenda de l’utilisateur. Pas de notifications distantes.
- Onze articles contractuels éditables, avec modèles distincts pour particuliers et professionnels.

## Confidentialité et récupération

Le stockage est **local à l’appareil et au navigateur**, sans base cloud ni télémétrie. AES-256-GCM avec un nonce aléatoire par écriture ; clé dérivée par PBKDF2-SHA256, 600 000 itérations et sel aléatoire. La clé déchiffrée ne quitte pas la mémoire de session. Toute modification est persistée avant affichage de la confirmation. Les conflits entre onglets sont détectés par contrôle de révision et Web Locks lorsqu’il est disponible.

Dans **Réglages → Données et sauvegardes**, exporter régulièrement le coffre chiffré `.mmstudio`. Une restauration sur un appareil sans coffre nécessite le mot de passe d’origine. Le JSON non chiffré exige une confirmation séparée. Une suppression du coffre nécessite re-saisie du mot de passe, sauvegarde puis confirmation textuelle. L’effacement des données du navigateur peut supprimer le coffre. Il n’existe pas de récupération du mot de passe par serveur.

Les exemples contractuels doivent être adaptés à la situation et aux obligations professionnelles ; ils ne sont pas présentés comme juridiquement validés. Le médiateur doit être renseigné pour émettre un contrat consommateur. Signature électronique qualifiée, synchronisation bancaire, dépôt via une plateforme de facturation électronique agréée : **non intégrés**.

## Exécution et vérification

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Le build effectue `expo export --platform all`, puis ajoute le manifeste PWA et le service worker qui met en cache uniquement les ressources publiques de l’interface. Les contenus privés et les PDF ne sont pas stockés dans le cache HTTP de la PWA.

`python scripts/qa-web.py` exécute le parcours navigateur de test sur le build statique. Playwright et Chromium sont nécessaires. Le test optionnel du coffre privé attend le code dans la variable `MM_STUDIO_ACTIVATION`. Le serveur temporaire utilisé par les tests est arrêté à leur fin.

Visuel du saxophone : photographie Unsplash `photo-1415201364774-f6f0bb35f28f`, recadrée et retravaillée pour le studio. Typographie Manrope, licence SIL Open Font License.
