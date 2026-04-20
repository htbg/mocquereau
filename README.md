# Mocquereau

Ferramenta desktop (Electron) para construir tabelas neumáticas comparativas a partir de manuscritos de canto gregoriano.

Nomeada em homenagem a **Dom André Mocquereau, O.S.B. (1849–1930)** — monge de Solesmes e pioneiro da paleografia neumática.

![Status](https://img.shields.io/badge/status-ALPHA-orange)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)

## O que faz

Compara como uma mesma peça litúrgica aparece em manuscritos diferentes, recortando neuma por sílaba e montando a tabela automaticamente — substituindo o processo manual no Word, inviável para peças com muitas fontes.

- Silabificação automática em latim litúrgico (5 modos, ver abaixo)
- Gerenciamento de fontes com metadados RISM + import do Gueranger
- Carregamento de imagens via drag-and-drop, clipboard, diálogo ou IIIF
- Editor de recorte com bounding boxes por sílaba (8 handles, estilo Word), múltiplas imagens por manuscrito
- Ajustes de imagem reversíveis: brilho, contraste, saturação, grayscale, negativo, rotação, espelhamento
- Exportação DOCX em paisagem, pronto para publicação acadêmica

## Downloads

Instaladores em [Releases](https://github.com/AISCGre-BR/mocquereau/releases):

- Linux: `.AppImage` (x64)
- Windows: `.exe` (NSIS)
- macOS: `.dmg` (Intel e Apple Silicon, não assinado)

## Stack

Electron 41 · electron-vite 5 · React 19 · TypeScript 5.9 · Tailwind 4 · Hypher (silabificação) · docx (geração)

## Desenvolvimento

```bash
git clone https://github.com/AISCGre-BR/mocquereau
cd mocquereau
npm install
npm run dev      # modo desenvolvimento
npm test         # testes
npm run dist     # gerar instalador para o OS atual
```

Projetos são salvos como `.mocquereau.json` auto-contidos (imagens em base64, portáveis entre máquinas).

## Modos de silabificação

| Modo | Uso |
|---|---|
| **Cantado** (padrão) | Convenção cantada Solesmes/AISCGre, como no canto |
| **Litúrgico tipográfico** | Hifenização etimológica do `gregorio-project/hyphen-la` sem modificação |
| **Clássico** | Latim clássico pré-medieval |
| **Moderno** | Latim moderno |
| **Manual** | Hifens digitados pelo usuário |

O modo **Cantado** segue a sistematização do **Prof. Dr. Clayton Júnior Dias** (AISCGre Brasil, *Aula 7: Dicção do Latim — normas gerais*, Semiologia Gregoriana I), consistente com Solesmes em *Distinction des syllabes dans les mots latins* (Études Grégoriennes XLII, 2016). Implementado como pós-processador sobre a saída do Hypher + [gregorio-project/hyphen-la](https://github.com/gregorio-project/hyphen-la).

## Créditos

Projeto da **AISCGre Brasil** (Associação Internacional de Estudos de Canto Gregoriano — Seção Brasileira).

**Desenvolvimento:**
- Gabriel Honorato Teixeira Bernardo — equipe de TI da AISCGre Brasil

**Fonte canônica de silabificação cantada:**
- Prof. Dr. Clayton Júnior Dias (AISCGre Brasil)

**Bibliotecas e referências open source:**
- [Hypher](https://github.com/bramstein/hypher) — engine de hifenização (BSD)
- [gregorio-project/hyphen-la](https://github.com/gregorio-project/hyphen-la) — padrões de hifenização para latim litúrgico (MPL-2.0)
- [Mirador](https://github.com/ProjectMirador/mirador) (Apache-2.0, Stanford University) — referência de UX para os controles de ajuste de imagem (brilho, contraste, saturação, grayscale, negativo, rotação, espelhamento). Nenhum código foi reutilizado; apenas o padrão de interação para visualização de manuscritos em humanidades digitais.

Ver [NOTICE](NOTICE) para atribuições completas.

Contribuições via [issues](https://github.com/AISCGre-BR/mocquereau/issues) e pull requests.

## Licença

[GPL-3.0-or-later](LICENSE) · © 2026 AISCGre Brasil. Trabalhos derivados devem permanecer sob a mesma licença com código-fonte disponível.

## Aviso

Software distribuído NO ESTADO EM QUE SE ENCONTRA, sem garantias. Versões ALPHA são instáveis — faça backup de projetos `.mocquereau.json` e use em ambiente não-crítico. Cláusulas completas: seções 15 e 16 da [GPL-3.0](LICENSE).
