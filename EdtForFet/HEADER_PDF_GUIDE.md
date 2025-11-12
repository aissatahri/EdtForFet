# Guide: En-tête PDF avec Logo

## ✅ Modifications effectuées

J'ai ajouté un en-tête professionnel aux exports PDF avec les éléments suivants :

### 1. 📋 Nouvelle méthode `addPdfHeader()`
Cette méthode génère automatiquement l'en-tête avec :
- **Logo centré** (si disponible)
- **Lignes de texte configurables** (4 lignes)
- **Année scolaire** à gauche
- **Titre "جدول الدروس"** au centre
- **Nom de l'entité** (professeur/classe/salle)

### 2. 🎨 Nouvelles propriétés de configuration

Dans l'objet `config`, j'ai ajouté :
```typescript
headerLine1: 'المملكة المغربية'
headerLine2: 'وزارة التربية الوطنية والتعليم الأولي والرياضة'
headerLine3: '' // Ligne optionnelle (vide par défaut)
headerLine4: 'جهة الشرق – مديرية وجدة – أنجاد – ثانوية عبد الرحمان حجيرة الإعدادية – وحدة'
```

### 3. 🖼️ Formulaire de configuration amélioré

Dans le modal de configuration (⚙️ إعدادات), onglet "📋 معلومات المؤسسة", vous pouvez maintenant configurer :
- ✅ Shعار المؤسسة (logo)
- ✅ السطر الأول للترويسة
- ✅ السطر الثاني للترويسة
- ✅ السطر الثالث للترويسة (اختياري)
- ✅ السطر الرابع (معلومات المؤسسة)
- ✅ الموسم الدراسي

## 📝 Comment utiliser

### Étape 1 : Ajouter le logo
1. Cliquez sur le bouton **⚙️** (Configuration)
2. Dans l'onglet "📋 معلومات المؤسسة"
3. Cliquez sur "📁 اختر صورة الشعار"
4. Sélectionnez votre fichier de logo (PNG, JPG, SVG)
5. Le logo sera automatiquement converti en Base64 et sauvegardé

### Étape 2 : Configurer les lignes d'en-tête
1. Dans le même onglet, remplissez les champs :
   - **السطر الأول** : Exemple "المملكة المغربية"
   - **السطر الثاني** : Exemple "وزارة التربية الوطنية والتعليم الأولي والرياضة"
   - **السطر الثالث** : (Optionnel)
   - **السطر الرابع** : Exemple "جهة الشرق – مديرية وجدة – أنجاد – ثانوية..."

2. Cliquez sur **💾 حفظ**

### Étape 3 : Exporter le PDF
Utilisez normalement les boutons d'export :
- **📄 تصدير PDF** : Pour exporter une seule entité
- **📑 تصدير الكل PDF** : Pour exporter toutes les entités

L'en-tête sera automatiquement ajouté à chaque page ! 🎉

## 🎨 Structure de l'en-tête

```
┌───────────────────────────────────────┐
│         [LOGO CENTRÉ]                 │
│                                       │
│     المملكة المغربية (ligne 1)       │
│     وزارة التربية... (ligne 2)       │
│     (ligne 3 optionnelle)             │
│     جهة الشرق – مديرية... (ligne 4)  │
│                                       │
│ ─────────────────────────────────────│
│ الموسم الدراسي 2025-2026              │
│                                       │
│         جدول الدروس                  │
│         [Nom Entité]                  │
└───────────────────────────────────────┘
        [TABLEAU DES COURS]
```

## 🔧 Paramètres techniques

- **Position du logo** : Centré en haut (25x25mm)
- **Police** : Amiri (support parfait de l'arabe)
- **Taille de texte** : 
  - Lignes d'en-tête : 10pt
  - Titre principal : 16pt (bold)
  - Nom entité : 12pt
- **Espacement** : Le tableau commence après l'en-tête complet

## 💡 Notes importantes

1. ✅ Le logo est sauvegardé en Base64 dans localStorage
2. ✅ Toutes les configurations sont persistées
3. ✅ L'en-tête s'applique automatiquement à tous les exports PDF
4. ✅ Compatible avec les exports simples et multiples
5. ✅ Support RTL (right-to-left) pour l'arabe

## 🐛 Dépannage

**Si le logo ne s'affiche pas :**
- Vérifiez que le fichier est bien une image (PNG, JPG)
- La taille recommandée : moins de 1 MB
- Format carré recommandé pour un meilleur rendu

**Si les lignes ne s'affichent pas :**
- Vérifiez que vous avez cliqué sur **💾 حفظ** après modification
- Rechargez la page pour réinitialiser le localStorage si nécessaire

## 📂 Fichiers modifiés

- ✅ `src/app/app.component.ts` : Méthode `addPdfHeader()` + propriétés config
- ✅ `src/app/app.component.html` : Formulaire de configuration étendu
- ✅ `src/app/pdf-fonts.service.ts` : (Inchangé - déjà fonctionnel)

---

**Version** : 1.0  
**Date** : 2025  
**Auteur** : GitHub Copilot
