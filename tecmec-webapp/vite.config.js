import { defineConfig } from "vite";

export default defineConfig({
    // Caminhos relativos: o site publica esta pasta como subcaminho
    // (ex.: /tecmec-webapp/) dentro do domínio principal — com "base"
    // absoluto (padrão "/"), o Vite gera os links de CSS/JS apontando
    // pra raiz do domínio e os arquivos não são encontrados.
    base: "./",
    build: {
        outDir: "dist",
        assetsInlineLimit: 0
    }
});
