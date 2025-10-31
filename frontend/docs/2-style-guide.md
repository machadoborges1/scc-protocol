# 2. Style Guide

**Status:** Updated

## 1. Principles

-   **Clarity:** Information must be presented clearly and concisely.
-   **Consistency:** The appearance and behavior of components must be consistent.
-   **Feedback:** Every user action must have immediate visual feedback.
-   **Aesthetics:** The aesthetics will be modern, clean, and functional, with subtle gradients and shadows to create depth.

## 2. Design System

-   **CSS Framework:** TailwindCSS
-   **Component Library:** shadcn/ui

## 3. Color Palette

We will use a color system based on HSL CSS variables to support **light** and **dark** modes. The colors are defined in `src/index.css`.

**CSS Variables in `:root` (Light Mode):**

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

**CSS Variables in `.dark` (Dark Mode):**

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

## 4. Typography

-   **Main Font:** The system's default font (sans-serif) is used to ensure performance and a native look.
-   **Hierarchy:** Defined with Tailwind's size classes (e.g., `text-3xl`, `text-xl`, `text-base`).

## 5. Base Components (shadcn/ui)

We will use a set of essential components to build the UI, ensuring visual and interaction consistency:

-   `Button`: For all clickable actions.
-   `Card`: For information containers.
-   `Input`: For forms.
-   `Tabs`: For section navigation.
-   `Dialog`: For modals.
-   `Toast` / `Sonner`: For transaction notifications and alerts.
