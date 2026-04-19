# Sécurité et conformité Loi 25

## Obligations légales
- Loi 25 du Québec (obligatoire)
- LPRPDE fédérale
- COPPA pour usagers hors Canada

## Exigences techniques
- Consentement parental vérifiable (code 6 chiffres + double opt-in courriel)
- Export des données en JSON et PDF
- Suppression avec délai de grâce 30 jours
- Journal ConsentRecord immuable
- Journal AuditLog immuable
- TLS 1.3 en transit, AES-256 au repos (pgcrypto)
- Argon2id pour les mots de passe
- Rate limiting sur auth
- Headers sécurité stricts

## RPRP
La plateforme doit désigner un responsable de la protection
des renseignements personnels. Contact publié dans la politique.