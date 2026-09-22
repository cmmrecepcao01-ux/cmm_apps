#!/usr/bin/env bash
# Compila automaticamente qualquer pasta na raiz do repositório que tenha um
# package.json com script "build" (padrão Vite), e publica o conteúdo do
# dist/ no lugar da pasta original. Pastas sem package.json (a maioria,
# HTML/JS puro) não são tocadas — zero configuração manual no Netlify para
# cada novo webapp criado no futuro.
set -e

for dir in */ ; do
    pasta="${dir%/}"

    # pula pastas técnicas que não são webapps
    case "$pasta" in
        netlify|scripts|node_modules) continue ;;
    esac

    if [ -f "$pasta/package.json" ] && grep -q '"build"' "$pasta/package.json"; then
        echo ">>> Compilando $pasta..."
        (cd "$pasta" && npm install && npm run build)

        if [ -d "$pasta/dist" ]; then
            echo ">>> Publicando build de $pasta..."
            rm -rf "${pasta}__publish_tmp"
            mkdir "${pasta}__publish_tmp"
            cp -r "$pasta/dist/." "${pasta}__publish_tmp/"
            rm -rf "$pasta"
            mv "${pasta}__publish_tmp" "$pasta"
        else
            echo ">>> AVISO: $pasta tem script build mas não gerou pasta dist/ — pulando."
        fi
    fi
done
