#!/usr/bin/env bash
set -euo pipefail

APP_SHELL="src/components/app-shell.tsx"

if [[ ! -f "$APP_SHELL" ]]; then
  echo "Не найден $APP_SHELL. Запусти скрипт из корня nct-navigator-front." >&2
  exit 1
fi

if grep -q 'pathname === "/presentation"' "$APP_SHELL"; then
  echo "AppShell уже поддерживает /presentation."
  exit 0
fi

python3 - <<'PY'
from pathlib import Path
path = Path("src/components/app-shell.tsx")
text = path.read_text(encoding="utf-8")
needle = "  if (!isServerAvailable) {"
replacement = '''  if (pathname === "/presentation") {
    return <>{children}</>;
  }

  if (!isServerAvailable) {'''
if needle not in text:
    raise SystemExit("Не удалось найти точку вставки в AppShell. Добавьте проверку вручную по INSTALL.md.")
path.write_text(text.replace(needle, replacement, 1), encoding="utf-8")
PY

echo "Готово: /presentation исключён из стандартного AppShell."
