# 2. Guia de Estilo (Style Guide)

**Status:** Proposto

## 1. Princípios

-   **Clareza:** A informação deve ser apresentada de forma clara e concisa.
-   **Consistência:** A aparência e o comportamento dos componentes devem ser consistentes.
-   **Feedback:** Toda ação do usuário deve ter um feedback visual imediato.
-   **Inspiração:** A estética será minimalista e funcional, inspirada em DApps como Uniswap e Yearn Finance.

## 2. Sistema de Design

-   **Framework CSS:** TailwindCSS
-   **Biblioteca de Componentes:** shadcn/ui

## 3. Paleta de Cores (Tema: Slate)

Usaremos um sistema de cores baseado em variáveis CSS para suportar os modos **claro (light)** e **escuro (dark)**.

**Exemplo de Variáveis CSS em `globals.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 4. Tipografia

-   **Fonte Principal:** Inter (sans-serif), importada via Google Fonts.
-   **Hierarquia:** Definida com as classes de tamanho do Tailwind (ex: `text-2xl`, `text-lg`, `text-base`).

## 5. Componentes Base (shadcn/ui)

Utilizaremos um conjunto de componentes essenciais para construir a UI:

-   `Button`: Para ações.
-   `Card`: Para contêineres de informação.
-   `Input`: Para formulários.
-   `Tabs`: Para navegação em seções.
-   `Dialog`: Para modais.
-   `Toast`: Para notificações de transações.
