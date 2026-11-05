# Simulador de Funil Getup

Ferramenta interna da operação Getup Boutique Gym para calcular, junto com o franqueado, quantos leads cada unidade precisa, de quais fontes, quanto isso custa e se o volume é suficiente para bater a meta de matrículas.

- **Página:** `public/index.html` (um arquivo só, sem build)
- **API de cenários:** `functions/api/` (Cloudflare Pages Functions)
- **Armazenamento:** Cloudflare KV, com o nome `CENARIOS`
- **Acesso:** restrito à equipe pelo Cloudflare Access

## Estrutura

```
getup-simulador/
├── public/
│   └── index.html              ← a página do simulador
├── functions/
│   └── api/
│       ├── _middleware.js      ← checa armazenamento e acesso antes de toda rota
│       └── cenarios/
│           ├── index.js        ← GET  /api/cenarios       (lista)
│           └── [id].js         ← GET/PUT/DELETE /api/cenarios/:id
├── lib/
│   └── resposta.js             ← resposta JSON padrão
├── package.json                ← comandos para testar no computador
└── README.md
```

## Como os cenários são guardados

Cada cenário é uma unidade + mês (ex.: `bacacheri-dezembro-2026`). Salvar de novo o mesmo cenário substitui o atual, e a versão anterior fica guardada como backup por 90 dias. O e-mail de quem salvou é registrado automaticamente pelo Cloudflare Access.

---

## Passo a passo da primeira configuração

Leva cerca de 20 minutos. Você precisa de uma conta no GitHub e uma no Cloudflare (as duas gratuitas).

### 1. Subir o código no GitHub

1. Entre no GitHub e crie um repositório **privado** chamado `getup-simulador`, sem README.
2. Na página do repositório vazio, clique em **uploading an existing file**.
3. Arraste todo o conteúdo desta pasta (as pastas `public`, `functions`, `lib` e os arquivos `package.json`, `README.md`, `.gitignore`).
4. Clique em **Commit changes**.

### 2. Criar o armazenamento (KV) no Cloudflare

1. No painel do Cloudflare, vá em **Storage & Databases → KV**.
2. Clique em **Create**, dê o nome `getup-cenarios` e confirme.

### 3. Criar o site no Cloudflare Pages ligado ao GitHub

1. Vá em **Workers & Pages → Create → Pages → Connect to Git**.
2. Autorize o Cloudflare no GitHub e escolha o repositório `getup-simulador`.
3. Na configuração do build:
   - **Framework preset:** None
   - **Build command:** deixe vazio
   - **Build output directory:** `public`
4. Clique em **Save and Deploy**. Em um minuto o site fica no ar em `getup-simulador.pages.dev`.

### 4. Ligar o armazenamento ao site

1. No projeto `getup-simulador`, vá em **Settings → Bindings → Add → KV namespace**.
2. **Variable name:** `CENARIOS` (exatamente assim, em maiúsculas).
3. **KV namespace:** `getup-cenarios`.
4. Faça o mesmo para o ambiente **Preview**, se ele aparecer separado.

### 5. Restringir o acesso à operação (Cloudflare Access)

1. No painel, abra **Zero Trust**. Na primeira vez ele pede um nome para a equipe (ex.: `getup`) e um plano: escolha o **Free** (até 50 pessoas).
2. Vá em **Access → Applications → Add an application → Self-hosted**.
3. **Application name:** Simulador Getup.
4. **Domain:** `getup-simulador.pages.dev`. Adicione um segundo domínio `*.getup-simulador.pages.dev` para proteger também as versões de teste.
5. Em **Policies**, crie uma política **Allow** chamada "Operação Getup" com a regra:
   - **Emails ending in:** o domínio da empresa (ex.: `@getup.com.br`), ou
   - **Emails:** a lista de e-mails de quem pode entrar.
6. Em **Login methods**, deixe **One-time PIN** ligado (a pessoa recebe um código por e-mail). Se a equipe usa Google Workspace, dá para ligar o login com Google também.
7. Salve.

### 6. Ativar a trava extra da API

1. No projeto do Pages, vá em **Settings → Variables and Secrets → Add**.
2. **Name:** `EXIGIR_ACCESS` · **Value:** `1` · ambiente **Production**.
3. Vá em **Deployments** e clique em **Retry deployment** no mais recente para a variável valer.

Pronto. Abra o endereço, entre com o código do e-mail e use o simulador.

### 7. Endereço próprio (opcional)

Se o domínio da Getup já está no Cloudflare, vá em **Custom domains → Set up a custom domain** e use algo como `simulador.getup.com.br`. Depois adicione esse domínio também na aplicação do Access (passo 5.4).

---

## Como atualizar daqui para frente

Toda alteração enviada ao GitHub publica sozinha no Cloudflare em cerca de um minuto.

- **Pelo site do GitHub:** abra `public/index.html`, clique no lápis, cole a versão nova e clique em **Commit changes**.
- **Com o Claude:** peça a mudança, receba o arquivo novo e substitua no GitHub.

Para testar uma mudança grande sem afetar a equipe, crie uma branch no GitHub. O Cloudflare gera um endereço de teste separado para ela.

## Testar no computador (opcional, para quem programa)

```bash
npm install
npm run dev
# abre em http://localhost:8788
```

## Resolvendo problemas

| O que aparece | O que fazer |
|---|---|
| "Cenários indisponíveis no momento" | Confira o passo 4: o KV precisa se chamar `CENARIOS`. Depois faça um novo deploy. |
| "Sem permissão para salvar" | A pessoa não passou pelo Access, ou a variável `EXIGIR_ACCESS` está ligada sem o passo 5 configurado. |
| A página abre sem pedir login | O domínio usado não está na aplicação do Access. Adicione-o no passo 5.4. |
| Salvei e sumiu o que estava antes | A versão anterior fica no KV com o nome `backup:<cenário>:<data>` por 90 dias. Pelo painel do KV dá para copiar o conteúdo de volta. |
