# Калимаёбак — Android / iOS build

## Файлҳои лозим
Дар папкаи асосии ҳамин лоиҳа бояд файлҳои бозии вебӣ бошанд:
- `index.html`
- `style.css`
- `script.js`

Ин баста файлҳои Capacitor, логотип ва GitHub Actions workflow-ро илова мекунад.

## Ҷойгиркунӣ
1. Ин файлҳоро ба решаи repository-и бозии худ гузоред.
2. Папкаи `.github/workflows/` бояд айнан ҳамин ном дошта бошад.
3. `logo.svg`-ро ба HTML пайваст кунед. Масалан, дар `<head>`:
   `<link rel="icon" type="image/svg+xml" href="logo.svg">`
4. Дар header-и HTML метавонед логотипро чунин нишон диҳед:
   `<img src="logo.svg" alt="Калимаёбак" width="42" height="42">`
5. Ҳама тағйиротро ба branch-и `main` push кунед.

## Гирифтани APK
GitHub → repository → Actions → workflow-и
"Build KalimaYobak Android and iOS" → охирин run → Artifacts →
`KalimaYobak-Android-APK`-ро зеркашӣ кунед.
Дар дохили ZIP файли `app-debug.apk` ҳаст. Ин APK барои санҷиш аст.

## iOS
Workflow файли `KalimaYobak-iOS-Simulator.zip` месозад.
Ин build барои iOS Simulator аст, на IPA-и барои насб ба iPhone.
Барои IPA-и воқеӣ сертификати Apple Distribution ва provisioning profile
лозим аст; инчунин бояд signing дар GitHub Actions танзим карда шавад.

## Build-и аввал дар компютер (ихтиёрӣ)
`npm install`
`npm run copy:web`
`npx cap add android`
`npx cap sync android`

Барои Android Studio:
`npx cap open android`

Барои iOS (танҳо macOS бо Xcode):
`npx cap add ios`
`npx cap sync ios`
`npx cap open ios`
