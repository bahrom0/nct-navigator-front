# Установка веб-презентации NCT Navigator

Пакет уже содержит готовую страницу, стили, компоненты, логотипы, настоящий QR-код и временные скриншоты.

## Самый простой способ на Windows

1. Распакуйте архив.
2. Скопируйте **содержимое** папки `nct-presentation-ready` в корень репозитория `nct-navigator-front`.
3. Откройте PowerShell в корне репозитория.
4. Выполните:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\apply-presentation.ps1
npm run lint
npm run build
```

5. Запустите проект:

```powershell
npm run dev
```

6. Откройте:

```text
http://localhost:3000/presentation
```

## Что меняется

Добавляются новые файлы:

```text
src/app/presentation/page.tsx
src/components/presentation/BrandMark.tsx
src/components/presentation/PhotoFrame.tsx
src/components/presentation/PresentationNavigation.tsx
src/components/presentation/PresentationShell.tsx
src/components/presentation/presentation.module.css
src/lib/presentation-content.ts
public/presentation/icon-nct-dark.png
public/presentation/icon-nct-light.png
public/presentation/mmtai-qr.png
public/photos/*.png
```

Единственное изменение существующего файла:

```text
src/components/app-shell.tsx
```

Перед блоком `if (!isServerAvailable)` добавляется:

```tsx
if (pathname === "/presentation") {
  return <>{children}</>;
}
```

Это убирает обычную шапку, профиль, чат-навигацию и maintenance-screen со страницы презентации.

## Если скрипт не сработал

Откройте:

```text
src/components/app-shell.tsx
```

Найдите:

```tsx
if (!isServerAvailable) {
```

И вставьте прямо перед ним:

```tsx
if (pathname === "/presentation") {
  return <>{children}</>;
}
```

## Управление

Следующий слайд:

```text
→  ↓  PageDown  Space
```

Предыдущий слайд:

```text
←  ↑  PageUp
```

Дополнительно:

```text
Home — первый слайд
End  — последний слайд
F    — полноэкранный режим
```

Работают также:

- кнопки в правом нижнем углу;
- номера слайдов сверху;
- вертикальный свайп на телефоне;
- колесо мыши или тачпад.

## Замена скриншотов

Замените файлы, не меняя имена:

```text
public/photos/hero.png
public/photos/product-main.png
public/photos/results.png
public/photos/plan.png
public/photos/architecture.png
```

Оптимально использовать PNG 1600×900.

## Git и Vercel

После успешной проверки:

```powershell
git status
git add .
git commit -m "feat: add interactive NCT Navigator presentation"
git push origin main
```

После push Vercel должен автоматически собрать проект. Production-адрес презентации:

```text
https://mmtai.xyz/presentation
```

## Важная проверка перед защитой

Проверьте:

- разрешение 1366×768;
- полноэкранный режим через `F`;
- переключение стрелками;
- настоящий QR-код;
- страницу при отключённом backend;
- отсутствие горизонтального скролла;
- все шесть экранов;
- ссылку `mmtai.xyz`.
