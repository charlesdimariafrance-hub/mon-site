# Mettre en place les réservations dans Supabase

À faire une seule fois, dans l'ordre. Comptez 10 minutes.
Vous allez copier-coller 4 fichiers dans Supabase, puis créer votre compte admin.

## Avant de commencer

1. Allez sur <https://supabase.com> et connectez-vous.
2. Ouvrez le projet du site (son adresse commence par `bizuvwzgtmoosadxouqk`).

## Étapes 1 à 3 : créer les tables et les fonctions

Pour **chacun** des fichiers suivants, dans cet ordre :

| Étape | Fichier | Ce qu'il fait |
|---|---|---|
| 1 | `supabase/01_tablas.sql` | Crée les tables (personnes, réservations, admins) |
| 2 | `supabase/02_funciones.sql` | Crée les fonctions du formulaire du site |
| 3 | `supabase/03_admin.sql` | Crée les fonctions de la page admin |

1. Dans la colonne de gauche, cliquez sur **SQL Editor** (l'icône `>_`).
2. Cliquez sur **+ New query** (ou « New SQL snippet »).
3. Ouvrez le fichier, sélectionnez **tout** son contenu (Ctrl+A / Cmd+A), copiez-le et collez-le dans la grande zone de texte.
4. Cliquez sur **Run** en bas à droite (ou Ctrl+Entrée / Cmd+Entrée).
5. En bas doit s'afficher **« Success. No rows returned »**.
   - Si Supabase affiche un avertissement du type *« This query has destructive operations »*, c'est normal (le fichier remplace une ancienne fonction) : cliquez sur **Run this query**.
   - Si un message rouge apparaît, arrêtez-vous et envoyez-moi une capture d'écran.

Les fichiers peuvent être relancés sans danger : ils ne dupliquent rien et n'effacent aucune donnée.

## Étape 4 : importer les inscrits de Tally

Le fichier `04_importar_tally.sql` vous est envoyé à part : il contient les DNI,
il n'est **pas** dans le dépôt du site. Ne le partagez pas.

1. **SQL Editor** → **+ New query**, collez tout le contenu de `04_importar_tally.sql`, puis **Run**.
2. Message attendu : « Success. No rows returned ».

## Étape 5 : vérifier et corriger

1. Dans la colonne de gauche, cliquez sur **Table Editor**, puis sur la table **personas**.
2. Vous devez voir autant de lignes que le nombre de personnes annoncé à l'import.
3. Corrigez ce qui doit l'être en double-cliquant sur une case, puis Entrée :
   - un apellido « ? » veut dire qu'il manquait dans Tally : remplacez-le par le vrai ;
   - vérifiez que chaque prénom est bien dans « nombre » et chaque nom de famille dans « apellido »
     (Tally n'avait qu'un seul champ, le dernier mot a été pris comme apellido).

## Étape 6 : créer votre compte admin

1. Dans la colonne de gauche, cliquez sur **Authentication**, puis **Users**.
2. Cliquez sur **Add user** → **Create new user**.
3. Email : `cheondanse@gmail.com`. Mot de passe : choisissez-en un solide et notez-le.
4. Cochez **Auto Confirm User**, puis **Create user**.

C'est ce mot de passe que vous taperez sur la page `admin.html` du site.
Seul l'email `cheondanse@gmail.com` peut voir les listes avec les DNI
(pour ajouter une autre personne, il faudra l'ajouter dans la table `admins`).

## Ensuite

Une fois le site publié (après votre validation) :

- **Section « Reservar »** du site : les 4 boutons enregistrent directement dans Supabase.
- **`/admin.html`** : choisissez un samedi → « Descargar Excel » → fichier prêt pour Mecubro
  (Nombre, Apellido, DNI, Fecha de nacimiento). Les dimanches donnent la liste du Brunch & Bal.
- **`participantes.html`** affiche les inscrits du samedi depuis Supabase (prénom + initiale seulement).

## Où sont les données, et qui peut les voir

- Tout est dans votre projet Supabase, tables `personas` et `reservas`.
- Le site public ne peut **ni lire ni lister** ces tables. Il peut seulement : chercher un prénom
  (et ne reçoit que le prénom, plus l'apellido en cas de doublon), inscrire quelqu'un, réserver une date.
- Les DNI, dates de naissance et contacts ne sont visibles que dans Supabase et sur `admin.html` après connexion.
- Pour annuler une réservation : **Table Editor** → **reservas** → sélectionnez la ligne → **Delete**.
