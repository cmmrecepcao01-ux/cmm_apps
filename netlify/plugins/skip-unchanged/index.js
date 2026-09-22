// Plugin local do Netlify: restaura/salva, entre deploys, a pasta
// ".netlify-build-cache" — onde scripts/build-webapps.sh guarda o dist/
// já compilado de cada webapp junto com o commit em que foi gerado.
//
// Com isso o build-webapps.sh consegue pular a recompilação (npm install +
// vite build) de qualquer pasta que não teve nenhum arquivo alterado desde
// o último deploy com sucesso — o que economiza minutos de build sem
// nenhum risco: se o cache não existir, estiver incompleto, ou a pasta
// tiver mudado, o script simplesmente recompila normal (comportamento de
// hoje), nunca publica algo desatualizado.
const CACHE_DIR = ".netlify-build-cache";

module.exports = {
    onPreBuild: async ({ utils }) => {
        try {
            await utils.cache.restore(CACHE_DIR);
        } catch (e) {
            console.log("Sem cache de build anterior (normal na primeira vez):", e.message);
        }
    },
    onPostBuild: async ({ utils }) => {
        try {
            await utils.cache.save(CACHE_DIR);
        } catch (e) {
            console.log("Não foi possível salvar o cache de build:", e.message);
        }
    }
};
