# Guide de Tests de Securite - Biblio-Poche

Ce document explique comment tester les 3 vulnerabilites principales (JWT, NoSQL Injection, XSS) et demontrer que l'application est protegee.

## Prerequis

1. **Demarrer le serveur backend** : `cd backend && node server.js`
2. **Avoir Postman installe** (ou utiliser curl)
3. **Creer un compte utilisateur de test**

---

## 1. SECURITE JWT (JSON Web Token)

### Analyse du code

Le middleware `backend/middleware/auth.js` verifie les tokens JWT :
- Verifie la presence du header `Authorization: Bearer <token>`
- Decode et valide le token avec `jwt.verify()`
- Rejette les tokens invalides/expires

### Tests a effectuer avec Postman

#### TEST 1.1 : Acces sans token (doit echouer)

```
Methode: GET
URL: http://localhost:5000/api/orders/myorders
Headers: (aucun Authorization)
```

**Resultat attendu:**
```json
{
    "message": "Non autorisé, token manquant"
}
```
Status: **401 Unauthorized**

---

#### TEST 1.2 : Acces avec token invalide/forge (doit echouer)

```
Methode: GET
URL: http://localhost:5000/api/orders/myorders
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJyb2xlIjoiYWRtaW4ifQ.FAUX_TOKEN_INVALIDE
```

**Resultat attendu:**
```json
{
    "message": "Token invalide"
}
```
Status: **401 Unauthorized**

---

#### TEST 1.3 : Token modifie/altere (doit echouer)

1. D'abord, connectez-vous pour obtenir un vrai token :
```
Methode: POST
URL: http://localhost:5000/api/auth/login
Body (JSON):
{
    "email": "votre@email.com",
    "password": "VotreMotDePasse123!"
}
```

2. Prenez le token recu et modifiez un caractere :
```
Methode: GET
URL: http://localhost:5000/api/orders/myorders
Headers:
  Authorization: Bearer <token_modifie_avec_un_caractere_change>
```

**Resultat attendu:**
```json
{
    "message": "Token invalide"
}
```
Status: **401 Unauthorized**

---

#### TEST 1.4 : Token valide (doit reussir)

```
Methode: GET
URL: http://localhost:5000/api/orders/myorders
Headers:
  Authorization: Bearer <votre_vrai_token>
```

**Resultat attendu:** Liste de vos commandes (peut etre vide `[]`)
Status: **200 OK**

---

#### TEST 1.5 : Tentative d'acces admin avec token user (doit echouer)

```
Methode: GET
URL: http://localhost:5000/api/admin/stats
Headers:
  Authorization: Bearer <token_utilisateur_normal>
```

**Resultat attendu:**
```json
{
    "message": "Acces refuse. Droits administrateur requis."
}
```
Status: **403 Forbidden**

---

### Protection demontree

- Les tokens sont signes avec une cle secrete (JWT_SECRET)
- Toute modification du token invalide la signature
- Les roles sont verifies (user vs admin)
- Les tokens expirent apres 7 jours

---

## 2. PROTECTION NoSQL INJECTION

### Analyse du code

Dans `authRoutes.js` ligne 37 :
```javascript
const user = await User.findOne({ email });
```

L'attaque NoSQL classique consiste a envoyer un objet au lieu d'une string :
```json
{ "email": { "$gt": "" }, "password": "x" }
```

Cela tenterait de matcher tous les documents ou email > "" (tous).

### Tests a effectuer avec Postman

#### TEST 2.1 : Injection NoSQL sur le login (doit echouer)

```
Methode: POST
URL: http://localhost:5000/api/auth/login
Headers:
  Content-Type: application/json
Body (raw JSON):
{
    "email": { "$gt": "" },
    "password": "nimportequoi"
}
```

**Resultat attendu:**
```json
{
    "message": "Identifiants invalides"
}
```
Status: **400 Bad Request**

---

#### TEST 2.2 : Injection avec operateur $ne (not equal)

```
Methode: POST
URL: http://localhost:5000/api/auth/login
Body (JSON):
{
    "email": { "$ne": "" },
    "password": { "$ne": "" }
}
```

**Resultat attendu:**
```json
{
    "message": "Identifiants invalides"
}
```
Status: **400 Bad Request**

---

#### TEST 2.3 : Injection avec $regex

```
Methode: POST
URL: http://localhost:5000/api/auth/login
Body (JSON):
{
    "email": { "$regex": ".*" },
    "password": "test"
}
```

**Resultat attendu:**
```json
{
    "message": "Identifiants invalides"
}
```
Status: **400 Bad Request**

---

#### TEST 2.4 : Login normal (doit reussir)

```
Methode: POST
URL: http://localhost:5000/api/auth/login
Body (JSON):
{
    "email": "votre@email.com",
    "password": "VotreVraiMotDePasse123!"
}
```

**Resultat attendu:** Token + infos utilisateur
Status: **200 OK**

---

### Pourquoi l'application est protegee

1. **Mongoose Cast Error** : Mongoose tente de convertir l'objet en String, ce qui echoue silencieusement ou retourne null

2. **Validation bcrypt** : Meme si la requete passait, `user.comparePassword()` comparerait le hash bcrypt et echouerait car le "password" injecte ne correspond pas

3. **Type checking implicite** : Le schema User definit email comme String, Mongoose rejette les objets

---

## 3. PROTECTION XSS (Cross-Site Scripting)

### Analyse du code

Dans `bookRoutes.js` lignes 44-48 :
```javascript
const cleanTitle = xss(req.body.title);
const cleanAuthor = xss(req.body.author);
const cleanCategory = xss(req.body.category);
const cleanDescription = xss(req.body.description);
const cleanImage = xss(req.body.image);
```

La fonction `xss()` transforme `<script>alert('xss')</script>` en `&lt;script&gt;alert('xss')&lt;/script&gt;`

### Tests a effectuer avec Postman

#### TEST 3.1 : Injection XSS dans le titre d'un livre

```
Methode: POST
URL: http://localhost:5000/api/books
Headers:
  Content-Type: application/json
Body (JSON):
{
    "title": "<script>alert('XSS')</script>",
    "author": "Hacker",
    "price": 10,
    "category": "Test",
    "description": "Test XSS"
}
```

**Resultat attendu:** Le livre est cree mais le titre est nettoye :
```json
{
    "_id": "...",
    "title": "&lt;script&gt;alert('XSS')&lt;/script&gt;",
    "author": "Hacker",
    ...
}
```
Status: **201 Created**

**Verification:** Le script est echappe et ne s'executera pas dans le navigateur.

---

#### TEST 3.2 : XSS avec balise img onerror

```
Methode: POST
URL: http://localhost:5000/api/books
Body (JSON):
{
    "title": "<img src=x onerror=alert('XSS')>",
    "author": "Test",
    "price": 5,
    "category": "Test"
}
```

**Resultat attendu:**
```json
{
    "title": "<img src=\"x\">",
    ...
}
```
L'attribut `onerror` malveillant est supprime.

---

#### TEST 3.3 : XSS dans la description avec iframe

```
Methode: POST
URL: http://localhost:5000/api/books
Body (JSON):
{
    "title": "Livre Test",
    "author": "Auteur",
    "price": 15,
    "category": "Test",
    "description": "<iframe src='http://evil.com'></iframe><script>document.cookie</script>"
}
```

**Resultat attendu:**
```json
{
    "description": "&lt;iframe src=\"http://evil.com\"&gt;&lt;/iframe&gt;&lt;script&gt;document.cookie&lt;/script&gt;",
    ...
}
```
Les balises dangereuses sont echappees.

---

#### TEST 3.4 : XSS dans le champ image (URL malveillante)

```
Methode: POST
URL: http://localhost:5000/api/books
Body (JSON):
{
    "title": "Test Image",
    "author": "Test",
    "price": 10,
    "category": "Test",
    "image": "javascript:alert('XSS')"
}
```

**Resultat attendu:** L'URL javascript: est conservee mais inoffensive car :
- L'image ne se chargera pas (URL invalide)
- Le navigateur moderne bloque `javascript:` dans les src d'images

---

#### TEST 3.5 : Verifier un livre cree avec XSS

Apres avoir cree un livre avec du code malveillant :

```
Methode: GET
URL: http://localhost:5000/api/books/<id_du_livre_cree>
```

**Verification:** Le contenu retourne est echappe et sans danger.

---

### Protection demontree

1. **Sanitization avec xss()** : Toutes les entrees texte sont nettoyees
2. **Echappement HTML** : `<` devient `&lt;`, `>` devient `&gt;`
3. **Suppression des attributs dangereux** : `onerror`, `onclick`, etc.
4. **Protection du User model** : `escapeHtml()` sur username/email

---

## 4. BONUS : Autres protections implementees

### Rate Limiting

```
Methode: Envoyer 10001 requetes en 15 minutes
```
**Resultat:** Apres la limite, erreur 429 Too Many Requests

### Helmet (En-tetes de securite)

```
Methode: GET
URL: http://localhost:5000/
```
**Verifier les headers de reponse :**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (desactive car obsolete, CSP prefere)

### Hashage des mots de passe

Les mots de passe sont hashes avec bcrypt (salt 10), jamais stockes en clair.

---

## 5. Script de test automatise

Un script de test existe deja : `backend/security-tests/scan.js`

Pour l'executer :
```bash
cd backend
node security-tests/scan.js
```

Ce script teste automatiquement :
1. Atteignabilite du serveur
2. En-tetes de securite (Helmet)
3. Configuration CORS
4. Injection NoSQL
5. XSS stocke
6. Force du JWT_SECRET
7. Exposition Swagger

---

## Resume des tests

| Vulnerabilite | Test | Resultat attendu | Protection |
|---------------|------|------------------|------------|
| JWT | Token manquant | 401 Unauthorized | Middleware auth |
| JWT | Token forge | 401 Unauthorized | jwt.verify() |
| JWT | Token modifie | 401 Unauthorized | Signature HMAC |
| JWT | User accede admin | 403 Forbidden | Middleware admin |
| NoSQL | { "$gt": "" } | 400 Bad Request | Mongoose + bcrypt |
| NoSQL | { "$ne": "" } | 400 Bad Request | Type casting |
| XSS | `<script>` | Echappe | xss() library |
| XSS | `<img onerror>` | Attribut supprime | xss() library |
| XSS | `<iframe>` | Echappe | xss() library |

---

## Conclusion

L'application Biblio-Poche implemente plusieurs couches de securite :

1. **Authentification JWT** avec verification de signature et expiration
2. **Protection NoSQL** via Mongoose et validation bcrypt
3. **Protection XSS** avec la librairie xss sur toutes les entrees
4. **Rate limiting** contre les attaques par force brute
5. **Helmet** pour securiser les en-tetes HTTP
6. **Hashage bcrypt** des mots de passe
7. **Validation des roles** (user/admin)

Ces mesures permettent de proteger l'application contre les attaques les plus courantes du Top 10 OWASP.
