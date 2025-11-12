# Configuration Vercel - Variables d'environnement

## Désactiver la donation sur Vercel

Pour désactiver le bouton de donation sur la version déployée sur Vercel :

1. Allez sur votre dashboard Vercel
2. Sélectionnez le projet **EdtForFet**
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez une nouvelle variable :
   - **Name**: `ENABLE_DONATION`
   - **Value**: `false`
   - **Environment**: Production (et éventuellement Preview)
5. Redéployez l'application

## Build Command avec variable d'environnement

Si vous voulez injecter la variable au moment du build, modifiez le Build Command dans Vercel :

```bash
ENABLE_DONATION=false npm run build
```

## Notes

- Par défaut (en local), la donation est **activée**
- Sur Vercel avec `ENABLE_DONATION=false`, le bouton ❤️ sera **caché**
- Le code reste présent dans l'application, seul l'affichage est contrôlé
