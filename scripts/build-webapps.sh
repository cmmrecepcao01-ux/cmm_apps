#!/usr/bin/env bash
# Compila automaticamente qualquer pasta na raiz do repositório que tenha um
# package.json com script "build" (padrão Vite), e publica o conteúdo do
# dist/ no lugar da pasta original. Pastas sem package.json (a maioria,
# HTML/JS puro) não são tocadas — zero configuração manual no Netlify para
# cada novo webapp criado no futuro.
#
# Importante: um erro de build EM UMA pasta (ex.: bug de TypeScript no
# código daquele webapp) NÃO pode derrubar o deploy inteiro e tirar do ar
# as outras ferramentas que já funcionam. Por isso não usamos "set -e" no
# laço principal — cada pasta é tentada de forma isolada; se falhar, fica
# um aviso no log e a pasta é publicada como estava (sem build novo), e o
# script segue para as próximas.
#
# Cache entre deploys (pasta .netlify-build-cache/, restaurada/salva pelo
# plugin local netlify/plugins/skip-unchanged): para cada pasta compilada
# com sucesso, guardamos o dist/ gerado e o commit em que foi gerado. No
# próximo deploy, se a pasta não tiver nenhum arquivo alterado desde esse
# commit, reaproveitamos o dist/ salvo em vez de rodar "npm install" e
# "npm run build" de novo — economiza minutos de build. Se não houver
# cache, a pasta mudou, ou o diff falhar por qualquer motivo, compila
# normal — nunca arrisca publicar algo desatualizado.
CACHE_DIR=".netlify-build-cache"
mkdir -p "$CACHE_DIR"
FALHOU=0

for dir in */ ; do
    pasta="${dir%/}"

    # pula pastas técnicas que não são webapps
    case "$pasta" in
        netlify|scripts|node_modules) continue ;;
    esac

    if [ -f "$pasta/package.json" ] && grep -q '"build"' "$pasta/package.json"; then
        CACHE_SHA_FILE="$CACHE_DIR/$pasta/commit.txt"
        CACHE_DIST_DIR="$CACHE_DIR/$pasta/dist"
        PODE_REUSAR=0

        if [ -f "$CACHE_SHA_FILE" ] && [ -d "$CACHE_DIST_DIR" ]; then
            CACHED_SHA=$(cat "$CACHE_SHA_FILE" 2>/dev/null || echo "")
            if [ -n "$CACHED_SHA" ] && git rev-parse --verify "$CACHED_SHA" >/dev/null 2>&1; then
                if git diff --quiet "$CACHED_SHA" HEAD -- "$pasta" 2>/dev/null; then
                    PODE_REUSAR=1
                fi
            fi
        fi

        if [ "$PODE_REUSAR" = "1" ]; then
            echo ">>> $pasta sem alterações desde o último deploy — reaproveitando build salvo (sem gastar minutos de build)."
            rm -rf "${pasta}__publish_tmp"
            mkdir "${pasta}__publish_tmp"
            cp -r "$CACHE_DIST_DIR/." "${pasta}__publish_tmp/"
            rm -rf "$pasta"
            mv "${pasta}__publish_tmp" "$pasta"
            continue
        fi

        echo ">>> Compilando $pasta..."
        # chmod +x nos binários do node_modules/.bin: em algumas pastas o
        # npm install restaura os arquivos sem permissão de execução
        # (ex.: quando node_modules já veio commitado no git sem esse bit),
        # o que quebra "npm run build" com "vite: Permission denied".
        if (cd "$pasta" && npm install && (chmod +x node_modules/.bin/* 2>/dev/null || true) && npm run build); then
            if [ -d "$pasta/dist" ]; then
                echo ">>> Publicando build de $pasta..."

                # salva no cache pro próximo deploy poder pular esta pasta
                # se ela não mudar
                mkdir -p "$CACHE_DIR/$pasta"
                rm -rf "$CACHE_DIST_DIR"
                cp -r "$pasta/dist" "$CACHE_DIST_DIR"
                git rev-parse HEAD > "$CACHE_SHA_FILE" 2>/dev/null || rm -f "$CACHE_SHA_FILE"

                rm -rf "${pasta}__publish_tmp"
                mkdir "${pasta}__publish_tmp"
                cp -r "$pasta/dist/." "${pasta}__publish_tmp/"
                rm -rf "$pasta"
                mv "${pasta}__publish_tmp" "$pasta"
            else
                echo ">>> AVISO: $pasta tem script build mas não gerou pasta dist/ — pulando."
            fi
        else
            echo ">>> ERRO: falha ao compilar $pasta — pasta mantida como estava (sem build novo), demais pastas continuam normalmente."
            FALHOU=1
        fi
    fi
done

if [ "$FALHOU" = "1" ]; then
    echo ">>> Uma ou mais pastas falharam ao compilar (veja os erros acima). O restante do site foi publicado normalmente."
fi

exit 0
