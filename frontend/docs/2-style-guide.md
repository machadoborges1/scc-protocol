# 2. Guia de Estilo (Style Guide)

**Status:** Atualizado

## 1. Princípios

-   **Clareza:** A informação deve ser apresentada de forma clara e concisa.
-   **Consistência:** A aparência e o comportamento dos componentes devem ser consistentes.
-   **Feedback:** Toda ação do usuário deve ter um feedback visual imediato.
-   **Estética:** A estética será moderna, limpa e funcional, com gradientes sutis e sombras para criar profundidade.

## 2. Sistema de Design

-   **Framework CSS:** TailwindCSS
-   **Biblioteca de Componentes:** shadcn/ui

## 3. Paleta de Cores

Usaremos um sistema de cores baseado em variáveis CSS HSL para suportar os modos **claro (light)** e **escuro (dark)**. As cores são definidas em `src/index.css`.

**Variáveis CSS em `:root` (Modo Claro):**

```css
:root {
    --background: 220 20% 97%;
    --foreground: 220 15% 10%;
    --card: 0 0% 100%;
    --card-foreground: 220 15% 10%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 15% 10%;
    --primary: 220 90% 56%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 15% 92%;
    --secondary-foreground: 220 15% 10%;
    --muted: 220 15% 92%;
    --muted-foreground: 220 10% 45%;
    --accent: 180 80% 50%;
    --accent-foreground: 220 15% 10%;
    --success: 142 76% 36%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 50%;
    --warning-foreground: 220 15% 10%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 15% 88%;
    --input: 220 15% 88%;
    --ring: 220 90% 56%;
    --radius: 0.75rem;
}
```

**Variáveis CSS em `.dark` (Modo Escuro):**

```css
.dark {
    --background: 220 25% 8%;
    --foreground: 220 10% 95%;
    --card: 220 20% 11%;
    --card-foreground: 220 10% 95%;
    --popover: 220 20% 11%;
    --popover-foreground: 220 10% 95%;
    --primary: 220 90% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 20% 16%;
    --secondary-foreground: 220 10% 95%;
    --muted: 220 20% 16%;
    --muted-foreground: 220 10% 60%;
    --accent: 180 80% 50%;
    --accent-foreground: 0 0% 100%;
    --success: 142 76% 40%;
    --success-foreground: 0 0% 100%;
    --warning: 38 92% 55%;
    --warning-foreground: 220 25% 8%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 20% 18%;
    --input: 220 20% 18%;
    --ring: 220 90% 60%;
}
```

## 4. Tipografia

-   **Fonte Principal:** A fonte padrão do sistema (sans-serif) é utilizada para garantir performance e uma aparência nativa.
-   **Hierarquia:** Definida com as classes de tamanho do Tailwind (ex: `text-3xl`, `text-xl`, `text-base`).

## 5. Componentes Base (shadcn/ui)

Utilizaremos um conjunto de componentes essenciais para construir a UI, garantindo consistência visual e de interação:

-   `Button`: Para todas as ações clicáveis.
-   `Card`: Para contêineres de informação.
-   `Input`: Para formulários.
-   `Tabs`: Para navegação em seções.
-   `Dialog`: Para modais.
-   `Toast` / `Sonner`: Para notificações de transações e alertas.